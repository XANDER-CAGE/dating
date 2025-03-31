import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  
  @Catch()
  export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);
  
    catch(exception: any, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest<Request>();
      const response = ctx.getResponse<Response>();
  
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
  
      // Получаем сообщение об ошибке
      let message: string;
      let details: any = null;
  
      if (exception instanceof HttpException) {
        const exceptionResponse = exception.getResponse();
        
        if (typeof exceptionResponse === 'string') {
          message = exceptionResponse;
        } else if (typeof exceptionResponse === 'object') {
          message = (exceptionResponse as any).message || 'Internal server error';
          details = (exceptionResponse as any).details || null;
        } else {
          message = 'Internal server error';
        }
      } else {
        message = exception.message || 'Internal server error';
      }
  
      // Логируем ошибку
      if (status >= 500) {
        this.logger.error(
          `${request.method} ${request.url} - ${status} - ${message}`,
          exception.stack,
        );
      } else {
        this.logger.warn(
          `${request.method} ${request.url} - ${status} - ${message}`,
        );
      }
  
      // Формируем ответ
      const responseBody = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message,
        details,
      };
  
      // Удаляем null поля
      if (!details) {
        delete responseBody.details;
      }
  
      // Отправляем ответ
      response.status(status).json(responseBody);
    }
  }