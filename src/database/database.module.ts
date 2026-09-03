import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Environment, EnvironmentVariables } from '../config/env.validation';
import 'pg'; // Force Vercel to include the pg package in the serverless bundle

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<EnvironmentVariables, true>,
      ) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', { infer: true }),
        port: configService.get('DATABASE_PORT', { infer: true }),
        username: configService.get('DATABASE_USER', { infer: true }),
        password: configService.get('DATABASE_PASSWORD', { infer: true }),
        database: configService.get('DATABASE_NAME', { infer: true }),
        autoLoadEntities: true,
        synchronize:
          configService.get('NODE_ENV', { infer: true }) ===
          Environment.Development,
        ssl:
          configService.get('NODE_ENV', { infer: true }) ===
          Environment.Production
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
  ],
})
export class DatabaseModule {}
