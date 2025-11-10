import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Cloudinary } from './cloudinary.provider';

@Injectable()
export class CloudinaryService {
  private v2: any;

  constructor(
    @Inject(Cloudinary)
    private cloudinary,
  ) {
    this.cloudinary.v2.config({
      secure: true,
    });
    this.v2 = cloudinary.v2;
  }

  async upload(file: any) {
    return await this.v2.uploader.upload(file);
  }

  async uploadBase64(base64: string, options: any = {}) {
    try {
      let mimeType: string;
      let rawBase64 = base64;

      if (base64.startsWith('data:')) {
        const commaIndex = base64.indexOf(',');
        if (commaIndex === -1) {
          throw new Error('Formato de data URI inválido');
        }
        const header = base64.slice(0, commaIndex);
        rawBase64 = base64.slice(commaIndex + 1);

        const mimeMatch = header.match(/^data:(image\/(?:png|jpeg));base64$/);
        if (!mimeMatch) {
          throw new Error('Formato de data URI inválido o no soportado (solo image/png o image/jpeg)');
        }
        mimeType = mimeMatch[1];
      } else {
 
        const buffer = Buffer.from(base64, 'base64');

        if (buffer.length >= 8 &&
            buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
            buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
          mimeType = 'image/png';
        } else if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
          mimeType = 'image/jpeg';
        } else {
          throw new Error('Formato no soportado: solo PNG o JPG');
        }
      }

      // Construir el data URI con el mime detectado/extraído
      const dataUri = `data:${mimeType};base64,${rawBase64}`;

 
      if (!options.resource_type) {
        options.resource_type = 'image';
      }

      // Subir a Cloudinary
      const uploadResult = await this.v2.uploader.upload(dataUri, options);
      return uploadResult;
    } catch (error) {
      throw new BadRequestException({
        message: 'Error al subir archivo a Cloudinary',
        error: error.message || error,
      });
    }
  }
}