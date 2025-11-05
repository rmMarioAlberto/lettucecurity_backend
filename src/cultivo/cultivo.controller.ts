import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CultivoService } from './cultivo.service';
import { GetCultivoDto } from './dto/cultivo.dto';

@ApiTags('Cultivos')
@UseGuards(AuthGuard, RolesGuard)
@Controller('cultivo')
export class CultivoController {
  constructor(private readonly cultivoService: CultivoService) {}

  @Get('getCultivos')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todos los cultivos activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cultivos obtenida correctamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Cultivos obtenidos correctamente',
        cultivo: [
          {
            id_cultivo: 1,
            nombre: 'Maíz',
            descripcion: 'Cultivo de maíz de temporada',
            status: 1,
          },
          {
            id_cultivo: 2,
            nombre: 'Trigo',
            descripcion: 'Cultivo de trigo en rotación',
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
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
      },
    },
  })
  async getCultivos() {
    const cultivo = await this.cultivoService.getCultivos();

    return {
      statusCode: HttpStatus.OK,
      message: 'Cultivos obtenidos correctamente',
      cultivo,
    };
  }

  @Post('getCultivo')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un cultivo por ID' })
  @ApiResponse({
    status: 200,
    description: 'Cultivo encontrado correctamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Cultivo recuperado correctamente',
        cultivo: {
          id_cultivo: 3,
          nombre: 'Cebada',
          descripcion: 'Cultivo de cebada para exportación',
          status: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Cultivo no encontrado con el ID proporcionado',
    schema: {
      example: {
        statusCode: 404,
        message: 'El cultivo con ID 3 no existe',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El ID proporcionado no es válido o está vacío',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed: idCultivo debe ser un número positivo',
      },
    },
  })
  async getCultivo(@Body() getCultivoDto: GetCultivoDto) {
    const cultivo = await this.cultivoService.getCultivo(
      getCultivoDto.idCultivo,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Cultivo recuperado correctamente',
      cultivo,
    };
  }
}
