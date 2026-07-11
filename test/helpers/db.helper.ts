import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
import { Organization } from '../../src/modules/auth/entities/organization.entity';
import { Category } from '../../src/modules/inventory/entities/category.entity';
import { HashHelper } from '../../src/helpers';

export async function truncateAll(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repo = dataSource.getRepository(entity.name);
    await repo
      .query(`TRUNCATE "${entity.tableName}" CASCADE;`)
      .catch(() => {});
  }
}

// Login-attempt/lockout state (and other cached data like pw_changed/logged_out
// timestamps) lives in Redis, not Postgres, so truncateAll alone leaves it behind
// between test runs — flush it too, or fixed test emails can inherit stale lockouts.
export async function flushCache(cacheManager: Cache): Promise<void> {
  await cacheManager.clear();
}

export async function seedGenpopOrg(dataSource: DataSource): Promise<Organization> {
  const genpopEmail = process.env.GENPOP_EMAIL ?? 'genpop@codespartans.com';
  const orgRepo = dataSource.getRepository(Organization);
  const org = orgRepo.create({
    name: 'General Population',
    email: genpopEmail,
    password: await HashHelper.encrypt('password'),
  });
  return orgRepo.save(org);
}

export async function seedTestCategory(
  dataSource: DataSource,
  org: Organization,
): Promise<Category> {
  const categoryRepo = dataSource.getRepository(Category);
  const category = categoryRepo.create({
    name: 'BECE',
    avatar_url: 'https://example.com/bece.jpg',
    organization: org,
    courses: [],
  });
  return categoryRepo.save(category);
}
