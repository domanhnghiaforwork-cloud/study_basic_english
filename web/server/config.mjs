import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const webRoot = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
export const projectRoot = path.dirname(webRoot);

export function loadConfiguration() {
  const envPath = path.join(projectRoot, '.env');
  try {
    process.loadEnvFile(envPath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Không đọc được .env ở thư mục gốc dự án.');
  }
  const maxChars = Number(process.env.AI_MAX_RESPONSE_CHARS || 400);
  if (!Number.isInteger(maxChars) || maxChars < 100 || maxChars > 800) {
    throw new Error('AI_MAX_RESPONSE_CHARS phải là số nguyên từ 100 đến 800.');
  }
  const model = (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error('GEMINI_MODEL không hợp lệ.');
  return {
    apiKey: (process.env.GEMINI_API_KEY || '').trim(),
    model,
    maxChars,
    timeoutMs: 25000,
    databasePath: path.resolve(projectRoot, process.env.STUDY_DB_PATH || 'storage/study.sqlite'),
  };
}
