import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SpeechService } from './speech.service';

@Controller('speech')
export class SpeechController {
    constructor(private readonly speechService: SpeechService) { }

    @Post('recognize')
    @UseInterceptors(FileInterceptor('file'))
    async recognize(@UploadedFile() file: Express.Multer.File) {
        const text = await this.speechService.recognizeSpeech(file.buffer);
        return { text };
    }

}
