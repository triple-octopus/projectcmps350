// app/api/auth/login/route.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  const { username, password } = await request.json();
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return new Response(
      JSON.stringify({ error: "Invalid credentials" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Determine validity: bcrypt if hashed, else plain-text
  let valid;
  if (user.password.startsWith("$2")) {
    // stored as bcrypt hash
    valid = await bcrypt.compare(password, user.password);
  } else {
    // stored as plain-text
    valid = password === user.password;
  }

  if (!valid) {
    return new Response(
      JSON.stringify({ error: "Invalid credentials" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create JWT and set it in an HttpOnly cookie
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "4h" }
  );
  cookies().set({
    name: "app_token",
    value: token,
    httpOnly: true,
    path: "/",
    maxAge: 4 * 3600,
  });

  return new Response(
    JSON.stringify({ ok: true }),
    { headers: { "Content-Type": "application/json" } }
  );
}
