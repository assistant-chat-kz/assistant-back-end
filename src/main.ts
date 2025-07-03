import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://147.182.189.56', 'https://aikouch.kz', 'https://www.aikouch.kz'],
    credentials: true,
  });

  await app.listen(4200);
}
bootstrap();
