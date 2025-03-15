import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { YandexGptService } from './services/yandex-gpt.service';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { YandexGptController } from './yandex-gpt/yandex-gpt.controller';
import { ChatHistoryController } from './chat-history/chat-history.controller';
import { ChatHistoryService } from './chat-history/chat-history.service';
import { PrismaService } from './prisma.service'
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';


@Module({
  imports: [AuthModule],
  controllers: [AppController, YandexGptController, UserController, ChatHistoryController, AdminController],
  providers: [AppService, YandexGptService, UserService, ChatHistoryService, AdminService, PrismaService],
  exports: [YandexGptService, ChatHistoryService]
})
export class AppModule { }
