import { PrismaClient, type Prisma } from '@prisma/client';

interface EntitlementSeed {
  code: string;
  valueType: 'BOOLEAN' | 'NUMBER' | 'STRING';
  booleanValue?: boolean;
  numberValue?: number;
  stringValue?: string;
}

const plans: {
  code: string;
  name: string;
  description: string;
  interval: 'MONTH' | 'YEAR';
  sortOrder: number;
  entitlements: EntitlementSeed[];
}[] = [
  {
    code: 'free',
    name: 'Free',
    description: 'Starter tier for evaluation',
    interval: 'MONTH',
    sortOrder: 10,
    entitlements: [
      { code: 'devices.max', valueType: 'NUMBER', numberValue: 1 },
      { code: 'contacts.max', valueType: 'NUMBER', numberValue: 500 },
      { code: 'campaigns.active.max', valueType: 'NUMBER', numberValue: 2 },
      { code: 'messages.monthly.max', valueType: 'NUMBER', numberValue: 1000 },
      { code: 'templates.max', valueType: 'NUMBER', numberValue: 10 },
      { code: 'imports.enabled', valueType: 'BOOLEAN', booleanValue: true },
      { code: 'api_tokens.enabled', valueType: 'BOOLEAN', booleanValue: false },
      { code: 'multi_device.enabled', valueType: 'BOOLEAN', booleanValue: false },
      { code: 'operations.read', valueType: 'BOOLEAN', booleanValue: false },
      { code: 'excel_addin.enabled', valueType: 'BOOLEAN', booleanValue: true },
      { code: 'mobile_gateway.enabled', valueType: 'BOOLEAN', booleanValue: true },
    ],
  },
  {
    code: 'pro',
    name: 'Pro',
    description: 'Scale up for teams',
    interval: 'MONTH',
    sortOrder: 20,
    entitlements: [
      { code: 'devices.max', valueType: 'NUMBER', numberValue: 5 },
      { code: 'contacts.max', valueType: 'NUMBER', numberValue: 20000 },
      { code: 'campaigns.active.max', valueType: 'NUMBER', numberValue: 20 },
      { code: 'messages.monthly.max', valueType: 'NUMBER', numberValue: 50000 },
      { code: 'templates.max', valueType: 'NUMBER', numberValue: 100 },
      { code: 'imports.enabled', valueType: 'BOOLEAN', booleanValue: true },
      { code: 'api_tokens.enabled', valueType: 'BOOLEAN', booleanValue: true },
      { code: 'multi_device.enabled', valueType: 'BOOLEAN', booleanValue: true },
      { code: 'operations.read', valueType: 'BOOLEAN', booleanValue: true },
      { code: 'excel_addin.enabled', valueType: 'BOOLEAN', booleanValue: true },
      { code: 'mobile_gateway.enabled', valueType: 'BOOLEAN', booleanValue: true },
    ],
  },
  {
    code: 'agency',
    name: 'Agency',
    description: 'High-volume and multi-device tier',
    interval: 'MONTH',
    sortOrder: 30,
    entitlements: [
      { code: 'devices.max', valueType: 'NUMBER', numberValue: 25 },
      { code: 'contacts.max', valueType: 'NUMBER', numberValue: 200000 },
      { code: 'campaigns.active.max', valueType: 'NUMBER', numberValue: 200 },
      { code: 'messages.monthly.max', valueType: 'NUMBER', numberValue: 500000 },
      { code: 'templates.max', valueType: 'NUMBER', numberValue: 500 },
      { code: 'imports.enabled', valueType: 'BOOLEAN', booleanValue: true },
      { code: 'api_tokens.enabled', valueType: 'BOOLEAN', booleanValue: true },
      { code: 'multi_device.enabled', valueType: 'BOOLEAN', booleanValue: true },
      { code: 'operations.read', valueType: 'BOOLEAN', booleanValue: true },
      { code: 'excel_addin.enabled', valueType: 'BOOLEAN', booleanValue: true },
      { code: 'mobile_gateway.enabled', valueType: 'BOOLEAN', booleanValue: true },
    ],
  },
];

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    for (const plan of plans) {
      const upsertedPlan = await prisma.billingPlan.upsert({
        where: { code: plan.code },
        update: {
          name: plan.name,
          description: plan.description,
          provider: 'STRIPE',
          interval: plan.interval,
          isActive: true,
          sortOrder: plan.sortOrder,
        },
        create: {
          code: plan.code,
          name: plan.name,
          description: plan.description,
          provider: 'STRIPE',
          interval: plan.interval,
          isActive: true,
          sortOrder: plan.sortOrder,
        },
        select: { id: true },
      });

      for (const entitlement of plan.entitlements) {
        const data: Prisma.BillingEntitlementUncheckedCreateInput = {
          planId: upsertedPlan.id,
          code: entitlement.code,
          valueType: entitlement.valueType,
          booleanValue: entitlement.booleanValue ?? null,
          numberValue: entitlement.numberValue ?? null,
          stringValue: entitlement.stringValue ?? null,
        };

        await prisma.billingEntitlement.upsert({
          where: { planId_code: { planId: upsertedPlan.id, code: entitlement.code } },
          update: data,
          create: data,
        });
      }
    }
    console.log('seed-billing: OK');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
