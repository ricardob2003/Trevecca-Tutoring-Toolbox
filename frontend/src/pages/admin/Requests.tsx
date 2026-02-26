import { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Check, X, UserPlus, RotateCcw } from "lucide-react";
import {
  getRequestsAPI,
  patchRequestAPI,
  getAssignableTutorsAPI,
  mapRequestItemToWithDetails,
} from "@/lib/api";
import type { TutoringRequestWithDetails, TutorWithUser } from "@/types";
import type { TutorApiRecord } from "@/lib/api";

export default function AdminRequests() {
  const [requests, setRequests] = useState<TutoringRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<TutoringRequestWithDetails | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignableTutors, setAssignableTutors] = useState<TutorApiRecord[]>([]);
  const [assignModalLoading, setAssignModalLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [declineModalRequest, setDeclineModalRequest] = useState<TutoringRequestWithDetails | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declineNotifyEmail, setDeclineNotifyEmail] = useState(false);
  const [declineNotifyInApp, setDeclineNotifyInApp] = useState(false);
  const [declineReasonError, setDeclineReasonError] = useState<string | null>(null);
  const [declineSubmitting, setDeclineSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
      const { items } = await getRequestsAPI(params);
      setRequests(items.map(mapRequestItemToWithDetails));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.course.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleApprove = async (request: TutoringRequestWithDetails) => {
    setActionLoadingId(request.id);
    try {
      await patchRequestAPI(request.id, { status: "approved" });
      await fetchRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openDeclineModal = (request: TutoringRequestWithDetails) => {
    setDeclineModalRequest(request);
    setDeclineReason("");
    setDeclineNotifyEmail(false);
    setDeclineNotifyInApp(false);
    setDeclineReasonError(null);
  };

  const closeDeclineModal = () => {
    setDeclineModalRequest(null);
    setDeclineReason("");
    setDeclineReasonError(null);
  };

  const handleDeclineSubmit = async () => {
    if (!declineModalRequest) return;
    const trimmed = declineReason.trim();
    if (!trimmed) {
      setDeclineReasonError("Reason is required.");
      return;
    }
    setDeclineReasonError(null);
    setDeclineSubmitting(true);
    try {
      await patchRequestAPI(declineModalRequest.id, {
        status: "denied",
        declineReason: trimmed,
      });
      await fetchRequests();
      closeDeclineModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to decline request");
    } finally {
      setDeclineSubmitting(false);
    }
  };

  const handleReopen = async (request: TutoringRequestWithDetails) => {
    setActionLoadingId(request.id);
    try {
      await patchRequestAPI(request.id, { status: "pending" });
      await fetchRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to re-open");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAssignTutor = async (tutor: TutorWithUser) => {
    if (!selectedRequest) return;
    setAssignModalLoading(true);
    try {
      await patchRequestAPI(selectedRequest.id, {
        requestedTutorId: tutor.user_id,
        status: "pending_tutor",
      });
      await fetchRequests();
      setIsAssignModalOpen(false);
      setSelectedRequest(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign tutor");
    } finally {
      setAssignModalLoading(false);
    }
  };

  const openAssignModal = (request: TutoringRequestWithDetails) => {
    setSelectedRequest(request);
    setIsAssignModalOpen(true);
    setAssignModalLoading(true);
    setError(null);
    getAssignableTutorsAPI()
      .then(setAssignableTutors)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load tutors"))
      .finally(() => setAssignModalLoading(false));
  };

  const tutorsForCourse = selectedRequest
    ? assignableTutors.filter((t) => {
        const subjects = t.subjects ?? [];
        const code = selectedRequest.course.code;
        const dept = selectedRequest.course.department;
        return subjects.includes(code) || (dept != null && subjects.includes(dept));
      })
    : [];

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (r: TutoringRequestWithDetails) => (
        <div>
          <p className="font-medium text-foreground">
            {r.user.first_name} {r.user.last_name}
          </p>
          <p className="text-xs text-muted-foreground">{r.user.email}</p>
        </div>
      ),
    },
    {
      key: "course",
      header: "Course",
      render: (r: TutoringRequestWithDetails) => (
        <div>
          <p className="font-medium text-foreground">{r.course.code}</p>
          <p className="text-xs text-muted-foreground">{r.course.title}</p>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (r: TutoringRequestWithDetails) => (
        <p className="text-sm text-muted-foreground max-w-xs truncate">
          {r.description || "No description"}
        </p>
      ),
    },
    {
      key: "tutor",
      header: "Assigned Tutor",
      render: (r: TutoringRequestWithDetails) =>
        r.requested_tutor ? (
          <span className="text-sm text-foreground">
            {r.requested_tutor.user.first_name} {r.requested_tutor.user.last_name}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground italic">Unassigned</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: TutoringRequestWithDetails) => (
        <div className="space-y-1">
          <StatusBadge status={r.status || "pending"} />
          {r.status === "denied" && r.decline_reason && (
            <p className="text-xs text-muted-foreground max-w-[200px]" title={r.decline_reason}>
              {r.decline_reason}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (r: TutoringRequestWithDetails) => (
        <span className="text-sm text-muted-foreground">
          {new Date(r.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r: TutoringRequestWithDetails) => {
        const canApprove = r.status === "pending";
        const canDeny = r.status === "pending" || r.status === "pending_tutor";
        const canReopen = r.status === "denied";
        return (
          <div className="flex items-center gap-2">
            {canReopen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReopen(r);
                }}
                disabled={actionLoadingId === r.id}
                className="p-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors disabled:opacity-50"
                title="Re-open"
              >
                <RotateCcw size={16} />
              </button>
            )}
            {canApprove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(r);
                }}
                disabled={actionLoadingId === r.id}
                className="p-1.5 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50"
                title="Approve"
              >
                <Check size={16} />
              </button>
            )}
            {canDeny && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDeclineModal(r);
                }}
                disabled={actionLoadingId === r.id}
                className="p-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                title="Decline"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openAssignModal(r);
              }}
              className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title="Assign Tutor"
            >
              <UserPlus size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">Tutoring Requests</h1>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="card-base p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by student or course..."
            className="flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full sm:w-40"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="pending_tutor">Awaiting Tutor</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
        </div>
      </div>

      <div className="card-base overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={<FileText size={40} />}
            title="No requests found"
            description="There are no tutoring requests matching your filters."
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredRequests}
            keyField="id"
          />
        )}
      </div>

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedRequest(null);
        }}
        title="Assign Tutor"
        size="md"
      >
        <div className="space-y-4">
          {selectedRequest && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Assigning tutor for:</p>
              <p className="font-medium text-foreground">
                {selectedRequest.course.code} - {selectedRequest.course.title}
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">Available tutors for this course:</p>

          {assignModalLoading ? (
            <p className="text-center py-4 text-muted-foreground">Loading tutors...</p>
          ) : tutorsForCourse.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              No tutors available for this course
            </p>
          ) : (
            <div className="space-y-2">
              {tutorsForCourse.map((tutor) => (
                <button
                  key={tutor.userId}
                  onClick={() =>
                    handleAssignTutor({
                      user_id: tutor.userId,
                      major: tutor.user.major ?? null,
                      subjects: Array.isArray(tutor.subjects) ? tutor.subjects.join(",") : null,
                      hourly_limit: tutor.hourlyLimit,
                      active: tutor.active,
                      user: {
                        id: tutor.user.treveccaId,
                        trevecca_id: String(tutor.user.treveccaId),
                        email: tutor.user.email,
                        first_name: tutor.user.firstName,
                        last_name: tutor.user.lastName,
                        year: null,
                        created_at: "",
                        temporary_password: null,
                        role: tutor.user.role,
                      },
                    })
                  }
                  disabled={assignModalLoading}
                  className="w-full p-3 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <p className="font-medium text-foreground">
                    {tutor.user.firstName} {tutor.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tutor.user.major ?? "—"} • {Array.isArray(tutor.subjects) ? tutor.subjects.join(", ") : ""}
                  </p>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              onClick={() => {
                setIsAssignModalOpen(false);
                setSelectedRequest(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!declineModalRequest}
        onClose={closeDeclineModal}
        title="Decline Request"
        size="md"
      >
        {declineModalRequest && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Declining request for:{" "}
                <span className="font-medium text-foreground">
                  {declineModalRequest.user.first_name} {declineModalRequest.user.last_name}
                </span>
              </p>
              <p className="text-sm font-medium text-foreground mt-1">
                {declineModalRequest.course.code} - {declineModalRequest.course.title}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decline-reason">Reason for declining</Label>
              <Textarea
                id="decline-reason"
                value={declineReason}
                onChange={(e) => {
                  setDeclineReason(e.target.value);
                  if (declineReasonError) setDeclineReasonError(null);
                }}
                placeholder="Write the reason that will be sent to the tutoree..."
                className="min-h-[100px] resize-y"
                disabled={declineSubmitting}
              />
              {declineReasonError && (
                <p className="text-sm text-destructive">{declineReasonError}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={declineNotifyEmail}
                  onCheckedChange={(checked) => setDeclineNotifyEmail(checked === true)}
                  disabled={declineSubmitting}
                />
                <span className="text-sm text-foreground">Send email to tutoree</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={declineNotifyInApp}
                  onCheckedChange={(checked) => setDeclineNotifyInApp(checked === true)}
                  disabled={declineSubmitting}
                />
                <span className="text-sm text-foreground">Send in app notification to tutoree</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={closeDeclineModal}
                disabled={declineSubmitting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineSubmit}
                disabled={declineSubmitting}
                className="btn-primary bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {declineSubmitting ? "Declining…" : "Decline"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
