// app/api/courses/route.js
import { listCourses } from "../../../lib/repos/courseRepo";

export async function GET() {
  try {
    const courses = await listCourses();
    return new Response(JSON.stringify(courses), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /api/courses error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
