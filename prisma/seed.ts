import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Get started with basic features',
    priceMonthly: 0,
    priceYearly: 0,
    maxMembers: 2,
    maxProjects: 3,
    maxStorage: 1024,
    maxApiCalls: 1000,
    features: [
      'Up to 2 team members',
      'Up to 3 projects',
      '1GB storage',
      'Basic analytics',
      'Email support',
    ],
    isPopular: false,
    isEnterprise: false,
    sortOrder: 0,
  },
  {
    name: 'Starter',
    slug: 'starter',
    description: 'Perfect for small teams',
    priceMonthly: 2900,
    priceYearly: 29000,
    maxMembers: 5,
    maxProjects: 10,
    maxStorage: 10240,
    maxApiCalls: 10000,
    features: [
      'Up to 5 team members',
      'Up to 10 projects',
      '10GB storage',
      'Advanced analytics',
      'Priority email support',
      'API access',
      'Wallet & transactions',
    ],
    isPopular: false,
    isEnterprise: false,
    sortOrder: 1,
  },
  {
    name: 'Professional',
    slug: 'professional',
    description: 'For growing businesses',
    priceMonthly: 7900,
    priceYearly: 79000,
    maxMembers: 20,
    maxProjects: 50,
    maxStorage: 51200,
    maxApiCalls: 100000,
    features: [
      'Up to 20 team members',
      'Up to 50 projects',
      '50GB storage',
      'Custom analytics',
      'Phone & email support',
      'Advanced API access',
      'Multi-wallet support',
      'Custom integrations',
      'Audit logs',
    ],
    isPopular: true,
    isEnterprise: false,
    sortOrder: 2,
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'For large organizations',
    priceMonthly: 29900,
    priceYearly: 299000,
    maxMembers: -1,
    maxProjects: -1,
    maxStorage: -1,
    maxApiCalls: -1,
    features: [
      'Unlimited team members',
      'Unlimited projects',
      'Unlimited storage',
      'Enterprise analytics',
      'Dedicated support',
      'Full API access',
      'Unlimited wallets',
      'Custom integrations',
      'Advanced audit logs',
      'SSO/SAML',
      'Custom contracts',
      'SLA guarantee',
    ],
    isPopular: false,
    isEnterprise: true,
    sortOrder: 3,
  },
];

async function main() {
  console.log('Seeding database...');

  // Create plans
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
    console.log(`Created/updated plan: ${plan.name}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
