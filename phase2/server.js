import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/courses', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: { classes: true }
    });
    res.json(courses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/student/profile', async (req, res) => {
  const studentId = parseInt(req.query.studentId);
  if (!studentId) {
    return res.status(400).json({ error: 'Missing studentId query parameter' });
  }
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
      include: {
        registrations: {
          include: { class: true }
        }
      }
    });
    res.json(profile);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/student/registrations', async (req, res) => {
  const { studentId, classId } = req.body;
  if (!studentId || !classId) {
    return res.status(400).json({ error: 'Missing studentId or classId in body' });
  }
  try {
    const registration = await prisma.registration.create({
      data: {
        studentProfile: { connect: { userId: studentId } },
        class: { connect: { id: classId } },
        status: 'PENDING'
      }
    });
    res.json(registration);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/student/registrations/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid registration id' });
  }
  try {
    await prisma.registration.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Express API listening on http://localhost:${PORT}`);
});
