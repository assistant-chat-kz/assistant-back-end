import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { YandexGptService } from './services/yandex-gpt.service';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { YandexGptController } from './yandex-gpt/yandex-gpt.controller';
import { ClaudeAiController } from './claude-ai/claude-ai.controller';
// import { ChatController } from './chat/chat.controller';
// import { ChatService } from './chat/chat.service';
import { PrismaService } from './prisma.service'
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { PsychologistController } from './psychologist/psychologist.contoller';
import { PsychologistService } from './psychologist/psychologist.service';
import { ChatModule } from './chat/chat.module';
import { ConsultationController } from './consultation/consultation.controller';
import { ConsultationService } from './consultation/consultation.service';

import { ScheduleModule } from '@nestjs/schedule';
import { ChatMonitorService } from './chat.monitor.service';

@Module({
  imports: [AuthModule, ChatModule, ScheduleModule.forRoot()],
  controllers: [AppController, YandexGptController, UserController, AdminController, PsychologistController, ConsultationController, ClaudeAiController],
  providers: [AppService, YandexGptService, UserService, AdminService, PrismaService, PsychologistService, ConsultationService, ChatMonitorService],
  exports: [YandexGptService]
})
export class AppModule { }
