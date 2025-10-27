import { Controller, Post, Body, Res } from "@nestjs/common";
import { Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

@Controller("claude-ai")
export class ClaudeAiController {
    private client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });

    @Post("stream")
    async stream(@Body() body: { prompt: string }, @Res() res: Response) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const stream = await this.client.messages.stream({
            model: "claude-sonnet-4-5",
            max_tokens: 1000,
            messages: [
                {
                    role: "user",
                    content: body.prompt,
                },
            ],
        });

        try {
            for await (const event of stream) {
                if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                    const text = event.delta.text;
                    res.write(text);
                }
            }
        } catch (err) {
            console.error("Stream error:", err);
        } finally {
            res.end();
        }
    }
}
