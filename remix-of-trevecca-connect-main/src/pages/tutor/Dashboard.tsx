 import { useState } from "react";
 import { useAuth } from "@/context/AuthContext";
 import { StatCard } from "@/components/ui/StatCard";
 import { StatusBadge } from "@/components/ui/StatusBadge";
 import { EmptyState } from "@/components/ui/EmptyState";
 import { Calendar, Clock, Users, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
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