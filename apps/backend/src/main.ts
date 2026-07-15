import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './filters/prisma.filter';
import { GenericExceptionFilter } from './filters/generic.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const reflector = app.get(Reflector);
  const globalPrefix = 'api';

  app.setGlobalPrefix(globalPrefix);

  // Interceptors
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // Filters
  app.useGlobalFilters(
    new GenericExceptionFilter(),
    new PrismaExceptionFilter()
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
