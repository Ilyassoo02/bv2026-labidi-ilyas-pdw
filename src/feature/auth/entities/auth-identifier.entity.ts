
import { Column, Entity, ForeignKey, Index } from 'typeorm';

import { BasePersistenceEntity } from '@common/database/base-persistence.entity';
import { AccountEntity } from '@feature/account/account.entity';

import { AuthIdentifierType } from '../auth-identifier-type.enum';

@Entity({ name: 'auth_identifier' })
@Index('uq_auth_identifier_type_value', ['type', 'value'], {
  unique: true,
})
@Index('idx_auth_identifier_account_id', ['accountId'])
@ForeignKey(() => AccountEntity, ['accountId'], ['id'], {
  onDelete: 'RESTRICT',
})
export class AuthIdentifierEntity extends BasePersistenceEntity {
  @Column({
    name: 'account_id',
    type: 'varchar',
    length: 26,
  })
  accountId!: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: AuthIdentifierType,
  })
  type!: AuthIdentifierType;

  @Column({
    name: 'value',
    type: 'varchar',
    length: 320,
  })
  value!: string;

  @Column({
    name: 'verified_at',
    type: 'timestamptz',
    nullable: true,
  })
  verifiedAt!: Date | null;

  @Column({
    name: 'is_primary',
    type: 'boolean',
    default: false,
  })
  isPrimary!: boolean;
}
