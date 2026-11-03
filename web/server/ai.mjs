import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export class AiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function shortenAnswer(text, maxChars) {
  const clean = text.normalize('NFC').replace(/\s+/gu, ' ').trim();
  const points = Array.from(clean);
  if (points.length <= maxChars) return clean;
  const cut = points.slice(0, maxChars - 1).join('');
  const sentenceEnd = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (sentenceEnd >= cut.length * 0.6) return cut.slice(0, sentenceEnd + 1);
  const wordEnd = cut.lastIndexOf(' ');
  return (wordEnd >= cut.length * 0.7 ? cut.slice(0, wordEnd) : cut).trimEnd() + '…';
}

function providerError(status) {
  if (status === 401 || status === 403) return new AiError(502, 'GEMINI_AUTH', 'Gemini từ chối API key. Hãy kiểm tra key và quyền truy cập.');
  if (status === 429) return new AiError(429, 'GEMINI_LIMIT', 'Gemini đang giới hạn lượt hỏi. Bạn thử lại sau một chút nhé.');
  if (status === 404) return new AiError(502, 'GEMINI_MODEL', 'Model Gemini chưa khả dụng với key này. Hãy kiểm tra GEMINI_MODEL trong .env.');
  return new AiError(502, 'GEMINI_UNAVAILABLE', 'Chưa kết nối được Gemini. Bạn thử lại sau nhé.');
}

export async function createAiService({ config, getContext, fetchImpl = fetch, writeLog }) {
  const promptTemplate = await readFile(new URL('./prompts/explain-translation.txt', import.meta.url), 'utf8');
  const systemPrompt = promptTemplate.replaceAll('{{MAX_CHARS}}', String(config.maxChars));
  const usage = new Map();

  return async function explain(input, clientSignal, user) {
    if (!user?.id) throw new AiError(401, 'LOGIN_REQUIRED', 'Bạn cần đăng nhập để hỏi AI.');
    if (!input || !Number.isSafeInteger(input.lessonId) || input.lessonId < 1 || typeof input.segmentId !== 'string' || input.segmentId.length > 100 || typeof input.question !== 'string') {
      throw new AiError(400, 'INVALID_INPUT', 'Câu hỏi hoặc câu đang chọn không hợp lệ.');
    }
    const question = input.question.normalize('NFC').trim();
    if (!question || Array.from(question).length > 200) throw new AiError(400, 'INVALID_QUESTION', 'Nhập từ hoặc cụm từ cần hỏi, tối đa 200 ký tự.');
    const context = await getContext(input.lessonId, input.segmentId);
    if (!context) throw new AiError(404, 'CONTEXT_NOT_FOUND', 'Không tìm thấy câu đang chọn. Hãy mở lại bài đọc.');
    const now = Date.now();
    const budget = usage.get(user.id) || { active: 0, recent: [] };
    usage.set(user.id, budget);
    const recentRequests = budget.recent;
    while (recentRequests.length && recentRequests[0] <= now - 60000) recentRequests.shift();
    if (budget.active >= 2 || recentRequests.length >= 15) throw new AiError(429, 'TOO_MANY_REQUESTS', 'Bạn đang hỏi hơi nhanh. Hãy đợi một chút rồi thử lại.');
    recentRequests.push(now);
    budget.active++;
    const requestId = randomUUID();
    const record = {
      requestId,
      userId: user.id,
      timestamp: new Date().toISOString(),
      lessonId: input.lessonId,
      segmentId: input.segmentId,
      userInput: question,
      sourceEnglish: context.en,
      translationVietnamese: context.vi,
      model: config.model,
      answer: null,
      status: 'error',
    };
    let result;
    let failure;
    try {
      if (!config.apiKey) throw new AiError(503, 'AI_NOT_CONFIGURED', 'Hỏi AI chưa được bật. Điền GEMINI_API_KEY trong .env rồi khởi động lại web.');
      const signal = AbortSignal.any([AbortSignal.timeout(config.timeoutMs), ...(clientSignal ? [clientSignal] : [])]);
      const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey },
        signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: JSON.stringify({ question, sourceEnglish: context.en, translationVietnamese: context.vi }) }] }],
          generationConfig: { maxOutputTokens: 512, thinkingConfig: { thinkingLevel: 'MINIMAL' } },
        }),
      });
      if (!response.ok) {
        // Do not put provider error bodies into logs or browser responses:
        // they may contain request details or echoed credentials.
        await response.body?.cancel();
        throw providerError(response.status);
      }
      const payload = await response.json();
      const candidate = payload.candidates?.[0];
      const text = candidate?.content?.parts?.filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join(' ').trim();
      if (!text || payload.promptFeedback?.blockReason || ['SAFETY', 'RECITATION', 'PROHIBITED_CONTENT', 'BLOCKLIST'].includes(candidate.finishReason)) {
        throw new AiError(502, 'AI_NO_ANSWER', 'AI chưa trả lời được câu này. Bạn thử một từ hoặc cụm từ rõ hơn nhé.');
      }
      const answer = shortenAnswer(text, config.maxChars);
      record.answer = answer;
      record.status = 'success';
      result = { answer, maxChars: config.maxChars, requestId };
    } catch (error) {
      failure = error instanceof AiError ? error : error.name === 'TimeoutError'
        ? new AiError(504, 'AI_TIMEOUT', 'AI trả lời hơi lâu. Bạn thử lại nhé.')
        : error.name === 'AbortError'
          ? new AiError(499, 'AI_CANCELLED', 'Đã hủy câu hỏi.')
          : new AiError(502, 'AI_CONNECTION', 'Chưa kết nối được Gemini. Bạn thử lại sau nhé.');
      record.errorCode = failure.code;
    }
    try {
      record.durationMs = Date.now() - now;
      await writeLog(record);
    } catch {
      throw new AiError(503, 'AI_LOG_FAILED', 'Không lưu được nhật ký AI. Hãy kiểm tra database trên máy chủ.');
    } finally {
      budget.active--;
    }
    if (failure) throw failure;
    return result;
  };
}
