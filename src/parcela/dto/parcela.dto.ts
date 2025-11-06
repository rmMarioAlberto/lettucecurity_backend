import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreateParcelaDto {
  @ApiProperty({ example: 1, description: 'ID del usuario propietario de la parcela' })
  @IsInt()
  @IsNotEmpty()
  id_usuario: number;

  @ApiPropertyOptional({ example: 'Parcela Norte', description: 'Nombre de la parcela' })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional({ example: 'Zona experimental de maíz', description: 'Descripción de la parcela' })
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

  @ApiPropertyOptional({ example: 19.4326, description: 'Latitud de ubicación GPS' })
  @IsPositive()
  @IsNumber()
  @IsOptional()
  latitud?: number;

  @ApiPropertyOptional({ example: -99.1332, description: 'Longitud de ubicación GPS' })
  @IsPositive()
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
  @ApiProperty({ example: 1, description: 'ID del usuario propietario de la parcela' })
  @IsInt()
  @IsNotEmpty()
  id_usuario: number;

  @ApiPropertyOptional({ example: 'Parcela actualizada', description: 'Nuevo nombre de la parcela' })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional({ example: 'Actualización del cultivo de maíz', description: 'Nueva descripción' })
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
