import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, FileText, Users, BookOpen, GraduationCap, Home, Search, Calendar, LogOut, ChevronLeft, Menu } from "lucide-react";
import { useState } from "react";
import tnuLogo from "@/Images/TNU-Logo.jpg";
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
    label: "My Tutors",
    path: "/student/mytutors",
    icon: <Users size={20} />
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
         flex flex-col overflow-visible
         ${collapsed ? "w-16" : "w-52"}
       `}>
       {/* Header */}
       <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border bg-[#532c6d] border-none">
         <div className="flex items-center gap-2">
           {collapsed ? (
             <img src={tnuLogo} alt="TNU Logo" className="w-10 h-10 object-contain" />
           ) : (
             <>
               <img src={tnuLogo} alt="TNU Logo" className="h-10 w-auto object-contain" />
               <span className="font-semibold text-white/80">Tutoring Toolbox</span>
             </>
           )}
         </div>
         <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-md hover:bg-white/10 text-white/80 transition-colors" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
           {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
         </button>
       </div>

       {/* Navigation */}
       <nav className="flex-1 py-4 px-2 overflow-y-auto bg-[#532c6d] hide-horizontal-scrollbar">
         <ul className="space-y-1">
           {navLinks.map(link => <li key={link.path} className="relative">
               <Link to={link.path} className={`
                   flex items-center gap-3 px-3 py-2.5 rounded-l-md
                   transition-colors text-sm font-medium relative
                   ${isActive(link.path) 
                     ? "bg-white text-gray-900 -mr-4 pr-7 z-50" 
                     : "text-white/80 hover:bg-white/10 hover:text-white/80"}
                 `} title={collapsed ? link.label : undefined}>
                 {link.icon}
                 {!collapsed && <span>{link.label}</span>}
               </Link>
             </li>)}
         </ul>

         {/* Tutor Section Divider */}
         {!isAdmin && isTutor && !collapsed && <div className="mt-4 pt-4 border-t border-white/20">
             <p className="px-3 text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
               Tutor
             </p>
           </div>}
       </nav>

       {/* User Info & Logout */}
       <div className="p-4 border-t border-sidebar-border bg-[#532c6d] border-0">
         {!collapsed && <div className="mb-3">
             <p className="text-sm font-medium text-white/80 truncate">
               {currentUser.user.first_name} {currentUser.user.last_name}
             </p>
             <p className="text-xs text-white/70 truncate">
               {currentUser.user.email}
             </p>
           </div>}
         <button onClick={logout} className={`
             flex items-center gap-3 w-full px-3 py-2 rounded-md
             text-white/80 hover:bg-white/10 hover:text-white/80
             transition-colors text-sm font-medium
           `} title={collapsed ? "Logout" : undefined}>
           <LogOut size={20} />
           {!collapsed && <span>Logout</span>}
         </button>
       </div>
     </aside>;
}