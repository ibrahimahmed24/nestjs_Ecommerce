import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser = require('cookie-parser');
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription(
      'E-Commerce Backend API - Authentication, Users, Products, Cart and Orders',
    )
    .setVersion('1.0')

    .addTag('Auth', 'Authentication and Authorization related endpoints')

    .addTag('Users', 'User management related endpoints')

    .addTag('Products', 'Product management related endpoints')

    .addTag('Cart', 'Shopping cart related endpoints')

    .addTag('Orders', 'Order management related endpoints')

    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your access token',
        in: 'header',
      },
      'jwt-auth',
    )

    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },

    customSiteTitle: 'E-Commerce API Documentation',

    customfavIcon: 'https://nestjs.com/img/logo-small.svg',

    customCss: `
        .swagger-ui .topbar {
          background-color: #f8f9fa;
        }

        .swagger-ui .topbar a {
          color: #007bff;
        }

        .swagger-ui .topbar a:hover {
          color: #0056b3;
        }

        .swagger-ui .topbar a:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
      `,
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Request-ID',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // 🎯 أضف هذه الأسطر هنا لطباعة الروابط بشكل واضح وجذاب في الـ Terminal
  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  logger.log(
    `📑 Swagger Documentation is available on: http://localhost:${port}/api/docs`,
  );
}

bootstrap().catch((err) => {
  Logger.error('❌ Error during application bootstrap:', err);
  process.exit(1);
});
