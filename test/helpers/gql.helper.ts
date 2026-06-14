import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export async function gql(
  app: INestApplication,
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<{ data: Record<string, unknown>; errors?: unknown[] }> {
  const req = request(app.getHttpServer())
    .post('/graphql')
    .send({ query, variables });

  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  const res = await req;
  return res.body as { data: Record<string, unknown>; errors?: unknown[] };
}
