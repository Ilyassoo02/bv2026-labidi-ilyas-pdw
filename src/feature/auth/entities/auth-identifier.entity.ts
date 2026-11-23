import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { BasePersistenceEntity } from '@common/database/base-persistence.entity';
import { AccountEntity } from '@feature/account/account.entity';
import { AuthIdentifierType } from '../auth-identifier-type.enum';

// Un compte peut posséder plusieurs identifiants.
// Chaque couple type + valeur doit être unique.
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
    type: 'varchar',
    length: 32,
  })
  type!: AuthIdentifierType;

  @Column({
    name: 'value',
    type: 'varchar',
    length: 320,
  })
  value!: string;
}
