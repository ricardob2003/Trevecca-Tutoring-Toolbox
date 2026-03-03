import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Calendar, FileText, Users, BookOpen, Clock, TrendingUp } from "lucide-react";
import {
  mockCourses,
  mockSessionMetrics,
  mockTutoringRequests,
} from "@/data/mockData";
import {
  getRequestsAPI,
  getSessionsAPI,
  getTutorsAPI,
  mapRequestItemToWithDetails,
  type AdminSessionItem,
  type TutorApiRecord,
} from "@/lib/api";
import type { TutoringRequestWithDetails } from "@/types";

type CourseRequestStat = {
  courseId: number;
  code: string;
  title: string;
  totalRequests: number;
  pendingRequests: number;
};

function formatSessionDate(value: string | null): string {
  if (!value) return "Date TBD";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function AdminDashboard() {
  const latestMetrics = mockSessionMetrics[0];

  const [pendingRequests, setPendingRequests] = useState<TutoringRequestWithDetails[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState<string | null>(null);

  const [requestsByCourse, setRequestsByCourse] = useState<CourseRequestStat[]>([]);
  const [requestsByCourseLoading, setRequestsByCourseLoading] = useState(true);
  const [requestsByCourseError, setRequestsByCourseError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<AdminSessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [activeTutors, setActiveTutors] = useState<TutorApiRecord[]>([]);
  const [activeTutorsLoading, setActiveTutorsLoading] = useState(true);
  const [activeTutorsError, setActiveTutorsError] = useState<string | null>(null);
  const [totalTutorsCount, setTotalTutorsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setPendingLoading(true);
      setRequestsByCourseLoading(true);
      setSessionsLoading(true);
      setActiveTutorsLoading(true);
      setPendingError(null);
      setRequestsByCourseError(null);
      setSessionsError(null);
      setActiveTutorsError(null);

      try {
        const [{ items }, sessionRows, tutorRows] = await Promise.all([
          getRequestsAPI(),
          getSessionsAPI(),
          getTutorsAPI(),
        ]);
        if (cancelled) return;

        const mapped = items.map(mapRequestItemToWithDetails);
        setPendingRequests(mapped.filter((r) => r.status === "pending"));

        const byCourseMap = mapped.reduce<Record<number, CourseRequestStat>>((acc, req) => {
          const course = req.course;
          const existing = acc[course.id];

          if (!existing) {
            acc[course.id] = {
              courseId: course.id,
              code: course.code,
              title: course.title,
              totalRequests: 1,
              pendingRequests: req.status === "pending" ? 1 : 0,
            };
            return acc;
          }

          existing.totalRequests += 1;
          if (req.status === "pending") existing.pendingRequests += 1;
          return acc;
        }, {});

        setRequestsByCourse(Object.values(byCourseMap).sort((a, b) => b.totalRequests - a.totalRequests));
        setSessions(sessionRows);
        setTotalTutorsCount(tutorRows.length);
        setActiveTutors(tutorRows.filter((t) => t.active));
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : "Failed to load dashboard data";
        setPendingError(message);
        setRequestsByCourseError(message);
        setSessionsError(message);
        setActiveTutorsError(message);
      } finally {
        if (!cancelled) {
          setPendingLoading(false);
          setRequestsByCourseLoading(false);
          setSessionsLoading(false);
          setActiveTutorsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const upcomingSessions = useMemo(() => {
    const now = Date.now();
    return sessions
      .filter((s) => s.status === "scheduled")
      .filter((s) => {
        if (!s.startTime) return false;
        const parsed = new Date(s.startTime).getTime();
        return Number.isFinite(parsed) && parsed >= now;
      })
      .sort((a, b) => {
        const left = a.startTime ? new Date(a.startTime).getTime() : Number.MAX_SAFE_INTEGER;
        const right = b.startTime ? new Date(b.startTime).getTime() : Number.MAX_SAFE_INTEGER;
        return left - right;
      });
  }, [sessions]);

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Sessions Today"
          value={latestMetrics?.total_sessions ?? 0}
          icon={<Calendar size={24} />}
          subtitle={`${latestMetrics?.avg_duration ?? 0} min avg`}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Pending Requests"
          value={pendingLoading ? "..." : pendingRequests.length}
          icon={<FileText size={24} />}
          linkTo="/admin/requests"
        />
        <StatCard
          title="Active Tutors"
          value={activeTutorsLoading ? "..." : activeTutors.length}
          icon={<Users size={24} />}
          subtitle={activeTutorsLoading ? "Loading..." : `${totalTutorsCount} total`}
          linkTo="/admin/tutors"
        />
        <StatCard
          title="Total Courses"
          value={mockCourses.length}
          icon={<BookOpen size={24} />}
          linkTo="/admin/classes"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-base">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Pending Requests</h2>
            <Link to="/admin/requests" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {pendingLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading pending requests...</div>
            ) : pendingError ? (
              <div className="p-6 text-center text-destructive text-sm">{pendingError}</div>
            ) : pendingRequests.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No pending requests</div>
            ) : (
              pendingRequests.slice(0, 5).map((request) => {
                const student = request.user;
                const course = request.course;
                return (
                  <div key={request.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {course.code} - {course.title}
                        </p>
                      </div>
                      <StatusBadge status={request.status || "pending"} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{request.description}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card-base">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Active Tutors</h2>
            <Link to="/admin/tutors" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {activeTutorsLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading tutors...</div>
            ) : activeTutorsError ? (
              <div className="p-6 text-center text-destructive text-sm">{activeTutorsError}</div>
            ) : activeTutors.length === 0 ? (
              <div className="p-6 flex items-center justify-center text-center text-muted-foreground">
                No active tutors
              </div>
            ) : (
              activeTutors.slice(0, 5).map((tutor) => (
                <div key={tutor.userId} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {tutor.user.firstName[0]}
                          {tutor.user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {tutor.user.firstName} {tutor.user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{tutor.user.major || "No major set"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{tutor.hourlyLimit}h limit</p>
                      <StatusBadge status="active" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-base">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Upcoming Sessions</h2>
            <Link to="/admin/sessions" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {sessionsLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading sessions...</div>
            ) : sessionsError ? (
              <div className="p-6 text-center text-destructive text-sm">{sessionsError}</div>
            ) : upcomingSessions.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No upcoming sessions</div>
            ) : (
              upcomingSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Clock size={20} className="text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {session.studentName} with {session.tutorName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.courseCode || "Course"} - {formatSessionDate(session.startTime)}
                      </p>
                    </div>
                    <StatusBadge status={session.status || "scheduled"} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-base">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Requests by Course</h2>
            <Link to="/admin/requests" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {requestsByCourseLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading request stats...</div>
            ) : requestsByCourseError ? (
              <div className="p-6 text-center text-destructive text-sm">{requestsByCourseError}</div>
            ) : requestsByCourse.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No requests yet</div>
            ) : (
              requestsByCourse.slice(0, 8).map((c) => (
                <div key={c.courseId} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {c.code} - {c.title}
                      </p>
                      <p className="text-sm text-muted-foreground">Pending: {c.pendingRequests}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold text-foreground">{c.totalRequests}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-base p-6">
          <h2 className="font-semibold text-foreground mb-4">Weekly Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp size={20} className="text-success" />
                <span className="text-sm text-foreground">Total Sessions</span>
              </div>
              <span className="font-semibold text-foreground">
                {mockSessionMetrics.reduce((sum, m) => sum + (m.total_sessions || 0), 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-primary" />
                <span className="text-sm text-foreground">Total Requests</span>
              </div>
              <span className="font-semibold text-foreground">{mockTutoringRequests.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/25">
                  <Clock size={16} className="text-primary" />
                </span>
                <span className="text-sm font-medium text-foreground">Avg Duration</span>
              </div>
              <span className="font-semibold text-foreground">
                {Math.round(
                  mockSessionMetrics.reduce((sum, m) => sum + (m.avg_duration || 0), 0) /
                    mockSessionMetrics.length
                )}{" "}
                min
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
