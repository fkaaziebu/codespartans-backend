import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType('Image')
@Entity('images')
export class Image {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  path: string;

  @Field()
  @Column()
  original_name: string;

  @Field()
  @Column()
  mime_type: string;

  @Column({ type: 'bytea', nullable: true })
  buffer: Buffer | ArrayBuffer | null;
}
