import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@roadportal.com' },
    update: {},
    create: {
      email: 'admin@roadportal.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create sample workers
  const worker1Password = await bcrypt.hash('worker123', 12);
  const worker1 = await prisma.user.upsert({
    where: { email: 'worker1@roadportal.com' },
    update: {},
    create: {
      email: 'worker1@roadportal.com',
      password: worker1Password,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: UserRole.WORKER,
    },
  });

  const worker2Password = await bcrypt.hash('worker123', 12);
  const worker2 = await prisma.user.upsert({
    where: { email: 'worker2@roadportal.com' },
    update: {},
    create: {
      email: 'worker2@roadportal.com',
      password: worker2Password,
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1234567891',
      role: UserRole.WORKER,
    },
  });

  console.log('✅ Worker users created:', worker1.email, worker2.email);

  // Create sample regular user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@roadportal.com' },
    update: {},
    create: {
      email: 'user@roadportal.com',
      password: userPassword,
      firstName: 'Alice',
      lastName: 'Johnson',
      phone: '+1234567892',
      role: UserRole.USER,
    },
  });

  console.log('✅ Regular user created:', user.email);

  // Create system settings
  await prisma.systemSettings.upsert({
    where: { key: 'app_name' },
    update: {},
    create: {
      key: 'app_name',
      value: 'Road Issue Reporting Portal',
    },
  });

  await prisma.systemSettings.upsert({
    where: { key: 'app_version' },
    update: {},
    create: {
      key: 'app_version',
      value: '1.0.0',
    },
  });

  console.log('✅ System settings created');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('Admin: admin@roadportal.com / admin123');
  console.log('Worker 1: worker1@roadportal.com / worker123');
  console.log('Worker 2: worker2@roadportal.com / worker123');
  console.log('User: user@roadportal.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
