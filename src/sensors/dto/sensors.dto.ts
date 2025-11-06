import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

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


export class SensorAsignarIotDto {

  @ApiProperty({
    example: 1,
    description: 'ID numérico del sensor a asignar',
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  idSensor : number;

  @ApiProperty({
    example: 1,
    description: 'ID numérico del iot a asignar',
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  idIotDevice : number;
}