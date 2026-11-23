
import { Column, Entity, ForeignKey, Index } from 'typeorm';

import { BasePersistenceEntity } from '@common/database/base-persistence.entity';
import { AccountEntity } from '@feature/account/account.entity';

@Entity({ name: 'password_credential' })
@Index('uq_password_credential_account_id', ['accountId'], {
  unique: true,
})
@ForeignKey(() => AccountEntity, ['accountId'], ['id'], {
  onDelete: 'RESTRICT',
})
export class PasswordCredentialEntity extends BasePersistenceEntity {
  // Je récupère le compte associé au mot de passe.
  @Column({ name: 'account_id', type: 'varchar', length: 26 })
  accountId!: string;

  // Je conserve uniquement le mot de passe haché.
  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  // Je précise la version du hachage.
  @Column({ name: 'hash_version', type: 'varchar', length: 32 })
  hashVersion!: string;

  // Je compte les tentatives de connexion échouées.
  @Column({ name: 'failed_attempts', type: 'integer', default: 0 })
  failedAttempts!: number;

  // Je conserve la date de fin du verrouillage.
  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  // Je conserve la date de la dernière erreur.
  @Column({ name: 'last_failed_at', type: 'timestamptz', nullable: true })
  lastFailedAt!: Date | null;

  // Je conserve la date de la dernière utilisation.
  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  // Je conserve la date du dernier changement de mot de passe.
  @Column({ name: 'changed_at', type: 'timestamptz' })
  changedAt!: Date;

  // Je vérifie si le mot de passe a été désactivé.
  @Column({ name: 'disabled_at', type: 'timestamptz', nullable: true })
  disabledAt!: Date | null;
}
