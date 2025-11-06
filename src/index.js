const prisma = require('./prisma');

async function main() {
  console.log('Prisma + MongoDB: running a quick check...');
  try {
    // Simple query to list zero or more users (safe if empty DB)
    const users = await prisma.user.findMany({ take: 5 });
    console.log('Found users (up to 5):', users.length);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
