import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';
import { CreateUserDto } from './dto/usersCreate.dto';
import bcrypt from 'bcrypt';

@Injectable()
export class usersService {
  constructor(private prisma: PrismaServicePostgres) {}

  async createNewUser(createUserDto: CreateUserDto) {
    const { username, correo, contra, nombre, apellido, tipo_usuario } =
      createUserDto;

    const existingUser = await this.prisma.usuario.findUnique({
      where: { correo },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const contraEncrypt = await bcrypt.hash(contra, 12);

    const newUser = await this.prisma.usuario.create({
      data: {
        username,
        correo,
        contra: contraEncrypt,
        nombre,
        apellido,
        tipo_usuario,
      },
    });

    return newUser;
  }

  async getAllUser() {
    const users = await this.prisma.usuario.findMany();

    return users.map((user) => ({
      id: user.id_usuario,
      name: user.username,
      email: user.correo,
      tipo: user.tipo_usuario,
      status: user.status,
    }));
  }
}
