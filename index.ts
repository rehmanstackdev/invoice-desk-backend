import { createApp } from './src/main.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

let appInstance: any;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!appInstance) {
    const app = await createApp();
    await app.init();
    appInstance = app.getHttpAdapter().getInstance();
  }
  return appInstance(req, res);
}
