import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class GetSensorById {
  @ApiProperty({
    example: 1,
    description: 'ID numérico del sensor a consultar',
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  id_sensor: number;
}


export class SensorAsignarMultiplesIotDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'IDs numéricos de los sensores a asignar',
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  idSensores: number[];

  @ApiProperty({
    example: 1,
    description: 'ID numérico del dispositivo IoT al que se asignarán los sensores',
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  idIotDevice: number;
}