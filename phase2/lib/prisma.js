// lib/prisma.js
import { PrismaClient } from "@prisma/client";

let prisma;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // Guarantee a single instance in development
  global.__prisma ||= new PrismaClient();
  prisma = global.__prisma;
}

export { prisma };
