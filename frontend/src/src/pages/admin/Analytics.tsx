import { useMemo, useState } from "react";
import { BarChart3, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Video } from "lucide-react";
import {
  mockCourses,
  mockSessionMetrics,
  mockTutoringRequests,
  mockTutoringSessions,
} from "@/data/mockData";

type SemesterTerm = "Spring" | "Fall";

interface SemesterOption {
  key: string;
  label: string;
  year: number;
  term: SemesterTerm;
}

interface TopCourseResult {
  courseCode: string;
  courseTitle: string;
  count: number;
}

function toValidDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getSemesterTerm(monthIndex: number): SemesterTerm {
  // Two-term model only: Jan-Jul = Spring, Aug-Dec = Fall
  return monthIndex >= 7 ? "Fall" : "Spring";
}

function buildSemesterOption(date: Date): SemesterOption {
  const year = date.getUTCFullYear();
  const term = getSemesterTerm(date.getUTCMonth());
  return {
    key: `${year}-${term.toLowerCase()}`,
    label: `${term} ${year}`,
    year,
    term,
  };
}

function sortSemestersDesc(a: SemesterOption, b: SemesterOption) {
  const aRank = a.year * 2 + (a.term === "Fall" ? 1 : 0);
  const bRank = b.year * 2 + (b.term === "Fall" ? 1 : 0);
  return bRank - aRank;
}

export default function AdminAnalytics() {
  const semesterOptions = useMemo(() => {
    const semesterMap = new Map<string, SemesterOption>();

    mockTutoringRequests.forEach((request) => {
      const date = toValidDate(request.created_at);
      if (!date) return;
      const option = buildSemesterOption(date);
      semesterMap.set(option.key, option);
    });

    mockTutoringSessions.forEach((session) => {
      const date = toValidDate(session.start_time);
      if (!date) return;
      const option = buildSemesterOption(date);
      semesterMap.set(option.key, option);
    });

    mockSessionMetrics.forEach((metric) => {
      const date = toValidDate(metric.date);
      if (!date) return;
      const option = buildSemesterOption(date);
      semesterMap.set(option.key, option);
    });

    const list = Array.from(semesterMap.values()).sort(sortSemestersDesc);

    if (list.length === 0) {
      const fallback = buildSemesterOption(new Date());
      return [fallback];
    }

    return list;
  }, []);

  const [semesterIndex, setSemesterIndex] = useState(0);
  const selectedSemester = semesterOptions[semesterIndex];

  const isInSelectedSemester = (value: string | null | undefined) => {
    const date = toValidDate(value);
    if (!date) return false;
    return buildSemesterOption(date).key === selectedSemester.key;
  };

  const semesterSessions = mockTutoringSessions.filter((session) =>
    isInSelectedSemester(session.start_time)
  );

  const semesterCompletedSessions = semesterSessions.filter(
    (session) => session.status === "completed"
  );

  const semesterRequestedTutorRequests = mockTutoringRequests.filter(
    (request) => request.requested_tutor_id !== null && isInSelectedSemester(request.created_at)
  );

  const semesterTotalSpent = mockSessionMetrics
    .filter((metric) => isInSelectedSemester(metric.date))
    .reduce((sum, metric) => sum + (metric.total_spent || 0), 0);

  const getTopCourse = (rows: Array<{ course_id: number }>): TopCourseResult | null => {
    if (rows.length === 0) return null;

    const counts = new Map<number, number>();
    rows.forEach((row) => {
      counts.set(row.course_id, (counts.get(row.course_id) || 0) + 1);
    });

    const ranked = Array.from(counts.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      const courseA = mockCourses.find((course) => course.id === a[0])?.code || "";
      const courseB = mockCourses.find((course) => course.id === b[0])?.code || "";
      return courseA.localeCompare(courseB);
    });

    const [topCourseId, count] = ranked[0];
    const course = mockCourses.find((c) => c.id === topCourseId);

    return {
      courseCode: course?.code || `Course #${topCourseId}`,
      courseTitle: course?.title || "Unknown course",
      count,
    };
  };

  const mostRequestedTutorClass = getTopCourse(semesterRequestedTutorRequests);
  const mostRecordedSessionClass = getTopCourse(semesterCompletedSessions);

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const canMoveBackward = semesterIndex < semesterOptions.length - 1;
  const canMoveForward = semesterIndex > 0;

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">Analytics</h1>

      <div className="card-base p-4 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <BarChart3 size={18} className="text-primary" />
          <span className="text-sm font-medium">Semester View</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSemesterIndex((prev) => prev + 1)}
            disabled={!canMoveBackward}
            className="btn-secondary px-3 py-1.5 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="min-w-32 text-center text-sm font-semibold text-foreground">
            {selectedSemester.label}
          </p>
          <button
            onClick={() => setSemesterIndex((prev) => prev - 1)}
            disabled={!canMoveForward}
            className="btn-secondary px-3 py-1.5 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <Video size={18} />
            <p className="text-sm font-medium">Total Sessions</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{semesterSessions.length}</p>
          <p className="text-xs text-muted-foreground mt-2">{selectedSemester.label}</p>
        </div>

        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <CircleDollarSign size={18} />
            <p className="text-sm font-medium">Total Spent</p>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {currencyFormatter.format(semesterTotalSpent)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">From session metrics</p>
        </div>

        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <ClipboardList size={18} />
            <p className="text-sm font-medium">Class With Most Requested Tutors</p>
          </div>
          {mostRequestedTutorClass ? (
            <>
              <p className="text-xl font-bold text-foreground">{mostRequestedTutorClass.courseCode}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {mostRequestedTutorClass.courseTitle}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {mostRequestedTutorClass.count} tutor-specific request
                {mostRequestedTutorClass.count === 1 ? "" : "s"}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No tutor-specific requests this semester.</p>
          )}
        </div>

        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <Video size={18} />
            <p className="text-sm font-medium">Class With Most Recorded Sessions</p>
          </div>
          {mostRecordedSessionClass ? (
            <>
              <p className="text-xl font-bold text-foreground">{mostRecordedSessionClass.courseCode}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {mostRecordedSessionClass.courseTitle}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {mostRecordedSessionClass.count} completed session
                {mostRecordedSessionClass.count === 1 ? "" : "s"}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No completed sessions this semester.</p>
          )}
        </div>
      </div>

      <div className="card-base p-6">
        <h2 className="section-header mb-3">Other Useful Analytics To Add</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground">
          <li>Request-to-session conversion rate by class and by tutor.</li>
          <li>Average wait time from request creation to first scheduled session.</li>
          <li>No-show rate by semester, class, and time-of-day.</li>
          <li>Top repeat students and session frequency trends.</li>
          <li>Peak demand hours to optimize tutor staffing.</li>
        </ul>
      </div>
    </div>
  );
}
