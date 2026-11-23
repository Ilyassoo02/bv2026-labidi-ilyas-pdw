import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { BasePersistenceEntity } from '@common/database/base-persistence.entity';
import { AccountEntity } from '@feature/account/account.entity';

// Je stocke le hash du mot de passe et son état de sécurité.
// Le mot de passe en clair n'est jamais enregistré.
@Entity({ name: 'password_credential' })
@Index('uq_password_credential_account_id', ['accountId'], {
  unique: true,
})
@ForeignKey(() => AccountEntity, ['accountId'], ['id'], {
  onDelete: 'RESTRICT',
})
export class PasswordCredentialEntity extends BasePersistenceEntity {
  @Column({
    name: 'account_id',
    type: 'varchar',
    length: 26,
  })
  accountId!: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 512,
  })
  passwordHash!: string;

  @Column({
    name: 'hash_version',
    type: 'varchar',
    length: 32,
  })
  hashVersion!: string;

  @Column({
    name: 'failed_attempts',
    type: 'integer',
    default: 0,
  })
  failedAttempts!: number;

  @Column({
    name: 'locked_until',
    type: 'timestamptz',
    nullable: true,
  })
  lockedUntil!: Date | null;

  @Column({
    name: 'changed_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  changedAt!: Date;

  @Column({
    name: 'disabled_at',
    type: 'timestamptz',
    nullable: true,
  })
  disabledAt!: Date | null;
}
