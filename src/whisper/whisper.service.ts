import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class WhisperService {
    private whisperPath = path.resolve(
        'whisper.cpp/build/bin/whisper-cli.exe'
    );

    private modelPath = path.resolve(
        'whisper.cpp/build/bin/ggml-base.bin'
    );

    async transcribe(file: Express.Multer.File): Promise<string> {
        const wavBuffer = await this.convertWebmToWav(file.buffer);
        const text = await this.runWhisper(wavBuffer);
        return text.trim();
    }

    // 🎧 webm → wav (в памяти)
    private convertWebmToWav(webmBuffer: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', 'pipe:0',
                '-ac', '1',
                '-ar', '16000',
                '-f', 'wav',
                'pipe:1',
            ]);

            const chunks: Buffer[] = [];

            ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
            ffmpeg.stderr.on('data', () => { });

            ffmpeg.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error('ffmpeg failed'));
                } else {
                    resolve(Buffer.concat(chunks));
                }
            });

            ffmpeg.stdin.write(webmBuffer);
            ffmpeg.stdin.end();
        });
    }

    // 🧠 Whisper через stdin → stdout
    private runWhisper(wavBuffer: Buffer): Promise<string> {
        return new Promise((resolve, reject) => {
            const whisper = spawn(this.whisperPath, [
                '-m', this.modelPath,
                '-l', 'ru',
                '--threads', '4',
                '--stdin',
                '--output-txt'
            ]);

            let output = '';

            whisper.stdout.on('data', (data) => {
                output += data.toString();
            });

            whisper.stderr.on('data', () => { });

            whisper.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error('Whisper failed'));
                } else {
                    resolve(output);
                }
            });

            whisper.stdin.write(wavBuffer);
            whisper.stdin.end();
        });
    }
}
