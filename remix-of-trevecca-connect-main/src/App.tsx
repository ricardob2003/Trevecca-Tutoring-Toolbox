 import { Toaster } from "@/components/ui/toaster";
 import { Toaster as Sonner } from "@/components/ui/sonner";
 import { TooltipProvider } from "@/components/ui/tooltip";
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
 import { AuthProvider } from "@/context/AuthContext";
 import { AppShell } from "@/components/layout/AppShell";
 
 // Pages
 import Login from "./pages/Login";
 import NotFound from "./pages/NotFound";
 
 // Admin Pages
 import AdminDashboard from "./pages/admin/Dashboard";
 import AdminRequests from "./pages/admin/Requests";
 import AdminTutors from "./pages/admin/Tutors";
 import AdminClasses from "./pages/admin/Classes";
 import AdminStudents from "./pages/admin/Students";
 
 // Student Pages
 import StudentHome from "./pages/student/Home";
 import StudentRequest from "./pages/student/Request";
 import StudentClasses from "./pages/student/Classes";
 
 // Tutor Pages
 import TutorDashboard from "./pages/tutor/Dashboard";
 import TutorStudents from "./pages/tutor/Students";
 
 const queryClient = new QueryClient();
 
 const App = () => (
   <QueryClientProvider client={queryClient}>
     <TooltipProvider>
       <Toaster />
       <Sonner />
       <BrowserRouter>
         <AuthProvider>
           <Routes>
             {/* Public Routes */}
             <Route path="/" element={<Navigate to="/login" replace />} />
             <Route path="/login" element={<Login />} />
 
             {/* Admin Routes */}
             <Route path="/admin/dashboard" element={<AppShell><AdminDashboard /></AppShell>} />
             <Route path="/admin/requests" element={<AppShell><AdminRequests /></AppShell>} />
             <Route path="/admin/tutors" element={<AppShell><AdminTutors /></AppShell>} />
             <Route path="/admin/classes" element={<AppShell><AdminClasses /></AppShell>} />
             <Route path="/admin/students" element={<AppShell><AdminStudents /></AppShell>} />
 
             {/* Student Routes */}
             <Route path="/student/home" element={<AppShell><StudentHome /></AppShell>} />
             <Route path="/student/request" element={<AppShell><StudentRequest /></AppShell>} />
             <Route path="/student/classes" element={<AppShell><StudentClasses /></AppShell>} />
 
             {/* Tutor Routes */}
             <Route path="/tutor/dashboard" element={<AppShell><TutorDashboard /></AppShell>} />
             <Route path="/tutor/students" element={<AppShell><TutorStudents /></AppShell>} />
 
             {/* Catch-all */}
             <Route path="*" element={<NotFound />} />
           </Routes>
         </AuthProvider>
       </BrowserRouter>
     </TooltipProvider>
   </QueryClientProvider>
 );
 
 export default App;
