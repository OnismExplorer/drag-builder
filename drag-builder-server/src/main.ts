import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 配置 CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 注册全局 HTTP 异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 注册全局验证管道，自定义验证错误格式
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剥离非 DTO 字段
      forbidNonWhitelisted: true, // 存在非白名单字段时抛出错误
      transform: true, // 自动转换类型
      exceptionFactory: errors => {
        // 将 class-validator 错误整理为扁平的消息数组
        const messages = errors.flatMap(err => Object.values(err.constraints ?? {}));
        return new BadRequestException({
          statusCode: 400,
          error: 'Validation Failed',
          message: messages,
        });
      },
    })
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`[${new Date().toISOString()}] 服务已启动，监听端口 ${port}`);
}
void bootstrap().then();
