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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ParcelaService } from './parcela.service';
import { CreateParcelaDto } from './dto/parcela.dto';

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
  @ApiOperation({ summary: 'Obtener parcelas asignadas al usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Parcelas del usuario obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'Token inválido o ausente' })
  async getParcelasUser(@Req() req: Request) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
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
}
