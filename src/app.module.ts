import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { YandexGptService } from './services/yandex-gpt.service';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { YandexGptController } from './yandex-gpt/yandex-gpt.controller';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { PrismaService } from './prisma.service'
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { PsychologistController } from './psychologist/psychologist.contoller';
import { PsychologistService } from './psychologist/psychologist.service';

@Module({
  imports: [AuthModule],
  controllers: [AppController, YandexGptController, UserController, ChatController, AdminController, PsychologistController],
  providers: [AppService, YandexGptService, UserService, ChatService, AdminService, PrismaService, PsychologistService],
  exports: [YandexGptService, ChatService]
})
export class AppModule { }
