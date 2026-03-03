import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { Calendar } from "lucide-react";
import { getSessionsAPI, type AdminSessionItem } from "@/lib/api";

function formatDateTime(value: string | null): string {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function AdminSessions() {
  const [sessions, setSessions] = useState<AdminSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tutorIdInput, setTutorIdInput] = useState("");
  const [studentIdInput, setStudentIdInput] = useState("");
  const [selectedSession, setSelectedSession] = useState<AdminSessionItem | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const tutorId = tutorIdInput.trim() ? Number(tutorIdInput) : undefined;
      const userId = studentIdInput.trim() ? Number(studentIdInput) : undefined;

      const rows = await getSessionsAPI({
        ...(Number.isInteger(tutorId) ? { tutorId } : {}),
        ...(Number.isInteger(userId) ? { userId } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      });

      setSessions(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sessions.filter((session) => {
      const matchesStatus = statusFilter === "all" || session.status === statusFilter;

      const matchesSearch =
        query.length === 0 ||
        session.studentName.toLowerCase().includes(query) ||
        session.tutorName.toLowerCase().includes(query) ||
        session.studentEmail?.toLowerCase().includes(query) ||
        session.tutorEmail?.toLowerCase().includes(query) ||
        session.courseCode.toLowerCase().includes(query) ||
        session.courseTitle.toLowerCase().includes(query) ||
        session.notes?.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [sessions, searchQuery, statusFilter]);

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (s: AdminSessionItem) => (
        <div>
          <p className="font-medium text-foreground">{s.studentName}</p>
          <p className="text-xs text-muted-foreground">{s.studentEmail ?? "-"}</p>
        </div>
      ),
    },
    {
      key: "tutor",
      header: "Tutor",
      render: (s: AdminSessionItem) => (
        <div>
          <p className="font-medium text-foreground">{s.tutorName}</p>
          <p className="text-xs text-muted-foreground">{s.tutorEmail ?? "-"}</p>
        </div>
      ),
    },
    {
      key: "course",
      header: "Course",
      render: (s: AdminSessionItem) => (
        <p className="text-sm text-foreground">
          {s.courseCode ? `${s.courseCode} - ${s.courseTitle}` : "-"}
        </p>
      ),
    },
    {
      key: "start",
      header: "Start",
      render: (s: AdminSessionItem) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(s.startTime)}</span>
      ),
    },
    {
      key: "end",
      header: "End",
      render: (s: AdminSessionItem) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(s.endTime)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s: AdminSessionItem) => (
        <StatusBadge status={s.status || "scheduled"} />
      ),
    },
    {
      key: "attended",
      header: "Attended",
      render: (s: AdminSessionItem) => (
        <span className="text-sm text-foreground">
          {s.attended === null ? "-" : s.attended ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      render: (s: AdminSessionItem) => (
        <p className="text-sm text-muted-foreground max-w-[240px] truncate" title={s.notes ?? ""}>
          {s.notes || "-"}
        </p>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">Sessions</h1>

      {error && (
        <div className="mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="card-base p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tutor ID</label>
            <input
              type="number"
              placeholder="optional"
              value={tutorIdInput}
              onChange={(e) => setTutorIdInput(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Student ID</label>
            <input
              type="number"
              placeholder="optional"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search student, tutor, class, email, or notes..."
            className="flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full sm:w-44"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={() => void loadSessions()} className="btn-secondary">
            Apply Filters
          </button>
        </div>
      </div>

      <div className="card-base overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading sessions...</div>
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            icon={<Calendar size={40} />}
            title="No sessions found"
            description="No sessions match your current filters."
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={filteredSessions}
              keyField="id"
              onRowClick={(item) => setSelectedSession(item)}
            />
            <div className="px-4 pb-4 text-xs text-muted-foreground">
              Click a row to view full session details.
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={selectedSession != null}
        onClose={() => setSelectedSession(null)}
        title="Session Details"
        size="lg"
      >
        {selectedSession && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-md bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Student</p>
                <p className="font-medium text-foreground">{selectedSession.studentName}</p>
                <p className="text-xs text-muted-foreground">{selectedSession.studentEmail || "-"}</p>
              </div>
              <div className="p-3 rounded-md bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Tutor</p>
                <p className="font-medium text-foreground">{selectedSession.tutorName}</p>
                <p className="text-xs text-muted-foreground">{selectedSession.tutorEmail || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Course</p>
                <p className="text-foreground">
                  {selectedSession.courseCode
                    ? `${selectedSession.courseCode} - ${selectedSession.courseTitle}`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <StatusBadge status={selectedSession.status || "scheduled"} />
              </div>
              <div>
                <p className="text-muted-foreground">Start</p>
                <p className="text-foreground">{formatDateTime(selectedSession.startTime)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">End</p>
                <p className="text-foreground">{formatDateTime(selectedSession.endTime)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Attended</p>
                <p className="text-foreground">
                  {selectedSession.attended === null ? "-" : selectedSession.attended ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">IDs</p>
                <p className="text-foreground text-xs">
                  Session #{selectedSession.id}
                  {selectedSession.requestId != null ? `, Request #${selectedSession.requestId}` : ""}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <div className="rounded-md border border-border p-3 text-sm text-foreground whitespace-pre-wrap">
                {selectedSession.notes || "No notes"}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedSession(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
