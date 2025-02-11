import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class YandexGptService {
    private readonly API_URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
    private readonly API_KEY = process.env.YANDEX_API_KEY;
    private readonly FOLDER_ID = process.env.YANDEX_FOLDER_ID;

    async generateText(prompt: string): Promise<string> {
        console.log("YANDEX_API_KEY:", this.API_KEY ? this.API_KEY : "Не найден");
        console.log("YANDEX_FOLDER_ID:", this.FOLDER_ID ? this.FOLDER_ID : "Не найден");

        try {
            const requestBody = {
                modelUri: `gpt://${this.FOLDER_ID}/yandexgpt`,
                completionOptions: { stream: false, temperature: 0.6, maxTokens: 2000 },
                messages: [{ role: 'user', text: prompt }]
            };

            console.log("Отправка запроса:", requestBody);

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
