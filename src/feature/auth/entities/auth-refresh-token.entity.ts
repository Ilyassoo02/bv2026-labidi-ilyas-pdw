import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { BasePersistenceEntity } from '@common/database/base-persistence.entity';
import { AuthSessionEntity } from './auth-session.entity';

// Je conserve les empreintes des refresh tokens.
// Chaque token ne peut être remplacé qu'une seule fois.
@Entity({ name: 'auth_refresh_token' })
@Index('uq_auth_refresh_token_hash', ['tokenHash'], {
  unique: true,
})
@Index('uq_auth_refresh_token_parent_id', ['parentId'], {
  unique: true,
})
@Index('idx_auth_refresh_token_session_id', ['sessionId'])
@ForeignKey(() => AuthSessionEntity, ['sessionId'], ['id'], {
  onDelete: 'RESTRICT',
})
export class AuthRefreshTokenEntity extends BasePersistenceEntity {
  @Column({
    name: 'session_id',
    type: 'varchar',
    length: 26,
  })
  sessionId!: string;

  @Column({
    name: 'family_id',
    type: 'varchar',
    length: 26,
  })
  familyId!: string;

  @Column({
    name: 'token_hash',
    type: 'varchar',
    length: 64,
  })
  tokenHash!: string;

  @Column({
    name: 'parent_id',
    type: 'varchar',
    length: 26,
    nullable: true,
  })
  parentId!: string | null;

  @Column({
    name: 'replaced_by_id',
    type: 'varchar',
    length: 26,
    nullable: true,
  })
  replacedById!: string | null;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
  })
  expiresAt!: Date;

  @Column({
    name: 'consumed_at',
    type: 'timestamptz',
    nullable: true,
  })
  consumedAt!: Date | null;

  @Column({
    name: 'revoked_at',
    type: 'timestamptz',
    nullable: true,
  })
  revokedAt!: Date | null;
}
