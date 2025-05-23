import { prisma } from "../prisma";
export async function totalCounts() {
  const [students, instructors, courses] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.instructorProfile.count(),
    prisma.course.count(),
  ]);
  return { students, instructors, courses };
}
export async function avgCourseLoad() {
  const result = await prisma.registration.groupBy({
    by: ["studentProfileId"],
    _count: { id: true },
  });
  const avg =
    result.reduce((sum, r) => sum + r._count.id, 0) / result.length || 0;
  return avg;
}
export async function topRequestedCourses(limit = 5) {
  const raw = await prisma.registration.groupBy({
    by: ["classId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });
  const courses = await Promise.all(
    raw.map(async (r) => {
      const cls = await prisma.class.findUnique({
        where: { id: r.classId },
        include: { course: true },
      });
      return { code: cls.course.code, count: r._count.id };
    })
  );
  return courses;
}
export async function registrationApprovalRate() {
  const total = await prisma.registration.count();
  const approved = await prisma.registration.count({
    where: { status: "APPROVED" },
  });
  return total ? approved / total : 0;
}
export async function gradeDistribution() {
    const raw = await prisma.completedCourse.groupBy({
      by: ["grade"],
      _count: { id: true },
    });
    return raw.map((r) => ({
      grade: r.grade,
      count: r._count.id,
    }));
  }

export async function coursesNearingCapacity(threshold = 0.8) {
  const courses = await prisma.course.findMany({
    include: { classes: { include: { registrations: true } } },
  });
  return courses.filter((c) => {
    const enrolled = c.classes.reduce(
      (sum, cls) =>
        sum +
        cls.registrations.filter((r) => r.status === "APPROVED").length,
      0
    );
    return enrolled / c.capacity >= threshold;
  });
}
export async function instructorsByClassCount(limit = 5) {
  const raw = await prisma.class.groupBy({
    by: ["instructorId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });
  return Promise.all(
    raw.map(async (r) => {
      const instr = await prisma.instructorProfile.findUnique({
        where: { id: r.instructorId },
        include: { user: true },
      });
      return { username: instr.user.username, count: r._count.id };
    })
  );
}
export async function pendingRegistrationCount() {
  return prisma.registration.count({
    where: { status: "PENDING" },
  });
}
export async function withdrawalRate() {
  const total = await prisma.registration.count();
  const denied = await prisma.registration.count({
    where: { status: "DENIED" },
  });
  return total ? denied / total : 0;
}
export async function studentsWithCompletedMoreThan(n = 5) {
    const raw = await prisma.completedCourse.groupBy({
      by: ["studentProfileId"],
      _count: { id: true },
    });
      return raw.filter((r) => r._count.id > n).length;
  }
