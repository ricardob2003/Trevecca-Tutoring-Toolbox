import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar, Clock, BookOpen, Inbox, Check, X } from "lucide-react";
import {
  getRequestsAPI,
  mapRequestItemToWithDetails,
  patchRequestTutorResponseAPI,
  getTutorSessionsAPI,
  createSessionAPI,
  completeSessionAPI,
  SessionItem,
} from "@/lib/api";
import type { TutoringRequestWithDetails } from "@/types";
type ViewMode = "day" | "week" | "month";

function getDateRangeForView(mode: ViewMode): { from: string; to: string } {
  const now = new Date();

  if (mode === "day") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }

  if (mode === "week") {
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    end.setHours(23, 59, 59, 999);

    return { from: start.toISOString(), to: end.toISOString() };
  }

  // month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

export default function TutorDashboard() {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [pendingAssignments, setPendingAssignments] = useState<TutoringRequestWithDetails[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [approvedRequests, setApprovedRequests] = useState<TutoringRequestWithDetails[]>([]);
  const [approvedLoading, setApprovedLoading] = useState(true);
  const [approvedError, setApprovedError] = useState<string | null>(null);
  const [scheduleRequest, setScheduleRequest] = useState<TutoringRequestWithDetails | null>(null);
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [completeSessionId, setCompleteSessionId] = useState<number | null>(null);
  const [completeAttended, setCompleteAttended] = useState(true);
  const [completeNotes, setCompleteNotes] = useState("");
  const [completeSubmitting, setCompleteSubmitting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const tutorId = currentUser?.user?.id ?? 0;
  const tutorProfile = (currentUser?.user as any)?.tutor as
    | { hourlyLimit: number | null }
    | undefined;
  const hourlyLimit = tutorProfile?.hourlyLimit ?? null;

  const fetchPendingAssignments = useCallback(async () => {
    if (!tutorId) return;
    setPendingLoading(true);
    setPendingError(null);
    try {
      const { items } = await getRequestsAPI({
        status: "pending_tutor",
        requestedTutorId: tutorId,
      });
      setPendingAssignments(items.map(mapRequestItemToWithDetails));
    } catch (e) {
      setPendingError(e instanceof Error ? e.message : "Failed to load assignments");
      setPendingAssignments([]);
    } finally {
      setPendingLoading(false);
    }
  }, [tutorId]);

  const fetchSessions = useCallback(async () => {
    if (!tutorId) return;
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const { from, to } = getDateRangeForView(viewMode);
      const data = await getTutorSessionsAPI(tutorId, { from, to });
      setSessions(data);
    } catch (e) {
      setSessionsError(e instanceof Error ? e.message : "Failed to load sessions");
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, [tutorId, viewMode]);

  const fetchApprovedRequests = useCallback(async () => {
    if (!tutorId) return;
    setApprovedLoading(true);
    setApprovedError(null);
    try {
      const { items } = await getRequestsAPI({
        status: "approved",
        requestedTutorId: tutorId,
      });
      setApprovedRequests(items.map(mapRequestItemToWithDetails));
    } catch (e) {
      setApprovedError(e instanceof Error ? e.message : "Failed to load approved requests");
      setApprovedRequests([]);
    } finally {
      setApprovedLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    if (!currentUser?.isTutor || !tutorId) return;
    fetchPendingAssignments();
    fetchSessions();
    fetchApprovedRequests();
  }, [currentUser?.isTutor, tutorId, fetchPendingAssignments, fetchSessions, fetchApprovedRequests]);

  const handleAccept = async (requestId: number) => {
    setActionId(requestId);
    try {
      await patchRequestTutorResponseAPI(requestId, true);
      await fetchPendingAssignments();
      await fetchApprovedRequests();
    } catch {
      setPendingError("Failed to accept");
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (requestId: number) => {
    setActionId(requestId);
    try {
      await patchRequestTutorResponseAPI(requestId, false);
      await fetchPendingAssignments();
    } catch {
      setPendingError("Failed to decline");
    } finally {
      setActionId(null);
    }
  };

  const openScheduleForRequest = (request: TutoringRequestWithDetails) => {
    setScheduleRequest(request);
    setScheduleStart("");
    setScheduleEnd("");
    setScheduleError(null);
  };

  const closeScheduleModal = () => {
    setScheduleRequest(null);
    setScheduleStart("");
    setScheduleEnd("");
    setScheduleError(null);
  };

  const handleScheduleSubmit = async () => {
    if (!scheduleRequest) return;

    if (!scheduleStart || !scheduleEnd) {
      setScheduleError("Please select both start and end time.");
      return;
    }

    const start = new Date(scheduleStart);
    const end = new Date(scheduleEnd);

    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      setScheduleError("Invalid date/time selected.");
      return;
    }

    if (end <= start) {
      setScheduleError("End time must be after start time.");
      return;
    }

    setScheduleSubmitting(true);
    setScheduleError(null);
    try {
      await createSessionAPI({
        requestId: scheduleRequest.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      closeScheduleModal();
      await Promise.all([fetchSessions(), fetchApprovedRequests()]);
    } catch (e) {
      setScheduleError(e instanceof Error ? e.message : "Failed to create session");
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const openCompleteForSession = (session: SessionItem) => {
    setCompleteSessionId(session.id);
    setCompleteAttended(true);
    setCompleteNotes(session.notes ?? "");
    setCompleteError(null);
  };

  const cancelComplete = () => {
    setCompleteSessionId(null);
    setCompleteNotes("");
    setCompleteError(null);
  };

  const handleCompleteSubmit = async () => {
    if (!completeSessionId) return;
    setCompleteSubmitting(true);
    setCompleteError(null);
    try {
      await completeSessionAPI(completeSessionId, {
        attended: completeAttended,
        notes: completeNotes.trim() || undefined,
      });
      setCompleteSessionId(null);
      setCompleteNotes("");
      await fetchSessions();
    } catch (e) {
      setCompleteError(e instanceof Error ? e.message : "Failed to complete session");
    } finally {
      setCompleteSubmitting(false);
    }
  };

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

  const mySessions = sessions;
  const upcomingSessions = mySessions.filter((s) => s.status === "scheduled");
  const completedSessions = mySessions.filter((s) => s.status === "completed");

  const hoursUsed = mySessions.reduce((sum, session) => {
    if (!session.startTime || !session.endTime) return sum;
    if (session.status !== "scheduled" && session.status !== "completed") return sum;
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (!Number.isFinite(diffHours) || diffHours <= 0) return sum;
    return sum + diffHours;
  }, 0);

  const hoursUsedRounded = Math.round(hoursUsed * 10) / 10;
  const showHourlyWarning =
    hourlyLimit != null && hoursUsed >= 0.8 * hourlyLimit;

  const sessionsByDate = mySessions.reduce((acc, session) => {
    if (session.startTime) {
      const date = new Date(session.startTime).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(session);
    }
    return acc;
  }, {} as Record<string, SessionItem[]>);

  return (
     <div className="animate-fade-in">
       <h1 className="page-header">Tutor Dashboard</h1>
 
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
        <StatCard
          title="Total Sessions"
          value={sessionsLoading ? "…" : mySessions.length}
          icon={<Calendar size={24} />}
        />
        <StatCard
          title="Completed Sessions"
          value={sessionsLoading ? "…" : completedSessions.length}
          icon={<BookOpen size={24} />}
        />
        <StatCard
          title="Hours Used"
          value={sessionsLoading ? "…" : hoursUsedRounded.toFixed(1)}
          icon={<Clock size={24} />}
        />
        <StatCard
          title="Upcoming Sessions"
          value={sessionsLoading ? "…" : upcomingSessions.length}
          icon={<Calendar size={24} />}
        />
      </div>
      {hourlyLimit != null && !sessionsLoading && (
        <p
          className={`text-sm mb-8 ${
            showHourlyWarning ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {showHourlyWarning
            ? `You have used ${hoursUsedRounded.toFixed(1)} of ${hourlyLimit} hours this week.`
            : `Weekly hourly limit: ${hourlyLimit} hours.`}
        </p>
      )}

      {/* Pending Assignments (admin assigned you; accept or decline) */}
      <div className="mb-8">
        <h2 className="section-header mb-4 flex items-center gap-2">
          <Inbox size={22} />
          Pending Assignments
        </h2>
        {pendingError && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {pendingError}
          </div>
        )}
        <div className="card-base">
          {pendingLoading ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              Loading assignments...
            </p>
          ) : pendingAssignments.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              No pending assignments. When an admin assigns you to a request, it will appear here for you to accept or decline.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {pendingAssignments.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-wrap items-start justify-between gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {req.user.first_name} {req.user.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {req.course.code} – {req.course.title}
                    </p>
                    {req.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {req.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAccept(req.id)}
                      disabled={actionId === req.id}
                      className="btn-primary text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check size={16} />
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(req.id)}
                      disabled={actionId === req.id}
                      className="btn-secondary text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      <X size={16} />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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

      {/* Approved Requests (schedule sessions) */}
      <div className="mb-8">
        <h2 className="section-header mb-4 flex items-center gap-2">
          <Calendar size={22} />
          Approved Requests
        </h2>
        {approvedError && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {approvedError}
          </div>
        )}
        <div className="card-base">
          {approvedLoading ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              Loading approved requests...
            </p>
          ) : approvedRequests.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              No approved requests yet. Once an admin approves a request for you, you can schedule sessions here.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {approvedRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-wrap items-start justify-between gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {req.user.first_name} {req.user.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {req.course.code} – {req.course.title}
                    </p>
                    {req.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {req.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openScheduleForRequest(req)}
                      className="btn-primary text-sm"
                    >
                      Schedule Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="card-base">
        {sessionsLoading ? (
          <p className="p-6 text-sm text-muted-foreground text-center">
            Loading sessions...
          </p>
        ) : sessionsError ? (
          <div className="p-6 text-center text-destructive text-sm">
            {sessionsError}
          </div>
        ) : mySessions.length === 0 ? (
          <EmptyState
            icon={<Calendar size={40} />}
            title="No sessions yet"
            description="Your tutoring sessions will appear here once scheduled."
          />
        ) : (
          <div className="divide-y divide-border">
            {Object.entries(sessionsByDate).map(([date, groupedSessions]) => (
              <div key={date} className="p-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  {date}
                </p>
                <div className="space-y-3">
                  {groupedSessions.map((session) => {
                    const startTimeLabel = session.startTime
                      ? new Date(session.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "TBD";
                    const endTimeLabel = session.endTime
                      ? new Date(session.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "TBD";

                    return (
                      <div
                        key={session.id}
                        className="p-4 rounded-md border border-border hover:bg-muted/50 transition-colors space-y-3"
                      >
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex-shrink-0 text-center">
                            <p className="text-sm font-medium text-foreground">
                              {startTimeLabel}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              to {endTimeLabel}
                            </p>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">
                              {session.studentName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {session.courseCode}
                            </p>
                            {session.notes && (
                              <p className="text-sm text-muted-foreground mt-1 truncate">
                                {session.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 ml-auto">
                            <StatusBadge status={session.status || "scheduled"} />
                            {session.attended !== null && (
                              <span
                                className={`text-xs ${
                                  session.attended
                                    ? "text-success"
                                    : "text-destructive"
                                }`}
                              >
                                {session.attended ? "Attended" : "No-show"}
                              </span>
                            )}
                          </div>

                          {session.status === "scheduled" && (
                            <button
                              type="button"
                              onClick={() => openCompleteForSession(session)}
                              className="btn-secondary text-sm"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>

                        {completeSessionId === session.id && (
                          <div className="pt-3 border-t border-border space-y-3">
                            {completeError && (
                              <div className="p-2 rounded-md bg-destructive/10 text-destructive text-sm">
                                {completeError}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-4">
                              <label className="text-sm text-foreground flex items-center gap-2">
                                Attended?
                                <select
                                  className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                                  value={completeAttended ? "yes" : "no"}
                                  onChange={(e) =>
                                    setCompleteAttended(e.target.value === "yes")
                                  }
                                >
                                  <option value="yes">Yes</option>
                                  <option value="no">No (no-show)</option>
                                </select>
                              </label>
                            </div>
                            <div>
                              <label className="block text-sm text-foreground mb-1">
                                Notes (optional)
                              </label>
                              <textarea
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                rows={3}
                                value={completeNotes}
                                onChange={(e) => setCompleteNotes(e.target.value)}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={cancelComplete}
                                className="btn-secondary text-sm"
                                disabled={completeSubmitting}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleCompleteSubmit}
                                className="btn-primary text-sm"
                                disabled={completeSubmitting}
                              >
                                {completeSubmitting ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </div>
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

      {scheduleRequest && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="card-base max-w-md w-full mx-4">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-lg">
                Schedule Session
              </h3>
              <button
                type="button"
                onClick={closeScheduleModal}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                {scheduleRequest.user.first_name} {scheduleRequest.user.last_name} –{" "}
                {scheduleRequest.course.code} {scheduleRequest.course.title}
              </p>
              {scheduleError && (
                <div className="p-2 rounded-md bg-destructive/10 text-destructive text-sm">
                  {scheduleError}
                </div>
              )}
              <div className="space-y-3">
                <label className="block text-sm text-foreground">
                  Start time
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={scheduleStart}
                    onChange={(e) => setScheduleStart(e.target.value)}
                  />
                </label>
                <label className="block text-sm text-foreground">
                  End time
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={scheduleEnd}
                    onChange={(e) => setScheduleEnd(e.target.value)}
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeScheduleModal}
                  className="btn-secondary text-sm"
                  disabled={scheduleSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleScheduleSubmit}
                  className="btn-primary text-sm"
                  disabled={scheduleSubmitting}
                >
                  {scheduleSubmitting ? "Scheduling..." : "Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}