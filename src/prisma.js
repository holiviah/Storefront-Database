import { PrismaClient } from '@prisma/client';

const globalWithPrisma = globalThis;
const prisma = globalWithPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV === 'development') globalWithPrisma.prisma = prisma;

export default prisma;
