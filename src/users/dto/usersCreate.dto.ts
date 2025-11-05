import { 
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'mario123',
    description: 'Nombre de usuario único del sistema',
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    example: 'mario@gmail.com',
    description: 'Correo electrónico del usuario',
  })
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  correo: string;

  @ApiProperty({
    example: '123456',
    description: 'Contraseña del usuario ()',
  })
  @IsNotEmpty()
  @IsString()
  contra: string;

  @ApiProperty({
    example: 'Mario',
    description: 'Nombre del usuario',
  })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({
    example: 'Ramírez',
    description: 'Apellido del usuario',
  })
  @IsNotEmpty()
  @IsString()
  apellido: string;

  @ApiProperty({
    example: 1,
    description: 'Tipo de usuario (2 = admin, 1 = usuario)',
  })
  @IsNotEmpty()
  @IsNumber()
  tipo_usuario: number;
}
