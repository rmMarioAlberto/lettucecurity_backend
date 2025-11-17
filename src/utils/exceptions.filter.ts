import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Error interno del servidor';
    let errorCode: string | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message;
    }

    else if (exception instanceof PrismaClientKnownRequestError) {
      const prismaError = exception as PrismaClientKnownRequestError;
      errorCode = prismaError.code;

      switch (prismaError.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Registro duplicado (violación de restricción única).';
          break;

        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Violación de clave foránea.';
          break;

        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'El registro solicitado no existe.';
          break;

        default:
          status = HttpStatus.BAD_REQUEST;
          message = `Error de base de datos (${prismaError.code}).`;
          break;
      }
    }

    else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error({
      path: request.url,
      method: request.method,
      status,
      errorCode,
      message,
      stack: (exception as Error)?.stack,
    });

    response.status(status).json({
      statusCode: status,
      message,
      errorCode,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
