import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  FileText,
  Calendar,
  BookOpen,
  Plus,
  ArrowRight,
} from "lucide-react";
import { mockTutoringSessions, mockCourses, getTutorWithUser } from "@/data/mockData";
import { getRequestsAPI, mapRequestItemToWithDetails } from "@/lib/api";
import type { TutoringRequestWithDetails } from "@/types";
import treveccaLogo from "@/Images/TrevLogo.webp";

type CourseRequestStat = {
  courseId: number;
  code: string;
  title: string;
  totalRequests: number;
  pendingRequests: number;
};

export default function StudentHome() {
   const { currentUser } = useAuth();
 
   if (!currentUser) return null;
 
   const userId = currentUser.user.id;
   const isTutor = currentUser.isTutor;
 
  const [myRequests, setMyRequests] = useState<TutoringRequestWithDetails[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestsByCourse, setRequestsByCourse] = useState<CourseRequestStat[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setRequestsLoading(true);
      setRequestsError(null);
      try {
        const { items } = await getRequestsAPI({ userId });
        if (cancelled) return;
        const mapped = items.map(mapRequestItemToWithDetails);
        setMyRequests(mapped);

        const byCourseMap = mapped.reduce<Record<number, CourseRequestStat>>(
          (acc, req) => {
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
          },
          {}
        );

        setRequestsByCourse(
          Object.values(byCourseMap).sort(
            (a, b) => b.totalRequests - a.totalRequests
          )
        );
      } catch (e) {
        if (cancelled) return;
        setRequestsError(
          e instanceof Error ? e.message : "Failed to load your requests"
        );
      } finally {
        if (!cancelled) {
          setRequestsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const pendingRequests = myRequests.filter((r) => r.status === "pending");
 
   // Get student's sessions
   const mySessions = mockTutoringSessions.filter((s) => s.user_id === userId);
   const upcomingSessions = mySessions.filter((s) => s.status === "scheduled");
 
   return (
     <div className="animate-fade-in">
       {/* Welcome Header */}
       <div className="mb-8">
         <img
           src={treveccaLogo}
           alt="Trevecca logo"
           className="h-14 w-auto mb-4 rounded-md bg-white p-1.5 shadow-sm"
         />
         <h1 className="text-3xl font-bold text-foreground mb-2">
           Welcome back, {currentUser.user.first_name}!
         </h1>
         <p className="text-muted-foreground">
           {isTutor
             ? "Manage your tutoring sessions and help fellow students."
             : "Get help with your courses from peer tutors."}
         </p>
       </div>
 
       {/* Quick Actions */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
         <Link
           to="/student/request"
           className="card-interactive p-6 flex items-center gap-4"
         >
           <div className="p-3 rounded-lg bg-accent/10">
             <Plus size={24} className="text-accent" />
           </div>
           <div>
             <p className="font-semibold text-foreground">Request a Tutor</p>
             <p className="text-sm text-muted-foreground">Get help with a course</p>
           </div>
         </Link>
 
         <Link
           to="/student/classes"
           className="card-interactive p-6 flex items-center gap-4"
         >
           <div className="p-3 rounded-lg bg-primary/10">
             <BookOpen size={24} className="text-primary" />
           </div>
           <div>
             <p className="font-semibold text-foreground">Browse Classes</p>
             <p className="text-sm text-muted-foreground">Find available tutors</p>
           </div>
         </Link>
 
         {isTutor && (
           <Link
             to="/tutor/dashboard"
             className="card-interactive p-6 flex items-center gap-4 border-accent/30"
           >
             <div className="p-3 rounded-lg bg-accent/20">
               <Calendar size={24} className="text-accent" />
             </div>
             <div>
               <p className="font-semibold text-foreground">Tutor Dashboard</p>
               <p className="text-sm text-muted-foreground">View your sessions</p>
             </div>
           </Link>
         )}
       </div>
 
       {/* Stats */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <StatCard
           title="My Requests"
          value={requestsLoading ? "…" : myRequests.length}
           subtitle={`${pendingRequests.length} pending`}
           icon={<FileText size={24} />}
         />
         <StatCard
           title="Upcoming Sessions"
           value={upcomingSessions.length}
           icon={<Calendar size={24} />}
         />
         <StatCard
           title="Completed Sessions"
           value={mySessions.filter((s) => s.status === "completed").length}
           icon={<BookOpen size={24} />}
         />
       </div>
 
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Requests */}
        <div className="card-base">
           <div className="p-4 border-b border-border flex items-center justify-between">
             <h2 className="font-semibold text-foreground">My Requests</h2>
             <Link
               to="/student/request"
               className="text-sm text-primary hover:underline flex items-center gap-1"
             >
               New request <ArrowRight size={14} />
             </Link>
           </div>
           <div className="divide-y divide-border">
            {requestsLoading ? (
              <div className="p-6 text-center text-muted-foreground">
                Loading your requests...
              </div>
            ) : requestsError ? (
              <div className="p-6 text-center text-destructive text-sm">
                {requestsError}
              </div>
            ) : myRequests.length === 0 ? (
               <div className="p-6 text-center">
                 <p className="text-muted-foreground mb-4">
                   You haven't made any tutoring requests yet.
                 </p>
                 <Link to="/student/request" className="btn-primary">
                   Request a Tutor
                 </Link>
               </div>
             ) : (
               myRequests.slice(0, 5).map((request) => {
                const course = request.course;
                const tutor = request.requested_tutor ?? null;
                 return (
                   <div key={request.id} className="p-4 hover:bg-muted/50 transition-colors">
                     <div className="flex items-start justify-between">
                       <div>
                         <p className="font-medium text-foreground">
                          {course.code} - {course.title}
                         </p>
                         {tutor && (
                           <p className="text-sm text-muted-foreground">
                            Requested: {tutor.user.first_name} {tutor.user.last_name}
                           </p>
                         )}
                       </div>
                       <StatusBadge status={request.status || "pending"} />
                     </div>
                     <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                       {request.description}
                     </p>
                   </div>
                 );
               })
             )}
           </div>
         </div>
 
        {/* Upcoming Sessions */}
        <div className="card-base">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Upcoming Sessions</h2>
          </div>
          <div className="divide-y divide-border">
            {upcomingSessions.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">
                  No upcoming sessions scheduled.
                </p>
              </div>
            ) : (
              upcomingSessions.map((session) => {
                const course = mockCourses.find((c) => c.id === session.course_id);
                const tutor = getTutorWithUser(session.tutor_id);
                return (
                  <div key={session.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <Calendar size={20} className="text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {course?.code} with {tutor?.user.first_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.start_time
                            ? new Date(session.start_time).toLocaleString()
                            : "Time TBD"}
                        </p>
                      </div>
                      <StatusBadge status={session.status || "scheduled"} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Requests by Course */}
      <div className="mt-6 card-base">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">My Requests by Course</h2>
        </div>
        <div className="divide-y divide-border">
          {requestsLoading ? (
            <div className="p-6 text-center text-muted-foreground">
              Loading request stats...
            </div>
          ) : requestsError ? (
            <div className="p-6 text-center text-destructive text-sm">
              {requestsError}
            </div>
          ) : requestsByCourse.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              You have no requests yet.
            </div>
          ) : (
            requestsByCourse.map((c) => (
              <div
                key={c.courseId}
                className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {c.code} - {c.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pending: {c.pendingRequests}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold text-foreground">
                    {c.totalRequests}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
