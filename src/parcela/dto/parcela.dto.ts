import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreateParcelaDto {
  @IsInt()
  @IsNotEmpty()
  id_usuario: number;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsPositive()
  @IsNumber()
  @IsOptional()
  largo?: number;

  @IsPositive()
  @IsNumber()
  @IsOptional()
  ancho?: number;

  @IsPositive()
  @IsNumber()
  @IsOptional()
  latitud?: number;

  @IsPositive()
  @IsNumber()
  @IsOptional()
  longitud?: number;

  @IsNotEmpty()  
  @IsPositive()
  @IsNumber()
  idCultivo: number;

}

export class EditParcelaDto {
  @IsInt()
  @IsNotEmpty()
  id_usuario: number;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsPositive()
  @IsNumber()
  @IsOptional()
  largo?: number;

  @IsPositive()
  @IsNumber()
  @IsOptional()
  ancho?: number;

  @IsPositive()
  @IsNumber()
  @IsOptional()
  latitud?: number;

  @IsPositive()
  @IsNumber()
  @IsOptional()
  longitud?: number;

}


