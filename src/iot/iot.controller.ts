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
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IotService } from './iot.service';
import { AsignarParcelaDto, CreateIotDto, DeleteIot } from './dto/iotDto.dto';
import { Roles } from '../auth/decorator/roles.decorator';

@ApiTags('IoT')
@Controller('iot')
@UseGuards(AuthGuard, RolesGuard)
export class IotController {
  constructor(private readonly iotService: IotService) {}

  @Roles('admin')
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo dispositivo IoT' })
  @ApiResponse({ status: 201, description: 'IoT creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async createIot(@Body() dto: CreateIotDto) {
    const newIot = await this.iotService.createIot(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'IoT creado',
      iot: newIot,
    };
  }

  @Roles('admin')
  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todos los dispositivos IoT' })
  @ApiResponse({
    status: 200,
    description: 'Lista de IoT obtenida correctamente',
  })
  async getIots() {
    const iots = await this.iotService.getIots();
    return {
      statusCode: HttpStatus.OK,
      message: 'IoTs obtenidos',
      data: iots,
    };
  }

  @Roles('admin')
  @Post('delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un dispositivo IoT por ID' })
  @ApiResponse({ status: 200, description: 'IoT eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'IoT no encontrado' })
  async deleteIot(@Body() dto: DeleteIot) {
    await this.iotService.deleteIot(dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'IoT eliminado',
    };
  }

  @Roles('admin')
  @Post('asignarParcela')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Asignar una parcela y coordenadas a un dispositivo IoT',
  })
  @ApiResponse({
    status: 200,
    description: 'Parcela y coordenadas asignadas correctamente',
  })
  @ApiResponse({ status: 404, description: 'IoT o parcela no encontrada' })
  async asignarParcela(@Body() dto: AsignarParcelaDto) {
    await this.iotService.asignarParcela(dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Parcela y coordenadas asignadas al IoT',
    };
  }

  @Roles('admin')
  @Get('iotsFree')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener dispositivos IoT libres (no asignados)' })
  @ApiResponse({
    status: 200,
    description: 'IoTs libres obtenidos correctamente',
  })
  async getIotsFree() {
    const iotsFree = await this.iotService.getIotsFree();
    return {
      statusCode: HttpStatus.OK,
      message: 'IoTs libres obtenidos',
      data: iotsFree,
    };
  }
}
