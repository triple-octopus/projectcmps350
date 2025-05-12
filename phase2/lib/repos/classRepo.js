export async function getClassById(id) {
    return prisma.class.findUnique({
      where: { id },
      include: { instructor: true, registrations: true, course: true },
    });
  }
  
  export async function approveRegistration(registrationId) {
    return prisma.registration.update({
      where: { id: registrationId },
      data: { status: 'APPROVED' },
    });
  }