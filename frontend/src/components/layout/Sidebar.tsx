import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Users,
  BookOpen,
  GraduationCap,
  Home,
  Search,
  Calendar,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  BarChart3,
} from "lucide-react";
import type { ReactNode } from "react";
import tnuLogo from "@/Images/TNU-Logo.jpg";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  if (!currentUser) return null;

  const { isAdmin, isTutor } = currentUser;

  const adminLinks: NavItem[] = [
    { label: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Requests", path: "/admin/requests", icon: <FileText size={20} /> },
    { label: "Tutors", path: "/admin/tutors", icon: <Users size={20} /> },
    { label: "Classes", path: "/admin/classes", icon: <BookOpen size={20} /> },
    { label: "Students", path: "/admin/students", icon: <GraduationCap size={20} /> },
    { label: "Analytics", path: "/admin/analytics", icon: <BarChart3 size={20} /> },
  ];

  const studentLinks: NavItem[] = [
    { label: "Home", path: "/student/home", icon: <Home size={20} /> },
    { label: "My Tutors", path: "/student/mytutors", icon: <Users size={20} /> },
    { label: "Request Tutor", path: "/student/request", icon: <FileText size={20} /> },
    { label: "Browse Classes", path: "/student/classes", icon: <Search size={20} /> },
  ];

  const tutorLinks: NavItem[] = [
    { label: "Tutor Dashboard", path: "/tutor/dashboard", icon: <Calendar size={20} /> },
    { label: "My Students", path: "/tutor/students", icon: <Users size={20} /> },
  ];

  const navLinks = isAdmin
    ? adminLinks
    : [...studentLinks, ...(isTutor ? tutorLinks : [])];
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseMobile}
        aria-hidden
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-dvh bg-sidebar transition-transform duration-200 lg:translate-x-0 ${
          collapsed ? "w-16" : "w-52"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border bg-[#532c6d] px-4">
          <div className="flex items-center gap-2">
            {collapsed ? (
              <img src={tnuLogo} alt="TNU Logo" className="h-9 w-9 rounded-sm object-contain" />
            ) : (
              <>
                <img src={tnuLogo} alt="TNU Logo" className="h-10 w-auto object-contain" />
                <span className="font-semibold text-white/90">Tutoring Toolbox</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onCloseMobile}
              className="rounded-md p-2 text-white/80 transition-colors hover:bg-white/10 lg:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <button
              onClick={onToggleCollapsed}
              className="hidden rounded-md p-2 text-white/80 transition-colors hover:bg-white/10 lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        </div>

        <nav className="hide-horizontal-scrollbar flex h-[calc(100dvh-8rem)] flex-col overflow-y-auto bg-[#532c6d] px-2 py-4">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive(link.path)
                      ? "bg-white text-[#532c6d]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  title={collapsed ? link.label : undefined}
                >
                  {link.icon}
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-4">
          {!collapsed && (
            <div className="mb-3">
              <p className="truncate text-sm font-medium text-white/90">
                {currentUser.user.first_name} {currentUser.user.last_name}
              </p>
              <p className="truncate text-xs text-white/70">{currentUser.user.email}</p>
            </div>
          )}

          <button
            onClick={() => {
              onCloseMobile();
              void logout();
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
