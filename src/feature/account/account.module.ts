import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './account.controller';
import { AccountEntity } from './account.entity';
import { AccountService } from './account.service';

// Je regroupe ici tout le domaine Account : son entité, son Repository, son service et ses routes.
@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
