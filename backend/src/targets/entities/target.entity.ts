import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('targets')
export class Target {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ length: 10 })
  month: string;

  @Column({ type: 'int', width: 11, default: 0 })
  target: number;

  @Column({ type: 'bigint', default: 0 })
  buyer_network: number;

  @Column({ type: 'int', width: 11, default: 0 })
  buyer: number;

  @Column({ length: 100 })
  created_by: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}