import {
  BeforeInsert,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { createUlid } from '@common/logging';

// Je regroupe ici les colonnes communes à toutes mes tables : écrites une seule fois, héritées partout.
export abstract class BasePersistenceEntity {
  // Je fournis l'identifiant depuis l'application, sur 26 caractères.
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @VersionColumn()
  version!: number;

  // Je génère l'ULID juste avant l'INSERT, seulement si aucun identifiant n'a déjà été fixé.
  @BeforeInsert()
  generateId(): void {
    if (!this.id) {
      this.id = createUlid();
    }
  }
}
