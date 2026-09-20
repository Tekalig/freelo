// scripts/seed-rbac.ts

import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';

import { Role } from 'src/iam/authorization/roles/entities/role.entity';
import { Permission } from 'src/iam/authorization/permission/entities/permission.entity';
import { User } from 'src/users/entities/user.entity';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',

    host: process.env.DB_HOST,

    port: parseInt(process.env.DB_PORT ?? '5432', 10),

    username: process.env.DB_USERNAME,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,

    entities: [Role, Permission, User],

    synchronize: false,
  });

  await dataSource.initialize();

  const roleRepo = dataSource.getRepository(Role);

  const permissionRepo = dataSource.getRepository(Permission);

  const userRepo = dataSource.getRepository(User);

  // ------------------------------------------
  // Permissions
  // ------------------------------------------

  const adminManageAll = await getOrCreatePermission(permissionRepo, {
    action: 'manage',
    subject: 'all',
    conditions: null,
  });

  const ownerManageClient = await getOrCreatePermission(permissionRepo, {
    action: 'manage',
    subject: 'Client',
    conditions: {
      'user.id': '$userId',
    },
  });

  const ownerCreateClient = await getOrCreatePermission(permissionRepo, {
    action: 'create',
    subject: 'Client',
    conditions: null,
  });

  const ownerManageProject = await getOrCreatePermission(permissionRepo, {
    action: 'manage',
    subject: 'Project',
    conditions: {
      'user.id': '$userId',
    },
  });

  const ownerCreateProject = await getOrCreatePermission(permissionRepo, {
    action: 'create',
    subject: 'Project',
    conditions: null,
  });

  const clientViewerReadInvoice = await getOrCreatePermission(permissionRepo, {
    action: 'read',
    subject: 'Invoice',
    conditions: {
      'client.id': '$userId',
    },
  });

  // ------------------------------------------
  // Roles
  // ------------------------------------------

  await getOrCreateRole(roleRepo, 'admin', 'Full platform access', [
    adminManageAll,
  ]);

  await getOrCreateRole(roleRepo, 'owner', 'Freelancer account owner', [
    ownerManageClient,
    ownerCreateClient,
    ownerManageProject,
    ownerCreateProject,
  ]);

  await getOrCreateRole(
    roleRepo,
    'client-viewer',
    'Read-only access to own invoices',
    [clientViewerReadInvoice],
  );

  // ------------------------------------------
  // Seed first admin user
  // ------------------------------------------

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@freelo.dev';

  const existingAdmin = await userRepo.findOne({
    where: {
      email: adminEmail,
    },
  });

  if (!existingAdmin) {
    const adminRole = await roleRepo.findOne({
      where: {
        name: 'admin',
      },
      relations: {
        permissions: true,
      },
    });

    if (!adminRole) {
      throw new Error('Admin role was not found');
    }

    const passwordHash = await bcrypt.hash(
      process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!',
      10,
    );

    const adminUser = userRepo.create({
      fullName: 'Admin User',
      email: adminEmail,

      password: passwordHash,
    });

    // IMPORTANT:
    // Uncomment and use the correct relation property
    // from your User entity.

    adminUser.roles = [adminRole];

    await userRepo.save(adminUser);

    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  await dataSource.destroy();

  console.log('RBAC seed complete.');
}

// ------------------------------------------
// Permission helper
// ------------------------------------------

async function getOrCreatePermission(
  repo: Repository<Permission>,
  data: {
    action: string;
    subject: string;
    conditions: Record<string, unknown> | null;
  },
): Promise<Permission> {
  let permission = await repo.findOne({
    where: {
      action: data.action,
      subject: data.subject,
    },
  });

  if (!permission) {
    permission = repo.create({
      action: data.action,
      subject: data.subject,
      conditions: data.conditions,
    });

    permission = await repo.save(permission);

    console.log(`Created permission: ${data.action} ${data.subject}`);
  }

  return permission;
}

// ------------------------------------------
// Role helper
// ------------------------------------------

async function getOrCreateRole(
  repo: Repository<Role>,
  name: string,
  description: string,
  permissions: Permission[],
): Promise<Role> {
  let role = await repo.findOne({
    where: {
      name,
    },

    relations: {
      permissions: true,
    },
  });

  if (!role) {
    role = repo.create({
      name,
      description,
      permissions,
    });

    role = await repo.save(role);

    console.log(`Created role: ${name}`);
  } else {
    const existingIds = new Set(role.permissions.map((p: Permission) => p.id));

    const newOnes = permissions.filter(
      (p: Permission) => !existingIds.has(p.id),
    );

    if (newOnes.length > 0) {
      role.permissions.push(...newOnes);

      await repo.save(role);

      console.log(
        `Updated role ${name} with ${newOnes.length} new permission(s)`,
      );
    }
  }

  return role;
}

// ------------------------------------------
// Run seed
// ------------------------------------------

seed().catch((err) => {
  console.error('Seed failed:', err);

  process.exit(1);
});
