import { BadRequestException, Injectable } from '@nestjs/common';
import { SubmitDataDto, SubmitIotDataDto } from './dto/iotControl.dto';
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';
import { PrismaServiceMongo } from '../prisma/prismaMongo.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class IotControlService {
  constructor(
    private readonly prismaPostgres: PrismaServicePostgres,
    private readonly prismaMongo: PrismaServiceMongo,
    private readonly cloudinary: CloudinaryService,
  ) {}


  async submitData(dto: SubmitDataDto) {
    const { idParcela, data } = dto;

    const checkParcel = await this.prismaPostgres.parcela.findUnique({
      where: { id_parcela: idParcela },
    });

    if (!checkParcel) {
      throw new BadRequestException('La parcela no existe en el sistema');
    }

    // Procesar cada iotData: subir imagen a Cloudinary y preparar datos para Mongo
    const iotReadingsToAdd = await Promise.all(
      data.map(async (iotData: SubmitIotDataDto) => {
        const { idIot, hora, image, dataSensores } = iotData;

        const checkIot = await this.prismaPostgres.iot.findUnique({
          where: { id_iot: idIot },
        });

        if (!checkIot) {
          throw new BadRequestException(`El IoT con id ${idIot} no existe`);
        }

        let imageUrl = '';
        if (image) {
          const uploadResult = await this.cloudinary.uploadBase64(image);
          imageUrl = uploadResult.secure_url; 
        } else {
          throw new BadRequestException('Imagen requerida para la lectura IoT');
        }

        await Promise.all(
          dataSensores.map(async (sensor) => {
            const checkSensor = await this.prismaPostgres.sensor.findUnique({
              where: { id_sensor: sensor.idSensor },
            });
            if (!checkSensor) {
              throw new BadRequestException(`El sensor con id ${sensor.idSensor} no existe`);
            }
          }),
        );

        // Preparar el objeto IotReading para embeber en Mongo
        return {
          id_iot: idIot,
          hora: new Date(hora), 
          image_url: imageUrl,
          sensorReadings: dataSensores.map((sensor) => ({
            id_sensor: sensor.idSensor,
            lectura: sensor.lectura,
          })),
        };
      }),
    );

    // Usar upsert en Mongo para crear o agregar lecturas al documento de la parcela
    await this.prismaMongo.parcela_data.upsert({
      where: { id_parcela: idParcela },
      update: {
        iotReadings: {
          push: iotReadingsToAdd, 
        },
      },
      create: {
        id_parcela: idParcela,
        iotReadings: iotReadingsToAdd,
      },
    });

    return { message: 'Datos enviados exitosamente' };
  }
}