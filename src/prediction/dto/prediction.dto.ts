import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class WeatherPredictionRequestDto {
  @ApiProperty({
    example: 1,
    description: 'ID de la parcela para obtener predicción',
  })
  @IsNotEmpty()
  @IsNumber()
  parcelaId: number;
}

export class PredictionDataDto {
  @ApiProperty({
    example: 20.81,
    description: 'Temperatura predicha para 7 días adelante (°C)',
  })
  temperatura_predicha: number;

  @ApiProperty({
    example: 47.83,
    description: 'Humedad predicha para 7 días adelante (%)',
  })
  humedad_predicha: number;

  @ApiProperty({
    example: 0.86,
    description: 'Nivel de confianza de la predicción de temperatura (0-1)',
  })
  confianza_temperatura: number;

  @ApiProperty({
    example: 0.9,
    description: 'Nivel de confianza de la predicción de humedad (0-1)',
  })
  confianza_humedad: number;

  @ApiProperty({
    example: '2025-11-28T15:00:00.000Z',
    description: 'Fecha y hora de la predicción',
  })
  fecha_prediccion: string;
}

export class StatisticsDto {
  @ApiProperty({ example: 22.1, description: 'Temperatura promedio (°C)' })
  temperatura_promedio: number;

  @ApiProperty({ example: 19.5, description: 'Temperatura mínima (°C)' })
  temperatura_min: number;

  @ApiProperty({ example: 24.0, description: 'Temperatura máxima (°C)' })
  temperatura_max: number;

  @ApiProperty({ example: 62.3, description: 'Humedad promedio (%)' })
  humedad_promedio: number;

  @ApiProperty({ example: 55.0, description: 'Humedad mínima (%)' })
  humedad_min: number;

  @ApiProperty({ example: 70.0, description: 'Humedad máxima (%)' })
  humedad_max: number;
}

export class DataQualityDto {
  @ApiProperty({
    example: 45,
    description: 'Número de lecturas reales de la base de datos',
  })
  real_readings: number;

  @ApiProperty({
    example: 123,
    description: 'Número de lecturas sintéticas generadas',
  })
  synthetic_readings: number;

  @ApiProperty({
    example: 0.27,
    description: 'Score de calidad de datos (0-1, donde 1 = 100% datos reales)',
  })
  quality_score: number;

  @ApiProperty({
    example: 'Predicción basada en 27% de datos reales',
    description: 'Mensaje descriptivo sobre la calidad de los datos',
  })
  message: string;
}

export class WeatherPredictionResponseDto {
  @ApiProperty({ example: 1, description: 'ID de la parcela' })
  parcelaId: number;

  @ApiProperty({ type: PredictionDataDto, description: 'Datos de predicción' })
  prediccion: PredictionDataDto;

  @ApiProperty({
    type: StatisticsDto,
    description: 'Estadísticas de los datos históricos',
  })
  estadisticas: StatisticsDto;

  @ApiProperty({
    type: DataQualityDto,
    description: 'Información sobre la calidad de los datos usados',
  })
  data_quality: DataQualityDto;
}
