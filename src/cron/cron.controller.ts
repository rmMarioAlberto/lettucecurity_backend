import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { AccessService } from '../access/access.service';

@ApiTags('Cron Jobs')
@Controller('api/cron')
export class CronController {
  constructor(private readonly accessService: AccessService) {}

  @Get('cleanup-sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Limpieza automática de sesiones expiradas (Cron Job)',
    description:
      'Endpoint protegido para ser llamado por Vercel Cron. Elimina sesiones expiradas, revocadas e inactivas. Requiere header Authorization con CRON_SECRET.',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token con CRON_SECRET',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Limpieza ejecutada correctamente',
    schema: {
      example: {
        success: true,
        deletedCount: 15,
        message: 'Sesiones limpiadas: 15',
        timestamp: '2025-11-20T16:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'CRON_SECRET inválido o ausente',
  })
  async cleanupSessions(@Headers('authorization') authHeader: string) {
    // Validar CRON_SECRET
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      throw new UnauthorizedException('CRON_SECRET not configured');
    }

    const token = authHeader?.replace('Bearer ', '');

    if (token !== cronSecret) {
      throw new UnauthorizedException('Invalid CRON_SECRET');
    }

    // Ejecutar limpieza
    const result = await this.accessService.cleanSessiones();

    return result;
  }
}
