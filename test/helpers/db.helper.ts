import { DataSource } from 'typeorm';
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
