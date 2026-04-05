import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 全局 HTTP 异常过滤器
 * 捕获所有 HttpException，统一错误响应格式，并记录错误日志
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception.getResponse();

    // 提取错误消息（兼容字符串和对象格式）
    let message: string | string[];
    let error: string;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      error = exception.name;
    } else if (typeof exceptionResponse === 'object') {
      const resp = exceptionResponse as Record<string, unknown>;
      message = (resp.message as string | string[]) ?? exception.message;
      error = (resp.error as string) ?? exception.name;
    } else {
      message = exception.message;
      error = exception.name;
    }

    // 统一错误响应格式
    const errorBody = {
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // 记录错误日志（包含时间戳和堆栈信息）
    this.logger.error(
      `[${new Date().toISOString()}] ${request.method} ${request.url} → ${status}`,
      exception.stack
    );

    response.status(status).json(errorBody);
  }
}
