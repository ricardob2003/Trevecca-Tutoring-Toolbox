 import { useAuth } from "@/context/AuthContext";
 import { EmptyState } from "@/components/ui/EmptyState";
 import { StatusBadge } from "@/components/ui/StatusBadge";
 import { Users, BookOpen, Calendar } from "lucide-react";
 import {
   mockTutoringSessions,
   mockCourses,
   mockUsers,
 } from "@/data/mockData";
 
 export default function TutorStudents() {
   const { currentUser } = useAuth();
 
   if (!currentUser?.isTutor) {
     return (
       <div className="animate-fade-in">
         <EmptyState
           icon={<Users size={40} />}
           title="Tutor Access Required"
           description="You need to be an active tutor to access this page."
         />
       </div>
     );
   }
 
   const tutorId = currentUser.user.id;
 
   // Get unique students from tutor's sessions
   const mySessions = mockTutoringSessions.filter((s) => s.tutor_id === tutorId);
 
   // Group sessions by course, then by student
   const sessionsByCourse = mySessions.reduce((acc, session) => {
     const course = mockCourses.find((c) => c.id === session.course_id);
     if (course) {
       const key = course.code;
       if (!acc[key]) {
         acc[key] = { course, sessions: [] };
       }
       acc[key].sessions.push(session);
     }
     return acc;
   }, {} as Record<string, { course: typeof mockCourses[0]; sessions: typeof mySessions }>);
 
   // Get unique students per course
   const studentsByCourse = Object.entries(sessionsByCourse).map(([code, data]) => {
     const studentIds = [...new Set(data.sessions.map((s) => s.user_id))];
     const students = studentIds.map((id) => {
       const user = mockUsers.find((u) => u.id === id);
       const studentSessions = data.sessions.filter((s) => s.user_id === id);
       return {
         user,
         sessionCount: studentSessions.length,
         lastSession: studentSessions.sort(
           (a, b) =>
             new Date(b.start_time || 0).getTime() -
             new Date(a.start_time || 0).getTime()
         )[0],
       };
     });
     return { course: data.course, students };
   });
 
   return (
     <div className="animate-fade-in">
       <h1 className="page-header">My Students</h1>
 
       {studentsByCourse.length === 0 ? (
         <EmptyState
           icon={<Users size={40} />}
           title="No students yet"
           description="Students you've tutored will appear here, grouped by course."
         />
       ) : (
         <div className="space-y-6">
           {studentsByCourse.map(({ course, students }) => (
             <div key={course.code} className="card-base">
               <div className="p-4 border-b border-border bg-muted/30">
                 <div className="flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-primary/10">
                     <BookOpen size={20} className="text-primary" />
                   </div>
                   <div>
                     <h2 className="font-semibold text-foreground">{course.code}</h2>
                     <p className="text-sm text-muted-foreground">{course.title}</p>
                   </div>
                   <span className="ml-auto badge-primary">
                     {students.length} student{students.length !== 1 ? "s" : ""}
                   </span>
                 </div>
               </div>
 
               <div className="divide-y divide-border">
                 {students.map(({ user, sessionCount, lastSession }) => (
                   <div
                     key={user?.id}
                     className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                   >
                     <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                       <span className="text-sm font-medium text-primary">
                         {user?.first_name[0]}{user?.last_name[0]}
                       </span>
                     </div>
 
                     <div className="flex-1 min-w-0">
                       <p className="font-medium text-foreground">
                         {user?.first_name} {user?.last_name}
                       </p>
                       <p className="text-sm text-muted-foreground">
                         {user?.email}
                       </p>
                     </div>
 
                     <div className="text-right">
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         <Calendar size={14} />
                         <span>{sessionCount} session{sessionCount !== 1 ? "s" : ""}</span>
                       </div>
                       {lastSession && (
                         <p className="text-xs text-muted-foreground mt-1">
                           Last:{" "}
                           {lastSession.start_time
                             ? new Date(lastSession.start_time).toLocaleDateString()
                             : "N/A"}
                         </p>
                       )}
                     </div>
 
                     {lastSession && (
                       <StatusBadge status={lastSession.status || "completed"} />
                     )}
                   </div>
                 ))}
               </div>
             </div>
           ))}
         </div>
       )}
     </div>
   );
 }