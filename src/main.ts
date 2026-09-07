import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { bigIntToNumber } from './common/utils/serialize';

/**
 * BigInt values (e.g. Offer.price) cannot be serialized by JSON.stringify
 * and crash every response that contains one ("Do not know how to serialize
 * a BigInt"). Patching the prototype once here makes every BigInt serialize
 * as a plain number globally.
 */
(BigInt.prototype as any).toJSON = function () {
  return bigIntToNumber(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: false,
    }),
  );
  app.enableCors({
    origin: '*',
  });
  const config = new DocumentBuilder().setTitle('Torob').setDescription('The torob API description').setVersion('1.0').build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
