import 'reflect-metadata';
import 'dotenv/config';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    const app = await createApp();
    app.listen(config.app.port, () => {
      logger.info({ port: config.app.port }, 'AI Chat Service started');
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.fatal({ error, errorMessage }, 'Failed to start AI Chat Service');
    process.exit(1);
  }
}

main();
