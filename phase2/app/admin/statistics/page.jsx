// app/admin/statistics/page.jsx
import { getCurrentUser } from "../../../lib/auth";
import * as stats from "../../../lib/repos/statsRepo";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const user = getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return <p className="text-red-500">Access Denied</p>;
  }

  // Fetch all stats in parallel
  const [
    counts,
    avgLoad,
    topCourses,
    approvalRate,
    gradeDist,
    nearingCap,
    byClassCount,
    pending,
    withdrawal,
    manyCompleted,
  ] = await Promise.all([
    stats.totalCounts(),
    stats.avgCourseLoad(),
    stats.topRequestedCourses(),
    stats.registrationApprovalRate(),
    stats.gradeDistribution(),
    stats.coursesNearingCapacity(),
    stats.instructorsByClassCount(),
    stats.pendingRegistrationCount(),
    stats.withdrawalRate(),
    stats.studentsWithCompletedMoreThan(),
  ]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Statistics</h1>
      <ul className="list-disc ml-6 space-y-2">
        <li>Total Students: {counts.students}</li>
        <li>Total Instructors: {counts.instructors}</li>
        <li>Total Courses: {counts.courses}</li>
        <li>Avg Course Load: {avgLoad.toFixed(2)}</li>
        <li>
          Top Requested Courses:{" "}
          {topCourses.map((c) => c.code).join(", ")}
        </li>
        <li>Approval Rate: {(approvalRate * 100).toFixed(1)}%</li>
        <li>
          Grade Distribution:{" "}
          {gradeDist.map((g) => `${g.grade}:${g.count}`).join(", ")}
        </li>
        <li>Courses Nearing Capacity: {nearingCap.length}</li>
        <li>
          Top Instructors:{" "}
          {byClassCount.slice(0, 3).map((i) => i.username).join(", ")}
        </li>
        <li>Pending Registrations: {pending}</li>
        <li>Withdrawal Rate: {(withdrawal * 100).toFixed(1)}%</li>
        <li>Students &gt; 5 Completed: {manyCompleted}</li>
      </ul>
    </div>
  );
}
