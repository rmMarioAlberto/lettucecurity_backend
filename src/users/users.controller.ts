import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Get,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { usersService } from './users.service';
import { CreateUserDto } from './dto/usersCreate.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

@Controller('users')
@ApiTags('Users') 
@UseGuards(AuthGuard, RolesGuard)
export class usersController {
  constructor(private readonly usersService: usersService) {}

  @Post('create')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo usuario (solo admin)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    schema: {
      example: {
        statusCode: 201,
        message: 'User created successfully',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Correo ya registrado',
    schema: { example: { statusCode: 409, message: 'User with this email already exists' } },
  })
  async createNewUser(@Body() createUserDto: CreateUserDto) {
    await this.usersService.createNewUser(createUserDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully',
    };
  }

  @Get('getUsers')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener todos los usuarios (solo admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios activos'
  })
  async getAllUsers() {
    const users = await this.usersService.getAllUser();
    return {
      statusCode: HttpStatus.OK,
      users,
    };
  }
}
