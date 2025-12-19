import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { createPrivateKey } from 'crypto';
import * as path from 'path';

@Injectable()
export class SpeechService {
    private readonly folderId = process.env.YANDEX_FOLDER_ID!;
    private readonly keyFilePath =
        path.join(process.cwd(), 'yandex_service_account.json');

    async recognizeSpeech(webmBuffer: Buffer): Promise<string> {
        try {
            const oggBuffer = await this.convertWebmToOgg(webmBuffer);

            const iamToken = await this.getIamToken();

            const response = await axios.post(
                'https://stt.api.cloud.yandex.net/speech/v1/stt:recognize',
                oggBuffer,
                {
                    headers: {
                        Authorization: `Bearer ${iamToken}`,
                        'Content-Type': 'audio/ogg',
                    },
                    params: {
                        folderId: this.folderId,
                        lang: 'ru-RU',
                        format: 'oggopus',
                        sampleRateHertz: 16000,
                    },
                    timeout: 10000,
                },
            );

            return response.data.result || '';
        } catch (e: any) {
            console.error(e?.response?.data || e.message);
            throw new InternalServerErrorException('Speech recognition failed');
        }
    }

    private convertWebmToOgg(webmBuffer: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            if (!webmBuffer?.length) {
                return reject(new Error('Empty webm buffer'));
            }

            const ffmpeg = spawn('ffmpeg', [
                '-f', 'webm',
                '-i', 'pipe:0',
                '-map', '0:a:0',
                '-ac', '1',
                '-ar', '16000',
                '-c:a', 'libopus',
                '-f', 'ogg',
                'pipe:1',
            ]);

            const chunks: Buffer[] = [];

            ffmpeg.stdout.on('data', chunk => chunks.push(chunk));
            ffmpeg.stderr.on('data', d => console.error('[ffmpeg]', d.toString()));

            ffmpeg.on('error', reject);

            ffmpeg.on('close', code => {
                if (code !== 0) {
                    reject(new Error(`ffmpeg exited with code ${code}`));
                } else {
                    resolve(Buffer.concat(chunks));
                }
            });

            ffmpeg.stdin.end(webmBuffer);
        });
    }


    private async getIamToken(): Promise<string> {
        console.log('YC_KEY_FILE =', this.keyFilePath);

        const keyFile = JSON.parse(fs.readFileSync(this.keyFilePath, 'utf-8'));

        const privateKey = createPrivateKey({
            key: keyFile.private_key,
            format: 'pem',
        });

        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 3600;

        const payload = {
            iss: keyFile.service_account_id,
            iat,
            exp,
            aud: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        };

        const token = jwt.sign(payload, privateKey, {
            algorithm: 'PS256',
            header: {
                alg: 'PS256',
                kid: keyFile.id,
            },
        });

        const response = await axios.post(
            'https://iam.api.cloud.yandex.net/iam/v1/tokens',
            { jwt: token },
        );

        return response.data.iamToken;
    }

}
