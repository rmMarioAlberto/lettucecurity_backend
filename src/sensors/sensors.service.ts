import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';
import { SensorAsignarMultiplesIotDto } from './dto/sensors.dto';

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

  async asignarSensoresIot(dto: SensorAsignarMultiplesIotDto) {
    const { idSensores, idIotDevice } = dto;

    const findIot = await this.prisma.iot.findUnique({
      where: { id_iot: idIotDevice, status: 1 },
    });

    if (!findIot) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Dispositivo IoT con ID ${idIotDevice} no encontrado o inactivo`,
      };
    }

    // Obtenemos los sensores activos que existan
    const sensoresEncontrados = await this.prisma.sensor.findMany({
      where: { id_sensor: { in: idSensores }, status: 1 },
    });

    // Validamos si faltan sensores
    const sensoresNoEncontrados = idSensores.filter(
      (id) => !sensoresEncontrados.some((s) => s.id_sensor === id),
    );

    if (sensoresNoEncontrados.length > 0) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Los siguientes sensores no existen o están inactivos: ${sensoresNoEncontrados.join(', ')}`,
      };
    }

    // Obtenemos las relaciones existentes para evitar duplicados
    const relacionesExistentes = await this.prisma.sensor_iot.findMany({
      where: {
        id_sensor: { in: idSensores },
        id_iot: idIotDevice,
      },
    });

    const sensoresYaAsignados = relacionesExistentes.map((r) => r.id_sensor);
    const sensoresNuevos = idSensores.filter(
      (id) => !sensoresYaAsignados.includes(id),
    );

    if (sensoresNuevos.length === 0) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Todos los sensores ya están asignados a este dispositivo IoT',
      };
    }

    // Creamos las nuevas relaciones
    const nuevasRelaciones = await this.prisma.sensor_iot.createMany({
      data: sensoresNuevos.map((id) => ({
        id_sensor: id,
        id_iot: idIotDevice,
      })),
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Sensores asignados correctamente al dispositivo IoT',
      asignados: sensoresNuevos,
    };
  }
}
