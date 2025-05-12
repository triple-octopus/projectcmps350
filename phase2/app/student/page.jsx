"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useUser from "../../lib/useUser";

export default function StudentPage() {
  const router = useRouter();
  const user = useUser();             // undefined | null | { … }
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState(null);

useEffect(() => {
    // once user is known
    if (user === undefined) return;  // still loading
    if (user === null) {
      router.push('/login');
      return;
    }
    if (user.role !== 'STUDENT') {
      router.push('/');
      return;
    }
  
    // fetch profile
    fetch('/api/student/profile', { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          // if the API told us “Unauthorized” or another problem:
          router.push('/login');
        } else {
          setProfile(data);
        }
      })
      .catch((e) => {
        console.error('profile fetch failed', e);
        router.push('/login');
      });
    // fetch courses...
  }, [user, router]);
  

  // Show spinner while loading anything
  if (!user || !profile || !courses) {
    return <p className="p-4">Loading...</p>;
  }

  // Handlers
  async function handleDrop(id) {
    await fetch(`/api/student/registrations/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    setProfile((p) => ({
      ...p,
      registrations: p.registrations.filter((r) => r.id !== id),
    }));
  }

  async function handleRequest(e) {
    e.preventDefault();
    const classId = +e.target.classId.value;
    await fetch("/api/student/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ classId }),
    });
    // refresh
    const updated = await fetch("/api/student/profile", {
      credentials: "same-origin",
    }).then((r) => r.json());
    setProfile(updated);
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>

      <section className="mb-6">
        <h2 className="text-xl mb-2">My Registrations</h2>
        <ul className="list-disc ml-6">
          {profile.registrations.map((r) => (
            <li key={r.id} className="mb-2">
              {r.class.classId} — {r.status}{" "}
              <button
                onClick={() => handleDrop(r.id)}
                className="ml-2 text-sm text-red-600 hover:underline"
              >
                Drop
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl mb-2">Request a Course</h2>
        <form onSubmit={handleRequest} className="flex items-center space-x-2">
          <select name="classId" className="border p-2">
            {courses.flatMap((c) =>
              c.classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.classId} ({c.name})
                </option>
              ))
            )}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Request
          </button>
        </form>
      </section>
    </div>
  );
}

