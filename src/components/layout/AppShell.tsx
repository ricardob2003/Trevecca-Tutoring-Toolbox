 import { ReactNode } from "react";
 import { Sidebar } from "./Sidebar";
 import { Topbar } from "./Topbar";
 import { useAuth } from "@/context/AuthContext";
 import { Navigate } from "react-router-dom";
 
 interface AppShellProps {
   children: ReactNode;
 }
 
 export function AppShell({ children }: AppShellProps) {
   const { isAuthenticated } = useAuth();
 
   if (!isAuthenticated) {
     return <Navigate to="/login" replace />;
   }
 
   return (
     <div className="min-h-screen bg-background">
       <Sidebar />
       <div className="ml-64 transition-all duration-300">
         <Topbar />
         <main className="p-6">
           {children}
         </main>
       </div>
     </div>
   );
 }