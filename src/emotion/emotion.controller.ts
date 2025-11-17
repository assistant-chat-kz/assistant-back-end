import { Controller, Post, Body } from "@nestjs/common";
import { InferenceClient } from "@huggingface/inference";

@Controller("emotion")
export class EmotionController {
  private hfClient: InferenceClient;

  constructor() {
    if (!process.env.HF_TOKEN) throw new Error("HF_TOKEN не задан");
    this.hfClient = new InferenceClient(process.env.HF_TOKEN);
  }

  @Post()
  async analyze(@Body() body: { text: string }) {
    const { text } = body;

    try {
      const result = await this.hfClient.textClassification({
        model: "j-hartmann/emotion-english-distilroberta-base",
        inputs: text,
      });

      const top = result.sort((a, b) => b.score - a.score)[0];

      return {
        emotion: top.label,
        confidence: top.score,
      };
    } catch (error: any) {
      console.error("Ошибка анализа эмоции:", error.message || error);
      throw error;
    }
  }
}
