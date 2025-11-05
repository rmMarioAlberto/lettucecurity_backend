import { 
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AccessLoginDto {
  @ApiProperty({
    example: 'usuario@gmail.com',
    description: 'Correo electrónico del usuario registrado',
  })
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  correo: string;

  @ApiProperty({
    example: '123456',
    description: 'Contraseña del usuario',
  })
  @IsNotEmpty()
  @IsString()
  contra: string;
}

export class AccessLogoutDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token de actualización (refresh token) actual del usuario',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class AccessRefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token de actualización válido para generar nuevos tokens',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
