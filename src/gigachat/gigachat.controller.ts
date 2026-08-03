import { BadRequestException, Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { GigaChatService } from './gigachat.service';

@Controller('gigachat')
export class GigaChatController {
  constructor(private readonly gigaChatService: GigaChatService) {}

  @Post('stream')
  async stream(
    @Body() body: { prompt?: string; emotion?: string },
    @Res() response: Response,
  ) {
    if (!body.prompt?.trim()) {
      throw new BadRequestException('prompt is required');
    }

    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');

    try {
      await this.gigaChatService.streamText(
        body.prompt,
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
