import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WhisperService } from './whisper.service';

@Controller('speech')
export class WhisperController {
    constructor(private whisper: WhisperService) { }

    @Post('recognize')
    @UseInterceptors(FileInterceptor('file'))
    async recognize(@UploadedFile() file: Express.Multer.File) {
        const text = await this.whisper.transcribe(file);
        return { text };
    }
}
