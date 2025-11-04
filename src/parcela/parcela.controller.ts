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
import { Roles } from 'src/auth/decorator/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ParcelaService } from './parcela.service';
import { CreateParcelaDto } from './dto/parcela.dto';

@Controller('parcela')
@UseGuards(AuthGuard, RolesGuard)
export class ParcelaController {
  constructor(private readonly parcelasService: ParcelaService) {}

  @Get('getParcelas')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async getParcelas() {
    const parcelas = await this.parcelasService.getParcelasAll();

    return {
      statusCode: HttpStatus.OK,
      message: 'Parcelas obtenidas correctamente',
      parcelas,
    };
  }

  @Get('getParcelasUser')
  @Roles('user','admin')
  @HttpCode(HttpStatus.OK)
  async getParcelasUser(@Req() req: Request) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];

    const parcelas = await this.parcelasService.getParcelasUser(token)

    return {
        statusCode : HttpStatus.OK,
        message : 'parcelas recolectadas correctamente',
        parcelas : parcelas
    }
  }

  @Post('createParcela')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createParcela (@Body() createParcelaDto : CreateParcelaDto){
    await this.parcelasService.createParcela(createParcelaDto);
    
    return {
        statusCode: HttpStatus.CREATED,
        message : "Parcela creada correctamente"
    }
  }


}
