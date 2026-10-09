import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvService } from '@common/config/env.service';
import { createNestTypeOrmOptions } from './database.options';

// Je possède la connexion PostgreSQL : les modules métier ne la reconfigurent jamais.
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [EnvService],
      useFactory: createNestTypeOrmOptions,
    }),
  ],
})
export class DatabaseModule {}
