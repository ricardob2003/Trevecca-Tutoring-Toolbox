 import { useState } from "react";
 import { useAuth } from "@/context/AuthContext";
 import { StatCard } from "@/components/ui/StatCard";
 import { StatusBadge } from "@/components/ui/StatusBadge";
 import { EmptyState } from "@/components/ui/EmptyState";
 import { Calendar, Clock, Users, BookOpen, ChevronLeft, ChevronRight, Inbox, Check, X } from "lucide-react";
import {
  mockTutoringSessions,
  mockCourses,
  mockUsers,
  mockTutorMetrics,
  mockSessionRequests,
  updateSessionRequestStatus,
} from "@/data/mockData";
 
 type ViewMode = "day" | "week" | "month";
 
export default function TutorDashboard() {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [sessionRequestsVersion, setSessionRequestsVersion] = useState(0);
 
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
 
   const tutorId = currentUser.user.id;
 
   // Get tutor's sessions
   const mySessions = mockTutoringSessions.filter((s) => s.tutor_id === tutorId);
   const completedSessions = mySessions.filter((s) => s.status === "completed");
   const upcomingSessions = mySessions.filter((s) => s.status === "scheduled");
 
  // Get tutor metrics
  const metrics = mockTutorMetrics.find((m) => m.tutor_id === tutorId);

  // Pending session requests (students requesting a meeting with this tutor)
  const pendingSessionRequests = mockSessionRequests.filter(
    (r) => r.tutor_id === tutorId && r.status === "pending"
  );

  const handleAcceptSessionRequest = (requestId: number) => {
    updateSessionRequestStatus(requestId, "accepted");
    setSessionRequestsVersion((v) => v + 1);
  };

  const handleDeclineSessionRequest = (requestId: number) => {
    updateSessionRequestStatus(requestId, "declined");
    setSessionRequestsVersion((v) => v + 1);
  };

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

      {/* Session Requests */}
      <div className="mb-8">
        <h2 className="section-header mb-4 flex items-center gap-2">
          <Inbox size={22} />
          Session Requests
        </h2>
        <div className="card-base">
          {pendingSessionRequests.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              No pending session requests. Students will appear here when they request a meeting from My Tutors.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {pendingSessionRequests.map((req) => {
                const student = mockUsers.find((u) => u.id === req.user_id);
                const course = mockCourses.find((c) => c.id === req.course_id);
                const start = new Date(req.requested_start_time);
                const end = new Date(req.requested_end_time);
                const dateStr = start.toLocaleDateString();
                const timeStr = `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                return (
                  <div
                    key={req.id}
                    className="flex flex-wrap items-start justify-between gap-4 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {student?.first_name} {student?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {course?.code} – {course?.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {dateStr} · {timeStr}
                      </p>
                      {req.notes && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          {req.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAcceptSessionRequest(req.id)}
                        className="btn-primary text-sm flex items-center gap-1"
                      >
                        <Check size={16} />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineSessionRequest(req.id)}
                        className="btn-secondary text-sm flex items-center gap-1"
                      >
                        <X size={16} />
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
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