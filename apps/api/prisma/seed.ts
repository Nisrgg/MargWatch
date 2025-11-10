import { PrismaClient, UserRole, IssueCategory, ComplaintStatus, WorkOrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
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

  // Create sample complaints
  const complaints = [];
  const categories = [IssueCategory.POTHOLE, IssueCategory.ROAD_INSTABILITY, IssueCategory.STREETLIGHT_DAMAGE, IssueCategory.TREE_DAMAGE, IssueCategory.OTHER];
  const statuses = [ComplaintStatus.REGISTERED, ComplaintStatus.APPROVED, ComplaintStatus.PROCESSING, ComplaintStatus.COMPLETED, ComplaintStatus.REJECTED];
  
  for (let i = 0; i < 15; i++) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days
    
    const complaint = await prisma.complaint.create({
      data: {
        title: `Sample Complaint ${i + 1}`,
        description: `This is a sample complaint description for testing purposes. Issue ${i + 1} needs attention.`,
        category: categories[Math.floor(Math.random() * categories.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        latitude: 28.6139 + (Math.random() - 0.5) * 0.1, // Around Delhi area
        longitude: 77.2090 + (Math.random() - 0.5) * 0.1,
        address: `Sample Address ${i + 1}, Delhi`,
        userId: user.id,
        createdAt,
        updatedAt: createdAt,
      },
    });
    complaints.push(complaint);
  }

  console.log('✅ Sample complaints created:', complaints.length);

  // Create sample work orders
  const workOrders = [];
  for (let i = 0; i < 8; i++) {
    const complaint = complaints[Math.floor(Math.random() * complaints.length)];
    const worker = Math.random() > 0.5 ? worker1 : worker2;
    
    const assignedAt = new Date();
    assignedAt.setDate(assignedAt.getDate() - Math.floor(Math.random() * 20));
    
    const workOrder = await prisma.workOrder.create({
      data: {
        complaintId: complaint.id,
        workerId: worker.id,
        priority: Math.floor(Math.random() * 3) + 1, // 1, 2, or 3
        status: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.COMPLETED][Math.floor(Math.random() * 3)],
        cost: Math.floor(Math.random() * 5000) + 500,
        assignedAt,
        completedAt: Math.random() > 0.6 ? new Date(assignedAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        workDescription: `Work order for ${complaint.title}`,
      },
    });
    workOrders.push(workOrder);
  }

  console.log('✅ Sample work orders created:', workOrders.length);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📋 Test Accounts:');
  console.log(`Admin: admin@roadportal.com / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
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
