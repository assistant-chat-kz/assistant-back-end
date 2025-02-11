import { Controller, Post, Body } from "@nestjs/common";
import { YandexGptService } from "../services/yandex-gpt.service";

@Controller('yandex-gpt')
export class YandexGptController {
    constructor(private readonly yandexGptService: YandexGptService) { }

    @Post('generate')
    async generate(@Body('prompt') prompt: string) {
        return { response: await this.yandexGptService.generateText(prompt) }
    }
}