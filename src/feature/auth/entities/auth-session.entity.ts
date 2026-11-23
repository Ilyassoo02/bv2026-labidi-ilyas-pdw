import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { BasePersistenceEntity } from '@common/database/base-persistence.entity';
import { AccountEntity } from '@feature/account/account.entity';

// Je représente une session de connexion.
// Une session peut être révoquée sans supprimer le compte.
@Entity({ name: 'auth_session' })
@Index('idx_auth_session_account_id', ['accountId'])
@ForeignKey(() => AccountEntity, ['accountId'], ['id'], {
  onDelete: 'RESTRICT',
})
export class AuthSessionEntity extends BasePersistenceEntity {
  @Column({
    name: 'account_id',
    type: 'varchar',
    length: 26,
  })
  accountId!: string;

  @Column({
    name: 'access_version',
    type: 'integer',
    default: 0,
  })
  accessVersion!: number;

  @Column({
    name: 'csrf_token_hash',
    type: 'varchar',
    length: 64,
  })
  csrfTokenHash!: string;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
  })
  expiresAt!: Date;

  @Column({
    name: 'revoked_at',
    type: 'timestamptz',
    nullable: true,
  })
  revokedAt!: Date | null;
}
