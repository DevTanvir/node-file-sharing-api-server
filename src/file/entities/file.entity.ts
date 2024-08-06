import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  publicKey: string;

  @Column('uuid')
  privateKey: string;

  @Column('bytea')
  fileBuffer: Buffer;

  @CreateDateColumn({ name: 'createdAt', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', nullable: true })
  updatedAt: Date;

  @Column()
  mimeType: string;

  @Column()
  filePath: string;

  @Column()
  fileName: string;

  @Column()
  createdBy: number;
}
