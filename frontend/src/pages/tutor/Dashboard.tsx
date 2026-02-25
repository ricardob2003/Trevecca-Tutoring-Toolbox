import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar, Clock, Users, BookOpen, Inbox, Check, X } from "lucide-react";
import {
  getRequestsAPI,
  mapRequestItemToWithDetails,
  patchRequestTutorResponseAPI,
} from "@/lib/api";
import type { TutoringRequestWithDetails } from "@/types";
import {
  mockTutoringSessions,
  mockCourses,
  mockUsers,
  mockTutorMetrics,
} from "@/data/mockData";

type ViewMode = "day" | "week" | "month";

export default function TutorDashboard() {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [pendingAssignments, setPendingAssignments] = useState<TutoringRequestWithDetails[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const tutorId = currentUser?.user?.id ?? 0;

  const fetchPendingAssignments = useCallback(async () => {
    if (!tutorId) return;
    setPendingLoading(true);
    setPendingError(null);
    try {
      const { items } = await getRequestsAPI({
        status: "pending_tutor",
        requestedTutorId: tutorId,
      });
      setPendingAssignments(items.map(mapRequestItemToWithDetails));
    } catch (e) {
      setPendingError(e instanceof Error ? e.message : "Failed to load assignments");
      setPendingAssignments([]);
    } finally {
      setPendingLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    if (!currentUser?.isTutor || !tutorId) return;
    fetchPendingAssignments();
  }, [currentUser?.isTutor, tutorId, fetchPendingAssignments]);

  const handleAccept = async (requestId: number) => {
    setActionId(requestId);
    try {
      await patchRequestTutorResponseAPI(requestId, true);
      await fetchPendingAssignments();
    } catch {
      setPendingError("Failed to accept");
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (requestId: number) => {
    setActionId(requestId);
    try {
      await patchRequestTutorResponseAPI(requestId, false);
      await fetchPendingAssignments();
    } catch {
      setPendingError("Failed to decline");
    } finally {
      setActionId(null);
    }
  };

  if (!currentUser?.isTutor) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          icon={<Calendar size={40} />}
          title="Tutor Access Required"
          description="You need to be an active tutor to access this page."
        />
      </div>
    );
  }

  const mySessions = mockTutoringSessions.filter((s) => s.tutor_id === tutorId);
  const upcomingSessions = mySessions.filter((s) => s.status === "scheduled");
  const metrics = mockTutorMetrics.find((m) => m.tutor_id === tutorId);

  // Group sessions by date for the view
   const sessionsByDate = mySessions.reduce((acc, session) => {
     if (session.start_time) {
       const date = new Date(session.start_time).toLocaleDateString();
       if (!acc[date]) acc[date] = [];
       acc[date].push(session);
     }
     return acc;
   }, {} as Record<string, typeof mySessions>);
 
   return (
     <div className="animate-fade-in">
       <h1 className="page-header">Tutor Dashboard</h1>
 
       {/* Stats */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <StatCard
           title="Total Sessions"
           value={metrics?.total_sessions || mySessions.length}
           icon={<Calendar size={24} />}
         />
         <StatCard
           title="Total Hours"
           value={metrics?.total_hours || 0}
           icon={<Clock size={24} />}
         />
         <StatCard
           title="Utilization"
           value={`${metrics?.utilization || 0}%`}
           icon={<Users size={24} />}
         />
        <StatCard
          title="Upcoming"
          value={upcomingSessions.length}
          icon={<BookOpen size={24} />}
        />
      </div>

      {/* Pending Assignments (admin assigned you; accept or decline) */}
      <div className="mb-8">
        <h2 className="section-header mb-4 flex items-center gap-2">
          <Inbox size={22} />
          Pending Assignments
        </h2>
        {pendingError && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {pendingError}
          </div>
        )}
        <div className="card-base">
          {pendingLoading ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              Loading assignments...
            </p>
          ) : pendingAssignments.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              No pending assignments. When an admin assigns you to a request, it will appear here for you to accept or decline.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {pendingAssignments.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-wrap items-start justify-between gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {req.user.first_name} {req.user.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {req.course.code} – {req.course.title}
                    </p>
                    {req.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {req.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAccept(req.id)}
                      disabled={actionId === req.id}
                      className="btn-primary text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check size={16} />
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(req.id)}
                      disabled={actionId === req.id}
                      className="btn-secondary text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      <X size={16} />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-header mb-0">My Sessions</h2>
         <div className="flex items-center gap-2">
           <div className="flex rounded-md border border-border overflow-hidden">
             {(["day", "week", "month"] as ViewMode[]).map((mode) => (
               <button
                 key={mode}
                 onClick={() => setViewMode(mode)}
                 className={`
                   px-4 py-2 text-sm font-medium capitalize transition-colors
                   ${viewMode === mode
                     ? "bg-primary text-primary-foreground"
                     : "bg-card text-foreground hover:bg-muted"
                   }
                 `}
               >
                 {mode}
               </button>
             ))}
           </div>
         </div>
       </div>
 
       {/* Sessions List */}
       <div className="card-base">
         {mySessions.length === 0 ? (
           <EmptyState
             icon={<Calendar size={40} />}
             title="No sessions yet"
             description="Your tutoring sessions will appear here once scheduled."
           />
         ) : (
           <div className="divide-y divide-border">
             {Object.entries(sessionsByDate).map(([date, sessions]) => (
               <div key={date} className="p-4">
                 <p className="text-sm font-medium text-muted-foreground mb-3">
                   {date}
                 </p>
                 <div className="space-y-3">
                   {sessions.map((session) => {
                     const student = mockUsers.find((u) => u.id === session.user_id);
                     const course = mockCourses.find((c) => c.id === session.course_id);
                     const startTime = session.start_time
                       ? new Date(session.start_time).toLocaleTimeString([], {
                           hour: "2-digit",
                           minute: "2-digit",
                         })
                       : "TBD";
                     const endTime = session.end_time
                       ? new Date(session.end_time).toLocaleTimeString([], {
                           hour: "2-digit",
                           minute: "2-digit",
                         })
                       : "TBD";
 
                     return (
                       <div
                         key={session.id}
                         className="flex items-center gap-4 p-4 rounded-md border border-border hover:bg-muted/50 transition-colors"
                       >
                         <div className="flex-shrink-0 text-center">
                           <p className="text-sm font-medium text-foreground">
                             {startTime}
                           </p>
                           <p className="text-xs text-muted-foreground">
                             to {endTime}
                           </p>
                         </div>
 
                         <div className="flex-1 min-w-0">
                           <p className="font-medium text-foreground">
                             {student?.first_name} {student?.last_name}
                           </p>
                           <p className="text-sm text-muted-foreground">
                             {course?.code} - {course?.title}
                           </p>
                           {session.notes && (
                             <p className="text-sm text-muted-foreground mt-1 truncate">
                               {session.notes}
                             </p>
                           )}
                         </div>
 
                         <div className="flex items-center gap-3">
                           <StatusBadge status={session.status || "scheduled"} />
                           {session.attended !== null && (
                             <span
                               className={`text-xs ${
                                 session.attended ? "text-success" : "text-destructive"
                               }`}
                             >
                               {session.attended ? "Attended" : "No-show"}
                             </span>
                           )}
                         </div>
 
                         {/* TODO: Recording functionality */}
                         {session.status === "scheduled" && (
                           <button
                             onClick={() => {
                               // TODO: Implement recording - needs schema changes
                               alert("Recording functionality requires additional schema fields (e.g., recording_url)");
                             }}
                             className="btn-secondary text-sm"
                           >
                             Start Session
                           </button>
                         )}
                       </div>
                     );
                   })}
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>
     </div>
   );
 }