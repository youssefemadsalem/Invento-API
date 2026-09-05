import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/env.validation';

const CORS_MAX_AGE_SECONDS = 86400;



const expressApp = express();
expressApp.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.Origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    const configService =
      app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

    // app.enableCors disabled in favor of manual middleware

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

