import * as dotenv from 'dotenv'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env')
console.log('Loading .env from:', envPath)
dotenv.config({ path: envPath })
console.log('DB_USER:', process.env.DB_USER)
console.log('DB_PASSWORD:', process.env.DB_PASSWORD)

import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { ApiResponseInterceptor, ApiExceptionFilter } from './common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true
  }))
  app.useGlobalInterceptors(new ApiResponseInterceptor())
  app.useGlobalFilters(new ApiExceptionFilter())
  app.enableCors()

  const port = process.env.PORT || 4000
  await app.listen(port)
  console.log(`Application is running on: http://localhost:${port}/api`)
}

bootstrap()
