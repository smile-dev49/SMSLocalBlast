import { PrismaClient } from '@prisma/client';
import { bootstrapDefaultRbac } from '../modules/auth/rbac/bootstrap-default-rbac';

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await bootstrapDefaultRbac(prisma);
    console.log('seed-auth-rbac: OK');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
