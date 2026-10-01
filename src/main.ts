import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule, ObserveInstrument } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';

const server = express();
let isInitialized = false;

export async function bootstrapServerless() {
  if (isInitialized) return server;
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    { instrument: ObserveInstrument },
  );
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  await app.init();
  isInitialized = true;
  return server;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const expressServer = await bootstrapServerless();
  expressServer(req, res);
}

if (!process.env.VERCEL) {
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
  await app.listen(Number(process.env.PORT ?? 3001));
}
