// Exercise the real HTTP/session/SQLite pipeline without spending Gemini quota.
import path from 'node:path';
import { createStudyServer } from '../../server/app.mjs';
import { webRoot, projectRoot } from '../../server/config.mjs';

if (!process.env.STUDY_DB_PATH?.startsWith('outputs/e2e-')) throw new Error('E2E requires its own disposable SQLite database.');
const server = await createStudyServer({
  webRoot,
  config: {
    databasePath: path.join(projectRoot, process.env.STUDY_DB_PATH),
    apiKey: 'e2e-fake-provider-key', model: 'gemini-3.5-flash-lite', maxChars: 400, timeoutMs: 1000,
  },
  fetchImpl: async (_, options) => {
    const sent = JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: `Giải thích ngắn theo ngữ cảnh: ${sent.question}.` }] } }] }));
  },
});
server.listen(5174, '127.0.0.1', () => console.log('E2E: http://127.0.0.1:5174'));
