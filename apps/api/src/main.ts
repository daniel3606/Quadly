import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { BoardsService } from './boards/boards.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration - allow web, mobile, and quadly.org origins
  const allowedOrigins = [
    process.env.WEB_URL || 'http://localhost:3000',
    'https://quadly.org',
    'http://localhost:3000',
    /^exp:\/\/.*/, // Expo Go
    /^quadly:\/\/.*/, // Custom scheme
  ];
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Quadly API')
    .setDescription('Quadly Campus Community Platform API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Initialize boards
  const boardsService = app.get(BoardsService);
  await boardsService.initializeBoards();

  const port = process.env.API_PORT || 8000;
  await app.listen(port);
  console.log(`🚀 API server running on http://localhost:${port}`);
  console.log(`📚 API docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
