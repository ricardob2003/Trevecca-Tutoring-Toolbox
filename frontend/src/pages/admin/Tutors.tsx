import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import {
  createTutorAPI,
  getTutorsAPI,
  updateTutorAPI,
  updateTutorActiveAPI,
  type TutorApiRecord,
} from "@/lib/api";
import type { TutorWithUser } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface TutorAssignedStudent {
  student: {
    id: number;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
  };
  course: {
    id: number;
    code: string;
    title: string;
  };
  currentSessionStatus: string | null;
}

function mapApiTutorToUi(tutor: TutorApiRecord): TutorWithUser {
  return {
    user_id: tutor.userId,
    major: tutor.user.major,
    subjects: tutor.subjects.length ? tutor.subjects.join(", ") : null,
    hourly_limit: tutor.hourlyLimit,
    active: tutor.active,
    user: {
      id: tutor.user.treveccaId,
      trevecca_id: String(tutor.user.treveccaId),
      email: tutor.user.email,
      first_name: tutor.user.firstName,
      last_name: tutor.user.lastName,
      year: tutor.user.year,
      created_at: "",
      temporary_password: null,
      role: tutor.user.role,
    },
  };
}

function parseSubjects(input: string): string[] {
  return input
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean);
}

export default function AdminTutors() {
  const [tutors, setTutors] = useState<TutorWithUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<TutorWithUser | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savingTutorId, setSavingTutorId] = useState<number | null>(null);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<TutorAssignedStudent[]>([]);

  const [newTutorUserIdInput, setNewTutorUserIdInput] = useState("");
  const [formData, setFormData] = useState({
    major: "",
    subjects: "",
    hourly_limit: 20,
  });

  const loadTutors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTutorsAPI();
      setTutors(data.map(mapApiTutorToUi));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tutors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTutors();
  }, []);

  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch =
      tutor.user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.major?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subjects?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && tutor.active) ||
      (statusFilter === "inactive" && !tutor.active);

    return matchesSearch && matchesStatus;
  });

  const handleToggleActive = async (tutor: TutorWithUser) => {
    const nextActive = !tutor.active;

    setError(null);
    setSavingTutorId(tutor.user_id);
    setTutors((prev) =>
      prev.map((item) =>
        item.user_id === tutor.user_id ? { ...item, active: nextActive } : item
      )
    );

    try {
      await updateTutorActiveAPI(tutor.user_id, nextActive);
    } catch (err) {
      setTutors((prev) =>
        prev.map((item) =>
          item.user_id === tutor.user_id ? { ...item, active: tutor.active } : item
        )
      );
      setError(err instanceof Error ? err.message : "Failed to update tutor status");
    } finally {
      setSavingTutorId(null);
    }
  };

  const handleCreateTutor = async () => {
    const userId = Number(newTutorUserIdInput);
    const subjects = parseSubjects(formData.subjects);

    if (!Number.isInteger(userId) || userId <= 0 || subjects.length === 0) {
      setError("Enter a valid Trevecca ID and at least one subject.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await createTutorAPI({
        userId,
        subjects,
        hourlyLimit: formData.hourly_limit,
        active: true,
      });

      setIsCreateModalOpen(false);
      resetForm();
      await loadTutors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tutor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTutor = async () => {
    if (!selectedTutor) return;

    const subjects = parseSubjects(formData.subjects);
    if (subjects.length === 0) {
      setError("At least one subject is required.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await updateTutorAPI(selectedTutor.user_id, {
        major: formData.major.trim() ? formData.major.trim() : null,
        subjects,
        hourlyLimit: formData.hourly_limit,
      });

      setIsEditModalOpen(false);
      setSelectedTutor(null);
      resetForm();
      await loadTutors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tutor");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (tutor: TutorWithUser) => {
    setSelectedTutor(tutor);
    setFormData({
      major: tutor.major || "",
      subjects: tutor.subjects || "",
      hourly_limit: tutor.hourly_limit || 20,
    });
    setIsEditModalOpen(true);
  };

  const openStudentsModal = async (tutor: TutorWithUser) => {
    setSelectedTutor(tutor);
    setIsStudentsModalOpen(true);
    setIsStudentsLoading(true);
    setStudentsError(null);
    setAssignedStudents([]);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/v1/tutors/${tutor.user_id}/students`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message =
          data && typeof data === "object" && "message" in data && typeof data.message === "string"
            ? data.message
            : "Failed to load assigned students";
        throw new Error(message);
      }

      const data = (await response.json()) as TutorAssignedStudent[];
      setAssignedStudents(data);
    } catch (err) {
      setStudentsError(err instanceof Error ? err.message : "Failed to load assigned students");
    } finally {
      setIsStudentsLoading(false);
    }
  };

  const resetForm = () => {
    setNewTutorUserIdInput("");
    setFormData({ major: "", subjects: "", hourly_limit: 20 });
  };

  const columns = [
    {
      key: "tutor",
      header: "Tutor",
      render: (tutor: TutorWithUser) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {tutor.user.first_name[0]}
              {tutor.user.last_name[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground">
              {tutor.user.first_name} {tutor.user.last_name}
            </p>
            <p className="text-xs text-muted-foreground">{tutor.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "major",
      header: "Major",
      render: (tutor: TutorWithUser) => (
        <span className="text-sm text-foreground">
          {tutor.major || <span className="text-muted-foreground italic">Not set</span>}
        </span>
      ),
    },
    {
      key: "subjects",
      header: "Subjects",
      render: (tutor: TutorWithUser) => (
        <div className="flex flex-wrap gap-1">
          {tutor.subjects?.split(",").map((subject) => (
            <span key={subject} className="badge-primary">
              {subject.trim()}
            </span>
          )) || <span className="text-muted-foreground italic text-sm">None</span>}
        </div>
      ),
    },
    {
      key: "hourly_limit",
      header: "Hours/Week",
      render: (tutor: TutorWithUser) => (
        <span className="text-sm text-foreground">{tutor.hourly_limit || "-"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (tutor: TutorWithUser) => (
        <StatusBadge status={tutor.active ? "active" : "inactive"} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (tutor: TutorWithUser) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              void openStudentsModal(tutor);
            }}
            disabled={isSaving}
            className="p-1.5 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
            title="View Assigned Students"
          >
            <Users size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(tutor);
            }}
            disabled={isSaving}
            className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              void handleToggleActive(tutor);
            }}
            disabled={savingTutorId === tutor.user_id || isSaving}
            className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
              tutor.active
                ? "bg-success/10 text-success hover:bg-success/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            title={tutor.active ? "Deactivate" : "Activate"}
          >
            {tutor.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header mb-0">Tutors</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add Tutor
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-sm text-destructive flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => void loadTutors()} className="btn-secondary py-1 px-3">
            Retry
          </button>
        </div>
      )}

      <div className="card-base p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, major, or subject..."
            className="flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full sm:w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="card-base overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading tutors...</div>
        ) : filteredTutors.length === 0 ? (
          <EmptyState
            icon={<Users size={40} />}
            title="No tutors found"
            description="There are no tutors matching your filters."
            action={
              <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
                Add First Tutor
              </button>
            }
          />
        ) : (
          <DataTable columns={columns} data={filteredTutors} keyField="user_id" />
        )}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Add New Tutor"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Student Trevecca ID
            </label>
            <input
              type="number"
              value={newTutorUserIdInput}
              onChange={(e) => setNewTutorUserIdInput(e.target.value)}
              placeholder="e.g., 100005"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Major</label>
            <input
              type="text"
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              placeholder="e.g., Computer Science"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Subjects (comma-separated)
            </label>
            <input
              type="text"
              value={formData.subjects}
              onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
              placeholder="e.g., CS101, CS201, MATH101"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Weekly Hour Limit
            </label>
            <input
              type="number"
              value={formData.hourly_limit}
              onChange={(e) => setFormData({ ...formData, hourly_limit: Number(e.target.value) })}
              min={1}
              max={60}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleCreateTutor()}
              disabled={isSaving || !newTutorUserIdInput.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {isSaving ? "Creating..." : "Create Tutor"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTutor(null);
          resetForm();
        }}
        title="Edit Tutor"
        size="md"
      >
        <div className="space-y-4">
          {selectedTutor && (
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium text-foreground">
                {selectedTutor.user.first_name} {selectedTutor.user.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{selectedTutor.user.email}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Major</label>
            <input
              type="text"
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              placeholder="e.g., Computer Science"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Subjects (comma-separated)
            </label>
            <input
              type="text"
              value={formData.subjects}
              onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
              placeholder="e.g., CS101, CS201, MATH101"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Weekly Hour Limit
            </label>
            <input
              type="number"
              value={formData.hourly_limit}
              onChange={(e) => setFormData({ ...formData, hourly_limit: Number(e.target.value) })}
              min={1}
              max={60}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedTutor(null);
                resetForm();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleEditTutor()}
              disabled={isSaving}
              className="btn-primary disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isStudentsModalOpen}
        onClose={() => {
          setIsStudentsModalOpen(false);
          setStudentsError(null);
          setAssignedStudents([]);
          setSelectedTutor(null);
        }}
        title="Assigned Students"
        size="md"
      >
        <div className="space-y-4">
          {selectedTutor && (
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium text-foreground">
                {selectedTutor.user.first_name} {selectedTutor.user.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{selectedTutor.user.email}</p>
            </div>
          )}

          {isStudentsLoading ? (
            <p className="text-sm text-muted-foreground">Loading assigned students...</p>
          ) : studentsError ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">{studentsError}</p>
              {selectedTutor && (
                <button
                  onClick={() => void openStudentsModal(selectedTutor)}
                  className="btn-secondary"
                >
                  Retry
                </button>
              )}
            </div>
          ) : assignedStudents.length === 0 ? (
            <EmptyState
              icon={<Users size={32} />}
              title="No assigned students"
              description="This tutor has no students with approved requests."
            />
          ) : (
            <div className="space-y-2">
              {assignedStudents.map((item) => (
                <div key={`${item.student.id}-${item.course.id}`} className="p-3 rounded-md border border-border">
                  <p className="font-medium text-foreground">{item.student.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{item.student.email}</p>
                  <p className="text-sm text-foreground">
                    {item.course.code} - {item.course.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Session: {item.currentSessionStatus || "Not scheduled"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
