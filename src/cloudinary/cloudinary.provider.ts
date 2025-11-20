import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cloudinary from 'cloudinary';

export const CLOUDINARY = 'lib:cloudinary';

export const CloudinaryProvider: Provider = {
  provide: CLOUDINARY,
  useFactory: (configService: ConfigService) => {
    const cloudinaryUrl = configService.get<string>('CLOUDINARY_URL');
    
    if (!cloudinaryUrl) {
      throw new Error('CLOUDINARY_URL no está definido en las variables de entorno');
    }

    // Configurar usando el URI directamente
    cloudinary.v2.config(true); // Esto carga automáticamente desde process.env.CLOUDINARY_URL si está set, pero para seguridad usamos el valor

    // O parsear manualmente si es necesario
    const urlParts = cloudinaryUrl.match(/cloudinary:\/\/(.*):(.*)@(.*)/);
    if (urlParts) {
      const [, apiKey, apiSecret, cloudName] = urlParts;
      cloudinary.v2.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }

    return cloudinary.v2;
  },
  inject: [ConfigService],
};