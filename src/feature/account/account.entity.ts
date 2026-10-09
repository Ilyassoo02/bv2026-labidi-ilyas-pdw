import { Column, Entity } from 'typeorm';
import { BasePersistenceEntity } from '@common/database/base-persistence.entity';
import { AccountStatus } from './account-status.enum';

// Je décris la table account : elle stocke ce qui est persisté, pas ce que le client peut voir.
@Entity({ name: 'account' })
export class AccountEntity extends BasePersistenceEntity {
  @Column({
    name: 'status',
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.Active,
  })
  status!: AccountStatus;

  @Column({ name: 'anonymized_at', type: 'timestamptz', nullable: true })
  anonymizedAt!: Date | null;
}
