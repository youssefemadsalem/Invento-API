import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/env.validation';

const CORS_MAX_AGE_SECONDS = 86400;



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
      origin: [
        'http://localhost:4200',
        'http://localhost:4300',
        'http://localhost:4400',
        'https://invento-user-site.vercel.app',
        'https://invento-site-builder.vercel.app',
        'https://invento-owner-dashboard.vercel.app',
      ],
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

