import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaServicePostgres } from 'src/prisma/prismaPosgres.service';
import { SensorAsignarIotDto } from './dto/sensors.dto';

@Injectable()
export class SensorsService {
  constructor(private prisma: PrismaServicePostgres) {}

  async getAllSensors() {
    const sensors = await this.prisma.sensor.findMany({});

    return sensors;
  }

  async getSensorById(id_sensor: number) {
    const sensor = await this.prisma.sensor.findUnique({
      where: { id_sensor: id_sensor },
    });
    return sensor;
  }

  async asignarSensorIot(dto: SensorAsignarIotDto) {
    const { idSensor, idIotDevice } = dto;

    const findSensor = await this.prisma.sensor.findUnique({
      where: { id_sensor: idSensor, status: 1 },
    });
    const findIot = await this.prisma.iot.findUnique({
      where: { id_iot: idIotDevice, status: 1 },
    });

    if (!findSensor || !findIot) {
      return {statuscode: HttpStatus.NOT_FOUND, message: 'Sensor o IoT no encontrado o inactivo'};
    }

    const findIsExist = await this.prisma.sensor_iot.findFirst({where: {id_sensor:idSensor,id_iot:idIotDevice}})

    if(findIsExist){
      return {statuscode: HttpStatus.CONFLICT, message: 'El sensor ya está asignado a este dispositivo IoT'};
    }

    const createRelation = await this.prisma.sensor_iot.create({
      data: {
        id_sensor: idSensor,
        id_iot: idIotDevice
      }
    });

    return createRelation;
  }
} 
