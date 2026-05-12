import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const logger = new Logger('Bootstrap');

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
        const messages = errors.flatMap(err => {
          // 提取当前约束错误
          const constraints = Object.values(err.constraints ?? {});
          // 提取嵌套子错误（如 ValidateNested 产生的子属性错误）
          const childErrors =
            err.children?.flatMap(child => {
              const extractErrors = (e: typeof err, path: string): string[] => {
                const curr = Object.values(e.constraints ?? {}).map(msg => `${path}: ${msg}`);
                const nested =
                  e.children?.flatMap(c => extractErrors(c, `${path}.${c.property}`)) ?? [];
                return [...curr, ...nested];
              };
              return extractErrors(child, `${err.property}.${child.property}`);
            }) ?? [];
          return [...constraints, ...childErrors];
        });
        logger.warn(`验证失败: ${messages.join('; ')}`);
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
