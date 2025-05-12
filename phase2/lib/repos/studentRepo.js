import { prisma } from "../prisma";

export async function getStudentProfile(userId) {
  return prisma.studentProfile.findUnique({
    where: { userId: Number(userId) },
    include: {
      registrations: {
        include: {
          class: {
            include: {
              course: true,
              instructor: { include: { user: true } },
            },
          },
        },
      },
      completedCourses: {
        include: {
          course: true,
        },
      },
    },
  });
}

export async function requestCourse(studentProfileId, classId) {
  return prisma.registration.create({
    data: {
      studentProfile: { connect: { id: Number(studentProfileId) } },
      class: { connect: { id: Number(classId) } },
      status: "PENDING",
    },
  });
}

export async function dropRegistration(registrationId) {
  return prisma.registration.delete({
    where: { id: Number(registrationId) },
  });
}
