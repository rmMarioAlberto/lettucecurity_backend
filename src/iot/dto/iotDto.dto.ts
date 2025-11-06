import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsNumber, 
  IsPositive, 
  IsString, 
  IsDateString 
} from 'class-validator';

export class CreateIotDto {
  @ApiProperty({
    example: 'IoT con sensores de temperatura y humedad',
    description: 'Descripción breve del dispositivo IoT',
  })
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiProperty({
    example: '2024-06-01T12:00:00Z',
    description: 'Fecha de creación del IoT en formato ISO 8601',
  })
  @IsNotEmpty()
  @IsDateString() 
  fechaCreacion: string;
}

export class DeleteIot {
  @ApiProperty({
    example: 1,
    description: 'ID del IoT que se desea eliminar',
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  idIot: number;
}

export class AsignarParcelaDto {
  @ApiProperty({
    example: 1,
    description: 'ID del IoT que se va a asignar a una parcela',
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  idIot: number;

  @ApiProperty({
    example: 2,
    description: 'ID de la parcela que se asignará al IoT',
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  idParcela: number;
}
