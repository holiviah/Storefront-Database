import prisma from '../src/prisma.js';

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('Prisma (MongoDB) connected');
    return prisma;
  } catch (err) {
    console.error('Prisma connection error:', err.message || err);
    process.exit(1);
  }
}
