import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class GetCultivoDto {
  @ApiProperty({
    example: 1,
    description: 'ID numérico del cultivo a consultar',
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  idCultivo: number;
}

export class GetStageCultivoDto {
  @ApiProperty({
    example: 1,
    description: 'ID numérico del cultivo a consultar',
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  idCultivo: number;
}
