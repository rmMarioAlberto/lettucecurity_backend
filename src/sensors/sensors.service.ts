import { Injectable} from '@nestjs/common';
import { PrismaServicePostgres } from 'src/prisma/prismaPosgres.service';

@Injectable()
export class SensorsService {
  constructor(private prisma: PrismaServicePostgres) {}

  async getAllSensors() {
    const sensors = await this.prisma.sensor.findMany();

    return sensors;
  }

  async getSensorById(id_sensor: number) {
    const sensor = await this.prisma.sensor.findUnique({where : {id_sensor : id_sensor}})

    return sensor;
  }
}
