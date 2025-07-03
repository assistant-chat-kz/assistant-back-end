import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://aikouch.kz', 'https://www.aikouch.kz'],
    credentials: true,
  });

  await app.listen(4200);
}
bootstrap();
