import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { Bell, Menu, User } from "lucide-react";

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const { currentUser, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!currentUser) return null;

  const roleLabel = currentUser.isAdmin
    ? "Administrator"
    : currentUser.isTutor
      ? "Student & Tutor"
      : "Student";

  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    if (isLoggingOut) return;
    setIsLogoutModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setIsLogoutModalOpen(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={onOpenMobileMenu}
            className="rounded-md p-2 transition-colors hover:bg-muted lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-muted-foreground" />
          </button>
          <h1 className="truncate text-sm font-semibold text-foreground sm:text-lg">
            Trevecca Tutoring Center
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            className="relative hidden rounded-md p-2 transition-colors hover:bg-muted sm:inline-flex"
            aria-label="Notifications"
          >
            <Bell size={20} className="text-muted-foreground" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
          </button>

          <button
            onClick={openLogoutModal}
            className="flex items-center gap-2 rounded-md border border-transparent p-1 transition-colors hover:border-border hover:bg-muted/40 sm:gap-3"
            aria-label="Open account menu"
          >
            <div className="hidden rounded-md border border-border/60 bg-muted/40 px-3 py-1.5 text-right md:block">
              <p className="text-sm font-semibold text-foreground">
                {currentUser.user.first_name} {currentUser.user.last_name}
              </p>
              <p className="text-xs font-medium text-foreground/80">{roleLabel}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary sm:h-10 sm:w-10">
              <User size={18} className="text-primary-foreground sm:h-5 sm:w-5" />
            </div>
          </button>
        </div>
      </header>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={closeLogoutModal}
        title="Log Out"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to log out?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={closeLogoutModal}
              disabled={isLoggingOut}
              className="btn-secondary disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="btn-destructive disabled:opacity-60"
            >
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
