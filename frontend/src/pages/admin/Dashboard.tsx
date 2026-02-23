 import { Link } from "react-router-dom";
 import { StatCard } from "@/components/ui/StatCard";
 import { StatusBadge } from "@/components/ui/StatusBadge";
 import {
   Calendar,
   FileText,
   Users,
   BookOpen,
   Clock,
   TrendingUp,
 } from "lucide-react";
 import {
   mockSessionMetrics,
   mockTutoringRequests,
   mockTutors,
   mockCourses,
   mockUsers,
   getActiveTutors,
   getPendingRequests,
   getSessionsWithDetails,
 } from "@/data/mockData";
 
 export default function AdminDashboard() {
   const latestMetrics = mockSessionMetrics[0];
   const pendingRequests = getPendingRequests();
   const activeTutors = getActiveTutors();
   const upcomingSessions = getSessionsWithDetails().filter(
     (s) => s.status === "scheduled"
   );
 
   return (
     <div className="animate-fade-in">
       <h1 className="page-header">Admin Dashboard</h1>
 
       {/* Metrics Cards */}
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
           value={pendingRequests.length}
           icon={<FileText size={24} />}
           linkTo="/admin/requests"
         />
         <StatCard
           title="Active Tutors"
           value={activeTutors.length}
           icon={<Users size={24} />}
           subtitle={`${mockTutors.length} total`}
           linkTo="/admin/tutors"
         />
         <StatCard
           title="Total Courses"
           value={mockCourses.length}
           icon={<BookOpen size={24} />}
           linkTo="/admin/classes"
         />
       </div>
 
       {/* Two Column Layout */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Pending Requests */}
         <div className="card-base">
           <div className="p-4 border-b border-border flex items-center justify-between">
             <h2 className="font-semibold text-foreground">Pending Requests</h2>
             <Link
               to="/admin/requests"
               className="text-sm text-primary hover:underline"
             >
               View all
             </Link>
           </div>
           <div className="divide-y divide-border">
             {pendingRequests.length === 0 ? (
               <div className="p-6 text-center text-muted-foreground">
                 No pending requests
               </div>
             ) : (
               pendingRequests.slice(0, 5).map((request) => {
                 const student = mockUsers.find((u) => u.id === request.user_id);
                 const course = mockCourses.find((c) => c.id === request.course_id);
                 return (
                   <div key={request.id} className="p-4 hover:bg-muted/50 transition-colors">
                     <div className="flex items-start justify-between">
                       <div>
                         <p className="font-medium text-foreground">
                           {student?.first_name} {student?.last_name}
                         </p>
                         <p className="text-sm text-muted-foreground">
                           {course?.code} - {course?.title}
                         </p>
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
 
         {/* Active Tutors */}
         <div className="card-base">
           <div className="p-4 border-b border-border flex items-center justify-between">
             <h2 className="font-semibold text-foreground">Active Tutors</h2>
             <Link
               to="/admin/tutors"
               className="text-sm text-primary hover:underline"
             >
               View all
             </Link>
           </div>
           <div className="divide-y divide-border">
             {activeTutors.length === 0 ? (
               <div className="p-6 text-center text-muted-foreground">
                 No active tutors
               </div>
             ) : (
               activeTutors.slice(0, 5).map((tutor) => (
                 <div key={tutor!.user_id} className="p-4 hover:bg-muted/50 transition-colors">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                         <span className="text-sm font-medium text-primary">
                           {tutor!.user.first_name[0]}{tutor!.user.last_name[0]}
                         </span>
                       </div>
                       <div>
                         <p className="font-medium text-foreground">
                           {tutor!.user.first_name} {tutor!.user.last_name}
                         </p>
                         <p className="text-sm text-muted-foreground">
                           {tutor!.major}
                         </p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="text-sm text-muted-foreground">
                         {tutor!.hourly_limit}h limit
                       </p>
                       <StatusBadge status="active" />
                     </div>
                   </div>
                 </div>
               ))
             )}
           </div>
         </div>
 
         {/* Upcoming Sessions */}
         <div className="card-base">
           <div className="p-4 border-b border-border flex items-center justify-between">
             <h2 className="font-semibold text-foreground">Upcoming Sessions</h2>
           </div>
           <div className="divide-y divide-border">
             {upcomingSessions.length === 0 ? (
               <div className="p-6 text-center text-muted-foreground">
                 No upcoming sessions
               </div>
             ) : (
               upcomingSessions.slice(0, 5).map((session) => (
                 <div key={session.id} className="p-4 hover:bg-muted/50 transition-colors">
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-accent/10">
                       <Clock size={20} className="text-accent" />
                     </div>
                     <div className="flex-1">
                       <p className="font-medium text-foreground">
                         {session.student.first_name} {session.student.last_name} with{" "}
                         {session.tutor.user.first_name}
                       </p>
                       <p className="text-sm text-muted-foreground">
                         {session.course.code} •{" "}
                         {new Date(session.start_time!).toLocaleDateString()}
                       </p>
                     </div>
                     <StatusBadge status={session.status || "scheduled"} />
                   </div>
                 </div>
               ))
             )}
           </div>
         </div>
 
         {/* Quick Stats */}
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
               <span className="font-semibold text-foreground">
                 {mockTutoringRequests.length}
               </span>
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
                 )} min
               </span>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }
