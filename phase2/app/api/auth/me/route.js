// app/api/auth/me/route.js
import { getCurrentUser } from "../../../../lib/auth";

export function GET() {
  const user = getCurrentUser();
  return new Response(
    JSON.stringify(user ?? null),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
