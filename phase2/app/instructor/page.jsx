import { getCurrentUser } from "../../lib/auth";
import { getInstructorProfile, assignGrade } from "../../lib/repos/instructorRepo";
import { approveRegistration } from "../../lib/repos/classRepo";

export const dynamic = "force-dynamic";

export default async function InstructorPage() {
  const user = getCurrentUser();
  if (!user || user.role !== "INSTRUCTOR") {
    return <p className="text-red-500">Access Denied</p>;
  }
  const profile = await getInstructorProfile(user.id);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Instructor Dashboard</h1>
      {profile.classes.map((cls) => (
        <section key={cls.id} className="mb-6">
          <h2 className="text-xl">{cls.classId}</h2>
          <ul className="list-disc ml-6">
            {cls.registrations.map((r) => (
              <li key={r.id} className="flex items-center">
                {r.student.user.name} - {r.status}
                <form
                  action={async () => {
                    "use server";
                    await approveRegistration(r.id);
                  }}
                >
                  <button type="submit" className="ml-2 text-sm bg-green-500 text-white px-2 rounded">
                    Approve
                  </button>
                </form>
                <form
                  action={async (form) => {
                    "use server";
                    const grade = form.get("grade");
                    await assignGrade(r.id, grade);
                  }}
                  className="ml-4"
                >
                  <input name="grade" placeholder="Grade" className="border p-1 mr-2" />
                  <button type="submit" className="text-sm bg-blue-500 text-white px-2 rounded">
                    Assign
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
