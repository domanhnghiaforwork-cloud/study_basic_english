import { createStudyServer } from '../server/app.mjs';
import { loadConfiguration, webRoot } from '../server/config.mjs';

const config = loadConfiguration();
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 5173);
const server = await createStudyServer({ webRoot, config });
server.listen(port, '0.0.0.0', () => {
  console.log(`Local: http://localhost:${server.address().port}`);
  console.log(config.apiKey ? `Ask AI: ${config.model} (${config.maxChars} characters maximum)` : 'Ask AI: add GEMINI_API_KEY to the project .env to enable it.');
});
