import { getCurrentUser } from "../../lib/auth";
import { listCourses } from "../../lib/repos/courseRepo";
import { pendingRegistrationCount } from "../../lib/repos/statsRepo";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return <p className="text-red-500">Access Denied</p>;
  }
  const courses = await listCourses();
  const pending = await pendingRegistrationCount();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p>
        Pending Registrations: <strong>{pending}</strong>
      </p>
      <section className="mt-4">
        <h2 className="text-xl">All Courses</h2>
        <ul className="list-disc ml-6">
          {courses.map((c) => (
            <li key={c.id}>
              {c.code} — {c.name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
