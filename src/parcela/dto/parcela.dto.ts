import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateParcelaDto {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario propietario de la parcela',
  })
  @IsInt()
  @IsNotEmpty()
  id_usuario: number;

  @ApiPropertyOptional({
    example: 'Parcela Norte',
    description: 'Nombre de la parcela',
  })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional({
    example: 'Zona experimental de maíz',
    description: 'Descripción de la parcela',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ example: 25.5, description: 'Largo en metros' })
  @IsPositive()
  @IsNumber()
  @IsOptional()
  largo?: number;

  @ApiPropertyOptional({ example: 10.2, description: 'Ancho en metros' })
  @IsPositive()
  @IsNumber()
  @IsOptional()
  ancho?: number;

  @ApiPropertyOptional({
    example: 19.4326,
    description: 'Latitud de ubicación GPS',
  })
  @IsNumber()
  @IsOptional()
  latitud?: number;

  @ApiPropertyOptional({
    example: -99.1332,
    description: 'Longitud de ubicación GPS',
  })
  @IsNumber()
  @IsOptional()
  longitud?: number;

  @ApiProperty({ example: 3, description: 'ID del cultivo asociado' })
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  idCultivo: number;
}

export class EditParcelaDto {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario propietario de la parcela',
  })
  @IsInt()
  @IsNotEmpty()
  id_usuario: number;

  @ApiPropertyOptional({
    example: 'Parcela actualizada',
    description: 'Nuevo nombre de la parcela',
  })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional({
    example: 'Actualización del cultivo de maíz',
    description: 'Nueva descripción',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ example: 30, description: 'Nuevo largo en metros' })
  @IsPositive()
  @IsNumber()
  @IsOptional()
  largo?: number;

  @ApiPropertyOptional({ example: 12, description: 'Nuevo ancho en metros' })
  @IsPositive()
  @IsNumber()
  @IsOptional()
  ancho?: number;

  @ApiPropertyOptional({ example: 19.4327, description: 'Nueva latitud GPS' })
  @IsPositive()
  @IsNumber()
  @IsOptional()
  latitud?: number;

  @ApiPropertyOptional({ example: -99.1335, description: 'Nueva longitud GPS' })
  @IsPositive()
  @IsNumber()
  @IsOptional()
  longitud?: number;
}

export class GetDataParcela {
  @ApiProperty({ example: 1, description: 'ID de la parcela' })
  @Min(1)
  @IsNotEmpty()
  @IsNumber()
  idParcela: number;

  @ApiPropertyOptional({
    example: [1, 2, 3],
    description: 'IDs de IoTs específicos para filtrar (opcional)',
    type: [Number],
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  idIots?: number[];

  @ApiPropertyOptional({
    example: '2025-11-24',
    description: 'Fecha de inicio para filtrar lecturas (opcional)',
  })
  @IsOptional()
  @IsString()
  fechaInicio?: string;

  @ApiPropertyOptional({
    example: '2025-11-24',
    description: 'Fecha de fin para filtrar lecturas (opcional)',
  })
  @IsOptional()
  @IsString()
  fechaFin?: string;
}

export class UpdateCurrentStageDto {
  @ApiProperty({ example: 1, description: 'ID de la parcela ' })
  @Min(1)
  @IsNotEmpty()
  @IsNumber()
  idParcela: number;

  @ApiProperty({ example: 1, description: 'Indice de la etapa actual' })
  @IsNotEmpty()
  @IsNumber()
  stageIndex: number;
}

export class GetStageParcela {
  @ApiPropertyOptional({ example: 1, description: 'ID de la parcela ' })
  @Min(1)
  @IsNotEmpty()
  @IsNumber()
  idParcela: number;
}

export class CreateCycleDto {
  @ApiProperty({ example: 1, description: 'ID de la parcela ' })
  @Min(1)
  @IsNotEmpty()
  @IsNumber()
  idParcela: number;
}

export class GetIotsParcelaDto {
  @ApiPropertyOptional({ example: 1, description: 'ID de la parcela ' })
  @Min(1)
  @IsNotEmpty()
  @IsNumber()
  idParcela: number;
}

export class EndCycleDto {
  @ApiProperty({ example: 1, description: 'ID de la parcela' })
  @Min(1)
  @IsNotEmpty()
  @IsNumber()
  idParcela: number;
}
