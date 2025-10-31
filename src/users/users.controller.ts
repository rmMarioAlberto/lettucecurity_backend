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
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class usersController {
  constructor(private readonly usersService: usersService) {}

  @Post('create')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createNewUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.createNewUser(createUserDto);
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully',
      user,
    };
  }

  @Get('getUsers')
  @Roles('admin')
  async getAllUsers() {
    const users = await this.usersService.getAllUser();
    
    return {
      statusCode: HttpStatus.OK,
      users,
    };
  }
}