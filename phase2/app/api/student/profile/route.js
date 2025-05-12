// app/api/student/profile/route.js
import { getCurrentUser } from '../../../../lib/auth';
import { getStudentProfile } from '../../../../lib/repos/studentRepo';

export async function GET(request) {
  try {
    const user = getCurrentUser();
    if (!user || user.role !== 'STUDENT') {
      // Always return a JSON body
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const profile = await getStudentProfile(user.id);
    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify(profile),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('GET /api/student/profile error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
