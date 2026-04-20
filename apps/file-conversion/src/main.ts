import 'dotenv/config';
import { createApp } from './app.js';

const app = createApp();
const port = parseInt(process.env.PORT || '4002', 10);

app.listen(port, () => {
  console.log(`File Conversion Service running on port ${port}`);
  console.log(`Supported types: ${process.env.SUPPORTED_TYPES || 'application/pdf, docx, audio'}`);
});
