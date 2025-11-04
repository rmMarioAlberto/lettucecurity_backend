import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
  Body,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CultivoService } from './cultivo.service';
import { GetCultivoDto } from './dto/cultivo.dto';

@Controller('cultivo')
@UseGuards(AuthGuard, RolesGuard)
export class CultivoController {
  constructor(private readonly cultivoService: CultivoService) {}

  @Get('getCultivos')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async getCultivos() {
    const cultivo = await this.cultivoService.getCultivos();

    return {
      statusCode: HttpStatus.OK,
      message: 'Cultivos obtenidos correctamente',
      cultivo: cultivo,
    };
  }

  @Post('getCultivo')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async getCultivo(@Body() getCultivoDto: GetCultivoDto) {
    const cultivo = await this.cultivoService.getCultivo(
      getCultivoDto.idCultivo,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Cultivo recuperado correctamente',
      cultivo: cultivo,
    };
  }
}
