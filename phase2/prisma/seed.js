// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const dataDir = path.resolve(__dirname, 'data');
  const usersData = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf-8'));
  const coursesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'courses.json'), 'utf-8'));

  console.log('Seeding admins...');
  for (const admin of usersData.admins) {
    const existing = await prisma.user.findUnique({ where: { username: admin.username } });
    if (!existing) {
      await prisma.user.create({
        data: { username: admin.username, password: admin.password, name: admin.name, role: 'ADMIN' },
      });
    }
  }

  console.log('Seeding instructors...');
  for (const inst of usersData.instructors) {
    let user = await prisma.user.findUnique({ where: { username: inst.username } });
    if (!user) {
      user = await prisma.user.create({
        data: { username: inst.username, password: inst.password, name: inst.name, role: 'INSTRUCTOR' },
      });
    }
    // Seed profile
    let profile = await prisma.instructorProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      profile = await prisma.instructorProfile.create({ data: { bio: inst.bio || '', userId: user.id } });
    }
    // Seed expertise
    for (const exp of inst.expertise || []) {
      const existsExp = await prisma.instructorExpertise.findFirst({ where: { instructorProfileId: profile.id, expertise: exp } });
      if (!existsExp) {
        await prisma.instructorExpertise.create({ data: { instructorProfileId: profile.id, expertise: exp } });
      }
    }
  }

  console.log('Seeding students...');
  for (const stu of usersData.students) {
    let user = await prisma.user.findUnique({ where: { username: stu.username } });
    if (!user) {
      user = await prisma.user.create({
        data: { username: stu.username, password: stu.password, name: stu.name, role: 'STUDENT' },
      });
    }
    const existingProfile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
    if (!existingProfile) {
      await prisma.studentProfile.create({ data: { userId: user.id } });
    }
  }

  console.log('Seeding courses and classes...');
  for (const course of coursesData.courses) {
    let createdCourse = await prisma.course.findUnique({ where: { code: course.code } });
    if (!createdCourse) {
      createdCourse = await prisma.course.create({
        data: { code: course.code, name: course.name, category: course.category, status: course.status.toUpperCase() },
      });
      // prerequisites
      for (const prereq of course.prerequisites || []) {
        await prisma.prerequisite.create({ data: { courseId: createdCourse.id, prerequisite: prereq } });
      }
    }
    // classes
    for (const cls of course.classes) {
      let newClass = await prisma.class.findUnique({ where: { classId: cls.classId } });
      if (!newClass) {
        const instrUser = await prisma.user.findUnique({ where: { username: cls.instructor } });
        const instrProfile = await prisma.instructorProfile.findUnique({ where: { userId: instrUser.id } });
        newClass = await prisma.class.create({
          data: { classId: cls.classId, schedule: cls.schedule, capacity: cls.capacity, validated: cls.validated, instructorId: instrProfile.id, courseId: createdCourse.id },
        });
      }
      // registrations
      for (const stuUsername of cls.registeredStudents || []) {
        const stuUser = await prisma.user.findUnique({ where: { username: stuUsername } });
        const stuProfile = await prisma.studentProfile.findUnique({ where: { userId: stuUser.id } });
        const existingReg = await prisma.registration.findFirst({ where: { studentProfileId: stuProfile.id, classId: newClass.id } });
        if (!existingReg) {
          await prisma.registration.create({ data: { studentProfileId: stuProfile.id, classId: newClass.id, status: 'APPROVED' } });
        }
      }
    }
  }

  console.log('Seeding completed!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
