import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  path: string;

  @Column()
  original_name: string;

  @Column()
  mime_type: string;

  @Column({ type: 'bytea', nullable: true })
  buffer: Buffer | ArrayBuffer | null;
}
