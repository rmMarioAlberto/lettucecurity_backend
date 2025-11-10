import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class DataSensorDto {
  @ApiProperty({ description: 'ID del sensor', example: 1 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  idSensor: number;

  @ApiProperty({ description: 'Lectura del sensor', example: 25.5 })
  @IsNotEmpty()
  @IsNumber()
  lectura: number;
}

export class SubmitIotDataDto {
  @ApiProperty({ description: 'ID del dispositivo IoT', example: 101 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  idIot: number;

  @ApiProperty({
    description: 'Hora de la lectura (formato ISO)',
    example: '2025-11-10T13:55:00Z',
  })
  @IsISO8601()
  hora: string;

  @ApiProperty({ description: 'Imagen asociada (base64)', example: 'base64' })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({
    description: 'Array de datos de sensores',
    type: [DataSensorDto],
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DataSensorDto)
  dataSensores: DataSensorDto[];
}

export class SubmitDataDto {
  @ApiProperty({ description: 'ID de la parcela', example: 42 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  idParcela: number;

  @ApiProperty({ description: 'Array de datos IoT', type: [SubmitIotDataDto] })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SubmitIotDataDto)
  data: SubmitIotDataDto[];
}
