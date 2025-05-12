import { prisma } from "../prisma";

export async function listCourses() {
  return prisma.course.findMany({
    include: { classes: true },
  });
}

export async function getCourse(id) {
  return prisma.course.findUnique({
    where: { id: Number(id) },
    include: { classes: true },
  });
}
