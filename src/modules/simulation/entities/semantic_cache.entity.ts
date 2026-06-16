import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('semantic_caches')
export class SemanticCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  question_id: string;

  @Column('text')
  query_text: string;

  // TypeORM sees 'text' for schema purposes; actual DB type is vector(384).
  // All vector I/O goes through raw SQL — never read via ORM mapper.
  @Column({ type: 'text', select: false })
  query_embedding: number[];

  @Column('boolean')
  is_correct: boolean;

  @Column('timestamptz')
  created_at: Date;

  @Column('timestamptz')
  expires_at: Date;
}
