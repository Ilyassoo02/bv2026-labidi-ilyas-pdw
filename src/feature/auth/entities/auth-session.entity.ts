
import { Column, Entity, ForeignKey, Index } from 'typeorm';

import { BasePersistenceEntity } from '@common/database/base-persistence.entity';
import { AccountEntity } from '@feature/account/account.entity';

@Entity({ name: 'auth_session' })
@Index('idx_auth_session_account_id', ['accountId'])
@ForeignKey(() => AccountEntity, ['accountId'], ['id'], {
  onDelete: 'RESTRICT',
})
export class AuthSessionEntity extends BasePersistenceEntity {
  // Je récupère le compte associé à la session.
  @Column({ name: 'account_id', type: 'varchar', length: 26 })
  accountId!: string;

  // Je conserve la version du jeton d'accès.
  @Column({ name: 'access_version', type: 'integer', default: 1 })
  accessVersion!: number;

  // Je conserve l'empreinte du jeton CSRF.
  @Column({ name: 'csrf_token_hash', type: 'varchar', length: 64 })
  csrfTokenHash!: string;

  // Je conserve la dernière utilisation de la session.
  @Column({ name: 'last_used_at', type: 'timestamptz' })
  lastUsedAt!: Date;

  // Je conserve la date d'expiration.
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  // Je conserve la date de révocation si la session est fermée.
  @Column({
    name: 'revoked_at',
    type: 'timestamptz',
    nullable: true,
  })
  revokedAt!: Date | null;

  // Je conserve la raison de la révocation.
  @Column({
    name: 'revocation_reason',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  revocationReason!: string | null;
}
