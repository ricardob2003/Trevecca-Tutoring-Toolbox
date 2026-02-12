import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, FileText, Users, BookOpen, GraduationCap, Home, Search, Calendar, LogOut, ChevronLeft, Menu } from "lucide-react";
import { useState } from "react";
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}
export function Sidebar() {
  const {
    currentUser,
    logout
  } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  if (!currentUser) return null;
  const {
    isAdmin,
    isTutor
  } = currentUser;
  const adminLinks: NavItem[] = [{
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: <LayoutDashboard size={20} />
  }, {
    label: "Requests",
    path: "/admin/requests",
    icon: <FileText size={20} />
  }, {
    label: "Tutors",
    path: "/admin/tutors",
    icon: <Users size={20} />
  }, {
    label: "Classes",
    path: "/admin/classes",
    icon: <BookOpen size={20} />
  }, {
    label: "Students",
    path: "/admin/students",
    icon: <GraduationCap size={20} />
  }];
  const studentLinks: NavItem[] = [{
    label: "Home",
    path: "/student/home",
    icon: <Home size={20} />
  }, {
    label: "Request Tutor",
    path: "/student/request",
    icon: <FileText size={20} />
  }, {
    label: "Browse Classes",
    path: "/student/classes",
    icon: <Search size={20} />
  }];
  const tutorLinks: NavItem[] = [{
    label: "Tutor Dashboard",
    path: "/tutor/dashboard",
    icon: <Calendar size={20} />
  }, {
    label: "My Students",
    path: "/tutor/students",
    icon: <Users size={20} />
  }];
  const getNavLinks = (): NavItem[] => {
    if (isAdmin) return adminLinks;
    const links = [...studentLinks];
    if (isTutor) {
      links.push(...tutorLinks);
    }
    return links;
  };
  const navLinks = getNavLinks();
  const isActive = (path: string) => location.pathname === path;
  return <aside className={`
         fixed left-0 top-0 h-full bg-sidebar z-40
         flex flex-col transition-all duration-300
         ${collapsed ? "w-16" : "w-64"}
       `}>
       {/* Header */}
       <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border bg-[#532c6d] border-none">
         {!collapsed && <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-sidebar-primary rounded-md flex items-center justify-center">
               <span className="text-sidebar-primary-foreground font-bold text-sm">T</span>
             </div>
             <span className="font-semibold text-sidebar-foreground">TNU Tutoring</span>
           </div>}
         <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
           {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
         </button>
       </div>
 
       {/* Navigation */}
       <nav className="flex-1 py-4 px-2 overflow-y-auto bg-[#532c6d]">
         <ul className="space-y-1">
           {navLinks.map(link => <li key={link.path}>
               <Link to={link.path} className={`
                   flex items-center gap-3 px-3 py-2.5 rounded-md
                   transition-colors text-sm font-medium
                   ${isActive(link.path) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}
                 `} title={collapsed ? link.label : undefined}>
                 {link.icon}
                 {!collapsed && <span>{link.label}</span>}
               </Link>
             </li>)}
         </ul>
 
         {/* Tutor Section Divider */}
         {!isAdmin && isTutor && !collapsed && <div className="mt-4 pt-4 border-t border-sidebar-border">
             <p className="px-3 text-xs font-semibold text-sidebar-muted uppercase tracking-wider mb-2">
               Tutor
             </p>
           </div>}
       </nav>
 
       {/* User Info & Logout */}
       <div className="p-4 border-t border-sidebar-border bg-[#532c6d] border-0">
         {!collapsed && <div className="mb-3">
             <p className="text-sm font-medium text-sidebar-foreground truncate">
               {currentUser.user.first_name} {currentUser.user.last_name}
             </p>
             <p className="text-xs text-sidebar-muted truncate">
               {currentUser.user.email}
             </p>
           </div>}
         <button onClick={logout} className={`
             flex items-center gap-3 w-full px-3 py-2 rounded-md
             text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
             transition-colors text-sm font-medium
           `} title={collapsed ? "Logout" : undefined}>
           <LogOut size={20} />
           {!collapsed && <span>Logout</span>}
         </button>
       </div>
     </aside>;
}