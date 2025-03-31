import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  import { instanceToPlain } from 'class-transformer';
  
  export interface Response<T> {
    data: T;
    statusCode: number;
    timestamp: string;
    path: string;
  }
  
  @Injectable()
  export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Observable<Response<T>> {
      const request = context.switchToHttp().getRequest();
      const statusCode = context.switchToHttp().getResponse().statusCode;
      
      return next.handle().pipe(
        map((data) => {
          const response = {
            data: instanceToPlain(data) as T,
            statusCode,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
          return response;
        }),
      );
    }
  }