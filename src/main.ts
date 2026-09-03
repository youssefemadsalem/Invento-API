import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/env.validation';

const CORS_MAX_AGE_SECONDS = 86400;

/** Splits the comma-separated `CORS_ORIGINS` env var into a clean origin list. */
function parseCorsOrigins(rawOrigins: string): string[] {
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter((origin) => origin.length > 0);
}

const expressApp = express();
let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    const configService =
      app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

    app.enableCors({
      origin: parseCorsOrigins(
        configService.get('CORS_ORIGINS', { infer: true }),
      ),
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: CORS_MAX_AGE_SECONDS,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    cachedApp = expressApp;
  }
  return cachedApp;
}

// Local Development
if (!process.env.VERCEL) {
  bootstrap().then(() => {
    // We use the port from env manually here since we bypass app.listen
    const port = process.env.PORT || 3000;
    expressApp.listen(port, () => {
      console.log(`Server listening locally on port ${port}`);
    });
  });
}

// For Vercel Serverless Deployment
export default async function handler(req: any, res: any) {
  const app = await bootstrap();
  app(req, res);
}

