 import { useAuth } from "@/context/AuthContext";
 import { Bell, User } from "lucide-react";
 
 export function Topbar() {
   const { currentUser } = useAuth();
 
   if (!currentUser) return null;
 
   const roleLabel = currentUser.isAdmin
     ? "Administrator"
     : currentUser.isTutor
     ? "Student & Tutor"
     : "Student";
 
   return (
     <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
       <div>
         <h1 className="text-lg font-semibold text-foreground">
           Trevecca Tutoring Center
         </h1>
       </div>
 
       <div className="flex items-center gap-4">
         {/* Notifications - UI stub */}
         <button
           className="relative p-2 rounded-md hover:bg-muted transition-colors"
           aria-label="Notifications"
         >
           <Bell size={20} className="text-muted-foreground" />
           <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
         </button>
 
         {/* User Menu */}
         <div className="flex items-center gap-3">
           <div className="text-right hidden sm:block">
             <p className="text-sm font-medium text-foreground">
               {currentUser.user.first_name} {currentUser.user.last_name}
             </p>
             <p className="text-xs text-muted-foreground">{roleLabel}</p>
           </div>
           <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
             <User size={20} className="text-primary-foreground" />
           </div>
         </div>
       </div>
     </header>
   );
 }