import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SensorsService } from './sensors.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { GetSensorById, SensorAsignarMultiplesIotDto } from './dto/sensors.dto';

@ApiTags('Sensores')
@UseGuards(AuthGuard, RolesGuard)
@Controller('/sensors')
export class SensorsController {
  constructor(private readonly Sensor: SensorsService) {}

  @Get('/allSensors')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todos los sensores' })
  @ApiResponse({
    status: 200,
    description: 'Sensores obtenidos correctamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Sensores obtenidos',
        sensores: [
          {
            id_sensor: 1,
            tipo: 'Temperatura',
            modelo: 'DHT11',
            descripcion: 'Sensor de temperatura y humedad',
            status: 1,
          },
          {
            id_sensor: 2,
            tipo: 'Humedad',
            modelo: 'HDC1080',
            descripcion: 'Sensor de humedad ambiental',
            status: 1,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado. Solo el rol admin puede acceder.',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
      },
    },
  })
  async getAllSensors() {
    const sensores = await this.Sensor.getAllSensors();

    return {
      statusCode: HttpStatus.OK,
      message: 'Sensores obtenidos',
      sensores: sensores,
    };
  }

  @Post('/getSensorById')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un sensor por su ID' })
  @ApiResponse({
    status: 200,
    description: 'Sensor encontrado correctamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Sensor obtenido',
        sensor: {
          id_sensor: 1,
          tipo: 'Temperatura',
          modelo: 'DHT11',
          descripcion: 'Sensor de temperatura y humedad',
          status: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El ID proporcionado no es válido o está vacío.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed: id_sensor debe ser un número positivo',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Sensor no encontrado con el ID proporcionado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'El sensor con ID 5 no existe.',
      },
    },
  })
  async getSensorById(@Body() dto: GetSensorById) {
    const sensor = await this.Sensor.getSensorById(dto.id_sensor);

    return {
      statusCode: HttpStatus.OK,
      message: 'Sensor obtenido',
      sensor: sensor,
    };
  }

  @Post('/asignarSensorIot')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Asignar un sensor a un dispositivo IoT' })
  @ApiResponse({
    status: 201,
    description: 'Sensor asignado correctamente al dispositivo IoT',
  })
  async asignarSensorIot(@Body() dto: SensorAsignarMultiplesIotDto) {
    const result = await this.Sensor.asignarSensoresIot(dto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Sensor asignado al dispositivo IoT correctamente',
    };
  }
}
