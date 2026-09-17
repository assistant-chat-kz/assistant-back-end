import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import { randomUUID } from 'crypto';
import * as https from 'https';

const gigachatHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

interface GigaChatTokenResponse {
  access_token: string;
  expires_at: number;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

export interface GigaChatConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function buildGigaChatSystemPrompt(emotion?: string): string {
  return `Ты — бережный психологический помощник. Пиши тепло, спокойно, коротко и по делу. Не ставь диагнозы.

Правила диалога:
1. Сначала определи, достаточно ли информации, чтобы предложить полезное и конкретное решение.
2. Если информации недостаточно, задай ровно один короткий уточняющий вопрос и дождись ответа пользователя. В сообщении с уточняющим вопросом не предлагай решение, не добавляй список и не задавай несколько вопросов.
3. После ответа пользователя учитывай всю историю диалога. Если нужно ещё одно уточнение, снова задай только один вопрос. Не повторяй вопросы, на которые пользователь уже ответил.
4. Не задавай больше трёх уточняющих вопросов по одной проблеме. После этого предложи лучшее возможное решение на основе имеющейся информации и явно обозначь важные допущения.
5. Когда информации достаточно, не задавай новый вопрос. Дай решение одним сообщением: короткое вступление, затем один нумерованный список конкретных и реалистичных шагов с понятными отступами. Не дроби готовое решение на несколько сообщений.
6. Если пользователь сразу дал достаточно контекста или прямо просит конкретный план, переходи к итоговому решению без формальных уточнений.
7. Если есть признаки непосредственной опасности для пользователя или окружающих, не откладывай помощь ради уточнений: сначала мягко предложи обратиться по номеру 112 или к человеку рядом.${
    emotion ? `\nУчитывай эмоциональный фон текущего сообщения: ${emotion}.` : ''
  }`;
}

@Injectable()
export class GigaChatService {
  private readonly oauthUrl =
    process.env.GIGACHAT_OAUTH_URL ||
    'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
  private readonly apiUrl =
    process.env.GIGACHAT_API_URL ||
    'https://api.giga.chat/v1/chat/completions';
  private readonly authKey = process.env.GIGACHAT_AUTH_KEY;
  private readonly scope = process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';
  private readonly model = process.env.GIGACHAT_MODEL || 'GigaChat-2-Max';

  private cachedToken?: CachedToken;
  private tokenRequest?: Promise<string>;

  private async getAccessToken(forceRefresh = false): Promise<string> {
    if (!this.authKey) {
      throw new ServiceUnavailableException(
        'GigaChat не настроен: добавьте GIGACHAT_AUTH_KEY',
      );
    }

    if (
      !forceRefresh &&
      this.cachedToken &&
      this.cachedToken.expiresAt - 60_000 > Date.now()
    ) {
      return this.cachedToken.value;
    }

    if (!forceRefresh && this.tokenRequest) return this.tokenRequest;

    this.tokenRequest = this.requestAccessToken();
    try {
      return await this.tokenRequest;
    } finally {
      this.tokenRequest = undefined;
    }
  }

  private async requestAccessToken(): Promise<string> {
    const authorizationKey = this.authKey!.replace(/^Basic\s+/i, '').trim();
    const body = new URLSearchParams({ scope: this.scope });

    try {
      const response = await axios.post<GigaChatTokenResponse>(
        this.oauthUrl,
        body.toString(),
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${authorizationKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            RqUID: randomUUID(),
          },
          httpsAgent: gigachatHttpsAgent,
          timeout: 15_000,
        },
      );

      this.cachedToken = {
        value: response.data.access_token,
        expiresAt: response.data.expires_at,
      };
      return response.data.access_token;
    } catch (error) {
      this.throwApiError(error, 'Не удалось получить токен GigaChat');
    }
  }

  async streamText(
    messages: GigaChatConversationMessage[],
    emotion: string | undefined,
    onChunk: (chunk: string) => void,
    retry = true,
  ): Promise<void> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: buildGigaChatSystemPrompt(emotion),
            },
            ...messages,
          ],
          stream: true,
          max_tokens: 2000,
          repetition_penalty: 1,
        },
        {
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          httpsAgent: gigachatHttpsAgent,
          responseType: 'stream',
          timeout: 120_000,
        },
      );

      let buffer = '';
      for await (const chunk of response.data as AsyncIterable<Buffer>) {
        buffer += chunk.toString('utf8');
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;

          try {
            const event = JSON.parse(payload);
            const text = event.choices?.[0]?.delta?.content;
            if (typeof text === 'string' && text) onChunk(text);
          } catch {
            // An incomplete SSE event remains in the buffer; malformed service
            // events are skipped instead of interrupting the user's answer.
          }
        }
      }
    } catch (error: any) {
      if (retry && axios.isAxiosError(error) && error.response?.status === 401) {
        this.cachedToken = undefined;
        await this.getAccessToken(true);
        return this.streamText(messages, emotion, onChunk, false);
      }
      this.throwApiError(error, 'GigaChat не смог сформировать ответ');
    }
  }

  private throwApiError(error: unknown, fallback: string): never {
    if (axios.isAxiosError(error)) {
      const details = error.response?.data?.message || error.message;
      console.error('GigaChat API error:', error.response?.status, details);
    } else {
      console.error('GigaChat API error:', error);
    }
    throw new ServiceUnavailableException(fallback);
  }
}
