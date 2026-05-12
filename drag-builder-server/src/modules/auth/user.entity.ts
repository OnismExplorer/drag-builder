import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
@Index('idx_users_username', ['username'], { where: 'username IS NOT NULL' })
@Index('idx_users_email', ['email'], { where: 'email IS NOT NULL' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  username!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  email!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: false, name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'display_name' })
  displayName!: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}
