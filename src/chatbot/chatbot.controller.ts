import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatBotMessage, GetChatDto } from './dto/chatbot.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { AuthUtilsService } from '../utils/getUser.service';

import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@UseGuards(AuthGuard, RolesGuard)
@ApiTags('Chatbot')
@Controller('chat')
export class ChatbotController {
  constructor(
    private authUtils: AuthUtilsService,
    private readonly chatbotService: ChatbotService,
  ) {}

  @Post('chatbot')
  @Roles('admin', 'user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar mensaje al asistente agrícola KORI',
    description:
      'Envía un mensaje al chatbot KORI asociado a una parcela específica. El asistente responde basándose en los datos agrícolas disponibles del usuario.',
  })
  @ApiBody({
    description: 'Datos necesarios para enviar un mensaje al chatbot',
    type: ChatBotMessage,
    examples: {
      ejemplo: {
        summary: 'Ejemplo de mensaje al chatbot',
        value: {
          idParcela: 11,
          message: '¿Qué cultivo tiene mi parcela?',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Respuesta generada por el chatbot',
    schema: {
      example: {
        statusCode: 200,
        message: 'Tu parcela tiene cultivo de lechuga.',
      },
    },
  })
  async sendMessage(@Body() dto: ChatBotMessage, @Req() req: Request) {
    const { idParcela, message } = dto;

    const authHeader = req.headers['authorization'];
    

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }
    const token = authHeader.split(' ')[1];
    

    const idUser = this.authUtils.getUserIdFromToken(token);

    const reply = await this.chatbotService.handleChatMessage(
      idUser,
      idParcela,
      message,
    );
    return { statusCode: HttpStatus.OK, message: reply };
  }

  @Post('getChat')
  @Roles('admin', 'user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener historial del chat',
    description:
      'Devuelve todo el historial de mensajes entre el usuario y el asistente KORI, filtrado por parcela.',
  })
  @ApiBody({
    description: 'Datos necesarios para consultar el historial del chat',
    type: GetChatDto,
    examples: {
      ejemplo: {
        summary: 'Consultar historial del chat',
        value: {
          idParcela: 11,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Historial completo de mensajes del usuario con KORI',
    schema: {
      example: {
        statusCode: 200,
        data: [
          {
            idUser: 3,
            idParcela: 11,
            role: 'user',
            message: '¿Cómo está mi cultivo?',
          },
          {
            idUser: 3,
            idParcela: 11,
            role: 'assistant',
            message:
              'El estado general es bueno, aunque algunas lecturas muestran variaciones...',
          },
        ],
      },
    },
  })
  async getHistorialChat(@Body() dto: GetChatDto,@Req() req: Request) {

    const authHeader = req.headers['authorization'];
    

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }
    const token = authHeader.split(' ')[1];

    const idUser = this.authUtils.getUserIdFromToken(token);

    const chat = await this.chatbotService.getChat(dto, idUser);

    return { statusCode: 200, data: chat };
  }
}
