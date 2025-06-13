import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://147.182.189.56', 'http://aikouch.kz', 'http://www.aikouch.kz'],
    credentials: true,
  });

  await app.listen(4200);
}
bootstrap();
