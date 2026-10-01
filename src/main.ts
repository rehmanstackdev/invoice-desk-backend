import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';

export async function createApp() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  return app;
}

let instance: any;

async function getInstance() {
  if (instance) return instance;
  const app = await createApp();
  await app.init();
  instance = app.getHttpAdapter().getInstance();
  return instance;
}

const handler = async (req: IncomingMessage, res: ServerResponse) => {
  const expressApp = await getInstance();
  return expressApp(req, res);
};

export default handler;

if (!process.env.VERCEL) {
  const app = await createApp();
  await app.listen(Number(process.env.PORT ?? 3001));
}
