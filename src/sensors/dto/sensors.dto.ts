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
