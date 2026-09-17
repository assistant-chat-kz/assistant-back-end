import { BadRequestException, Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  GigaChatConversationMessage,
  GigaChatService,
} from './gigachat.service';

const MAX_HISTORY_MESSAGES = 30;
const MAX_MESSAGE_LENGTH = 4_000;

function normalizeMessages(
  messages: GigaChatConversationMessage[] | undefined,
  prompt: string | undefined,
): GigaChatConversationMessage[] {
  const normalized = Array.isArray(messages)
    ? messages
        .filter(
          (message) =>
            (message?.role === 'user' || message?.role === 'assistant') &&
            typeof message.content === 'string' &&
            message.content.trim(),
        )
        .map((message) => ({
          role: message.role,
          content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH),
        }))
        .slice(-MAX_HISTORY_MESSAGES)
    : [];

  if (normalized.length === 0 && prompt?.trim()) {
    normalized.push({
      role: 'user',
      content: prompt.trim().slice(0, MAX_MESSAGE_LENGTH),
    });
  }

  return normalized;
}

@Controller('gigachat')
export class GigaChatController {
  constructor(private readonly gigaChatService: GigaChatService) {}

  @Post('stream')
  async stream(
    @Body()
    body: {
      prompt?: string;
      emotion?: string;
      messages?: GigaChatConversationMessage[];
    },
    @Res() response: Response,
  ) {
    const messages = normalizeMessages(body.messages, body.prompt);
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      throw new BadRequestException('a user message is required');
    }

    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');

    try {
      await this.gigaChatService.streamText(
        messages,
        body.emotion,
        (chunk) => response.write(chunk),
      );
    } catch (error: any) {
      if (!response.headersSent) {
        response.status(error?.status || 503);
      }
      response.write(
        '\n\nСейчас не получается связаться с GigaChat. Попробуйте ещё раз через минуту.',
      );
    } finally {
      response.end();
    }
  }
}
