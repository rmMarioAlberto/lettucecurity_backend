import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CLOUDINARY } from './cloudinary.provider'; // Adjust path if needed

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(CLOUDINARY)
    private v2: any, // This is the configured v2 instance
  ) {}

  async upload(file: any) {
    return await this.v2.uploader.upload(file);
  }

  async uploadBase64(base64: string, options: any = {}) {
    try {
      let mimeType: string;
      let rawBase64 = base64;

      // 🔹 Si viene como data:image/png;base64,...
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
        // 🔹 Si es base64 “crudo” sin encabezado
        const buffer = Buffer.from(base64, 'base64');
        if (
          buffer.length >= 8 &&
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47
        ) {
          mimeType = 'image/png';
        } else if (
          buffer.length >= 3 &&
          buffer[0] === 0xff &&
          buffer[1] === 0xd8 &&
          buffer[2] === 0xff
        ) {
          mimeType = 'image/jpeg';
        } else {
          throw new Error('Formato no soportado: solo PNG o JPG');
        }
      }

      // 🔹 Construir el data URI correcto
      const dataUri = `data:${mimeType};base64,${rawBase64}`;

      // 🔹 Asignar defaults
      if (!options.resource_type) {
        options.resource_type = 'image';
      }

      // 🔹 Si se pasa un id de parcela o algo similar, crea carpeta automáticamente
      if (options.parcelaId) {
        options.folder = `parcela_${options.parcelaId}`;
        delete options.parcelaId;
      }

      // 🔹 Darle nombre automático al archivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      if (!options.public_id) {
        options.public_id = `img_${timestamp}`;
      }

      // 🔹 Subir a Cloudinary
      const uploadResult = await this.v2.uploader.upload(dataUri, options);
      return uploadResult;
    } catch (error) {
      console.log(error);
      
      throw new BadRequestException({
        message: 'Error al subir archivo a Cloudinary',
        error: error.message || error,
      });
    }
  }
}