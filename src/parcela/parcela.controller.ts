import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorator/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParcelaService } from './parcela.service';
import {
  CreateCycleDto,
  CreateParcelaDto,
  GetDataParcela,
  GetStageParcela,
  UpdateCurrentStageDto,
} from './dto/parcela.dto';

@ApiTags('Parcelas')
@Controller('parcela')
@UseGuards(AuthGuard, RolesGuard)
export class ParcelaController {
  constructor(private readonly parcelasService: ParcelaService) {}

  @Get('getParcelas')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todas las parcelas (solo admin)' })
  @ApiResponse({ status: 200, description: 'Parcelas obtenidas correctamente' })
  async getParcelas() {
    const parcelas = await this.parcelasService.getParcelasAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Parcelas obtenidas correctamente',
      parcelas,
    };
  }

  @Get('getParcelasUser')
  @Roles('user', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener parcelas asignadas al usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Parcelas del usuario obtenidas correctamente',
  })
  @ApiResponse({ status: 401, description: 'Token inválido o ausente' })
  async getParcelasUser(@Req() req: Request) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];
    const parcelas = await this.parcelasService.getParcelasUser(token);

    return {
      statusCode: HttpStatus.OK,
      message: 'Parcelas recolectadas correctamente',
      parcelas: parcelas,
    };
  }

  @Post('createParcela')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva parcela (solo admin)' })
  @ApiResponse({ status: 201, description: 'Parcela creada correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async createParcela(@Body() createParcelaDto: CreateParcelaDto) {
    await this.parcelasService.createParcela(createParcelaDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Parcela creada correctamente',
    };
  }

  @ApiOperation({
    summary: 'Obtener datos completos del ciclo activo de una parcela',
    description:
      'Recupera información detallada del ciclo de crecimiento más reciente de una parcela, incluyendo todas las etapas con sus lecturas IoT, sensores y estados.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Datos del ciclo recuperados correctamente con etapas y lecturas completas',
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontró información de ciclos para la parcela',
  })
  @Roles('admin', 'user')
  @HttpCode(HttpStatus.OK)
  @Post('dataParcela')
  async getDataParcela(@Body() dto: GetDataParcela) {
    const data = await this.parcelasService.getDataParcela(dto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Data recuperada correctamente',
      data: data,
    };
  }

  @ApiOperation({
    summary: 'Obtener etapas del ciclo sin lecturas IoT',
    description:
      'Recupera información del ciclo de crecimiento con solo los metadatos de las etapas (índice, nombre, fechas) sin incluir las lecturas IoT. Útil para obtener una respuesta más ligera.',
  })
  @ApiResponse({
    status: 200,
    description: 'Etapas recuperadas correctamente sin lecturas',
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontró un ciclo para la parcela',
  })
  @Roles('admin', 'user')
  @HttpCode(HttpStatus.OK)
  @Post('stageParcela')
  async getStageParcela(@Body() dto: GetStageParcela) {
    const data = await this.parcelasService.getStagePacela(dto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Etapas recuperada correctamente',
      data: data,
    };
  }

  @ApiOperation({
    summary: 'Avanzar a una nueva etapa del ciclo de crecimiento',
    description:
      'Actualiza el índice de la etapa actual del ciclo. Valida que el índice exista, cierra automáticamente la etapa anterior con endDate, e inicia la nueva etapa con startDate.',
  })
  @ApiResponse({
    status: 200,
    description: 'Etapa actualizada correctamente con fechas gestionadas',
  })
  @ApiResponse({
    status: 400,
    description: 'El índice de etapa no es válido para el ciclo actual',
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontró un ciclo para la parcela',
  })
  @Roles('admin', 'user')
  @HttpCode(HttpStatus.OK)
  @Post('updateCurrentStage')
  async updateCurrentStage(@Body() dto: UpdateCurrentStageDto) {
    await this.parcelasService.updateCurrentStage(dto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Etapa actualizada correctamente',
    };
  }

  @ApiOperation({
    summary: 'Crear un nuevo ciclo de crecimiento para una parcela',
    description:
      'Inicia un nuevo ciclo de crecimiento para una parcela. Valida que no exista un ciclo activo (endDate null), obtiene las etapas del cultivo, y crea el ciclo con todas las etapas inicializadas. Requerido antes de enviar datos IoT.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Ciclo creado correctamente con etapas del cultivo inicializadas',
  })
  @ApiResponse({
    status: 400,
    description:
      'Ya existe un ciclo activo, la parcela no tiene cultivo asignado, o datos inválidos',
  })
  @ApiResponse({
    status: 404,
    description:
      'Parcela no encontrada o no hay etapas de crecimiento definidas para el cultivo',
  })
  @Roles('admin', 'user')
  @HttpCode(HttpStatus.CREATED)
  @Post('createCycle')
  async createCycle(@Body() dto: CreateCycleDto) {
    await this.parcelasService.createCycle(dto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Ciclo de crecimiento creado correctamente',
    };
  }
}
