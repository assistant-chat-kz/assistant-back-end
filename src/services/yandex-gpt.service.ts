import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class YandexGptService {
    private readonly API_URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
    private readonly API_KEY = process.env.YANDEX_API_KEY;
    private readonly FOLDER_ID = process.env.YANDEX_FOLDER_ID;

    async generateText(prompt: string): Promise<string> {


        try {
            const requestBody = {
                modelUri: `gpt://${this.FOLDER_ID}/yandexgpt`,
                completionOptions: { stream: false, temperature: 0.6, maxTokens: 2000 },
                messages: [{ role: 'user', text: prompt }]
            };


            const response = await axios.post(
                this.API_URL,
                requestBody,
                {
                    headers: {
                        'Authorization': `Api-Key ${this.API_KEY}`,
                        'Content-Type': 'application/json',
                        'x-folder-id': this.FOLDER_ID
                    }
                }
            );

            return response.data.result.alternatives[0].message.text;
        } catch (error) {
            console.error('YandexGPT API Error:', error.response?.data || error.message);
            throw new Error(`Ошибка при генерации текста: ${error.response?.data?.message || error.message}`);
        }
    }
}
