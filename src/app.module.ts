import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { YandexGptService } from './services/yandex-gpt.service';
import { YandexGptController } from './yandex-gpt/yandex-gpt.controller';

@Module({
  imports: [AuthModule],
  controllers: [AppController, YandexGptController],
  providers: [AppService, YandexGptService],
  exports: [YandexGptService]
})
export class AppModule { }
