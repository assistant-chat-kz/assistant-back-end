import { Controller, Post, Body } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";

@Controller("claude-ai")
export class ClaudeAiController {
    private client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });

    @Post("generate")
    async generate(@Body() body: { prompt: string }) {
        const response = await this.client.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 1000,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: body.prompt,
                        },
                    ],
                },
            ],
        });

        const textContent = response.content
            .filter(block => block.type === "text")
            .map(block => block.text)
            .join("\n");

        return { text: textContent };
    }
}
