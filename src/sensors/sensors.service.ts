import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaServiceMongo } from '../prisma/prismaMongo.service';

@Injectable()
export class SensorsService {
  constructor(private prisma: PrismaServiceMongo) {}

  async getAllSensors() {
  try {
    const sensors = await this.prisma.sensorType.findMany();
    
    return {
      success: true,
      message: 'Sensores obtenidos correctamente',
      data: sensors,
    };
  } catch (error) {
    throw new InternalServerErrorException('No se pudieron obtener los sensores');
  }
}
}
