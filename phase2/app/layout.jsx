"use client";
import "./globals.css";
import Link from "next/link";
import useUser from "../lib/useUser";
import { logout } from "../lib/logout-client";

export default function RootLayout({ children }) {
  const user = useUser();
  const role = user?.role;

  return (
    <html lang="en">
      <head />
      <body>
        <nav className="bg-white shadow p-4 flex justify-between items-center">
          <div className="space-x-4">
            <Link href="/" className="font-bold">
              Home
            </Link>
            {role === "STUDENT" && <Link href="/student">My Courses</Link>}
            {role === "INSTRUCTOR" && <Link href="/instructor">My Schedule</Link>}
            {role === "ADMIN" && (
              <>
                <Link href="/admin">Admin Dashboard</Link>
                <Link href="/admin/statistics">Statistics</Link>
              </>
            )}
          </div>
          <div>
            {user ? (
              <button
                onClick={logout}
                className="px-3 py-1 border rounded"
              >
                Sign Out
              </button>
            ) : (
              <Link href="/login" className="px-3 py-1 border rounded">
                Sign In
              </Link>
            )}
          </div>
        </nav>
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}
