import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { PredictionService } from './prediction.service';
import {
  WeatherPredictionRequestDto,
  WeatherPredictionResponseDto,
} from './dto/prediction.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';

@ApiTags('Predicción')
@Controller('parcela')
@UseGuards(AuthGuard, RolesGuard)
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Post('weather-prediction')
  @Roles('admin', 'user')
  @ApiOperation({
    summary: 'Obtener predicción del clima para 7 días',
    description:
      'Predice temperatura y humedad para la próxima semana usando modelo LSTM. ' +
      'Requiere al menos 1 semana de datos históricos (168 lecturas). ' +
      'Si faltan datos, se completan con patrones sintéticos realistas.',
  })
  @ApiBody({
    type: WeatherPredictionRequestDto,
    description: 'ID de la parcela para obtener predicción',
  })
  @ApiResponse({
    status: 200,
    description: 'Predicción generada exitosamente',
    type: WeatherPredictionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Parcela no encontrada o sin ciclo activo',
    schema: {
      example: {
        statusCode: 404,
        message: 'No se encontró un ciclo activo para la parcela 1',
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Servicio de ML no disponible',
    schema: {
      example: {
        statusCode: 503,
        message: 'El servicio de predicción no está disponible',
      },
    },
  })
  @Roles('admin', 'user')
  async getWeatherPrediction(@Body() dto: WeatherPredictionRequestDto) {
    try {
      const prediction = await this.predictionService.predictWeather(
        dto.parcelaId,
      );

      return {
        parcelaId: dto.parcelaId,
        prediccion: {
          temperatura_predicha: prediction.temperatura_predicha,
          humedad_predicha: prediction.humedad_predicha,
          confianza_temperatura: prediction.confianza_temperatura,
          confianza_humedad: prediction.confianza_humedad,
          fecha_prediccion: prediction.fecha_prediccion,
        },
        estadisticas: prediction.estadisticas_historicas,
        data_quality: prediction.data_quality,
      };
    } catch (error) {
      if (error.response?.status === 403) {
        throw new HttpException(
          'Error de autenticación con el servicio de ML',
          HttpStatus.FORBIDDEN,
        );
      } else if (error.response?.status) {
        throw new HttpException(
          'El servicio de predicción no está disponible',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw error;
    }
  }
}
