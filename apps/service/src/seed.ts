import * as dotenv from "dotenv";
import * as path from "path";

const envPath = path.join(process.cwd(), ".env");
dotenv.config({ path: envPath });

import { NestFactory } from "@nestjs/core";
import { SeedModule } from "./commands/seed/seed.module";
import { SeedService } from "./commands/seed/seed.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const seedService = app.get(SeedService);
  await seedService.seed();
  await app.close();
  process.exit(0);
}

bootstrap();
