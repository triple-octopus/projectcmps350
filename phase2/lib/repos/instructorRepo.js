export async function getInstructorProfile(userId) {
    return prisma.instructorProfile.findUnique({
      where: { userId },
      include: { classes: true },
    });
  }
  
  export async function assignGrade(registrationId, grade) {
    const reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { class: true },
    });
    return prisma.completedCourse.create({
      data: {
        studentId: reg.studentId,
        courseId: reg.class.courseId,
        grade,
      },
    });
  }