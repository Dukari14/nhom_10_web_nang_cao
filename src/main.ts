import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module';
import {UserModule} from "./user/user.module";
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(UserModule, {
    instrument: ObserveInstrument,
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
