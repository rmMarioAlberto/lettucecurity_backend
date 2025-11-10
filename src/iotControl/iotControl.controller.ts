import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { IotControlService } from './iotControl.service';
import { SubmitDataDto } from './dto/iotControl.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthIotGuard } from '../auth/guards/authIot.guard';
import { Roles } from '../auth/decorator/roles.decorator';

@ApiTags('iot-control')
@Controller('iot-control')
@UseGuards(AuthIotGuard, RolesGuard)
@Roles('iot')
export class IotControlController {
  constructor(private readonly iotControlService: IotControlService) {}

  @Post('submit')
  @ApiOperation({
    summary: 'Enviar datos de IoT para una parcela',
    description:
      'Procesa y almacena datos de IoT, sube imágenes a Cloudinary y guarda lecturas en MongoDB.',
  })
  @ApiBody({
    type: SubmitDataDto,
    description: 'Payload con ID de parcela y array de datos IoT',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos enviados exitosamente',
    type: Object,
  })
  @ApiBadRequestResponse({
    description:
      'Error de validación o entidad no encontrada (e.g., parcela, IoT o sensor no existe)',
  })
  @ApiNotFoundResponse({ description: 'Parcela no encontrada' })
  @HttpCode(HttpStatus.CREATED)
  async submitData(@Body() dto: SubmitDataDto) {
    const data = await this.iotControlService.submitData(dto);

    return {statusCode : HttpStatus.CREATED, data: data}
  }
}
