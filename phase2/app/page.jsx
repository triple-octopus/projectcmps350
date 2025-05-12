import Link from "next/link";

export default function HomePage() {
  return (
    <div className="home-container">
      <h1 className="text-4xl font-bold mb-6" style={{ color: "var(--primary-color)" }}>
        Welcome to the Student Management System
      </h1>
      <Link href="/login" className="btn-primary">
        Sign In
      </Link>
    </div>
  );
}
