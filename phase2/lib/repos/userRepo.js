import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createUser({ username, password, name, role }) {
  return prisma.user.create({ data: { username, password, name, role } });
}

export async function findByUsername(username) {
  return prisma.user.findUnique({ where: { username } });
}

export async function findById(id) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findByOAuth(provider, providerAccountId) {
  return prisma.account.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    include: { user: true },
  });
}