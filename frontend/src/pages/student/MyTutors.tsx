import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getRequestsAPI, mapRequestItemToWithDetails } from "@/lib/api";
import type { TutorWithUser, Course, TutoringRequestWithDetails } from "@/types";
import { Users, BookOpen, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";

interface TutorWithDetails extends TutorWithUser {
  courses: Course[];
}

export default function MyTutors() {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [approvedRequests, setApprovedRequests] = useState<TutoringRequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [schedulingTutor, setSchedulingTutor] = useState<TutorWithDetails | null>(null);
  const [scheduleCourseId, setScheduleCourseId] = useState<number | "">("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  const userId = currentUser.user.id;

  useEffect(() => {
    let cancelled = false;

    async function loadApprovedRequests() {
      setIsLoading(true);
      setError(null);

      try {
        const { items } = await getRequestsAPI({ userId, status: "approved" });
        if (cancelled) return;
        setApprovedRequests(items.map(mapRequestItemToWithDetails));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load tutors");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadApprovedRequests();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const tutorsWithDetails: TutorWithDetails[] = useMemo(() => {
    const byTutor = new Map<number, TutorWithDetails>();

    for (const request of approvedRequests) {
      if (!request.requested_tutor) continue;

      const tutor = request.requested_tutor;
      const existing = byTutor.get(tutor.user_id);

      if (!existing) {
        byTutor.set(tutor.user_id, {
          ...tutor,
          courses: [request.course],
        });
        continue;
      }

      if (!existing.courses.some((course) => course.id === request.course.id)) {
        existing.courses.push(request.course);
      }
    }

    return Array.from(byTutor.values());
  }, [approvedRequests]);

  const filteredTutors = tutorsWithDetails.filter((tutor) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      tutor.user.first_name.toLowerCase().includes(searchLower) ||
      tutor.user.last_name.toLowerCase().includes(searchLower) ||
      tutor.user.email.toLowerCase().includes(searchLower) ||
      tutor.major?.toLowerCase().includes(searchLower) ||
      tutor.courses.some(
        (c) =>
          c.code.toLowerCase().includes(searchLower) ||
          c.title.toLowerCase().includes(searchLower)
      )
    );
  });

  const openScheduleModal = (tutor: TutorWithDetails) => {
    setSchedulingTutor(tutor);
    setScheduleCourseId(tutor.courses[0]?.id ?? "");
    setScheduleDate("");
    setScheduleTime("");
    setScheduleNotes("");
  };

  const closeScheduleModal = () => {
    setSchedulingTutor(null);
    setScheduleCourseId("");
    setScheduleDate("");
    setScheduleTime("");
    setScheduleNotes("");
  };

  const handleScheduleMeeting = async () => {
    if (!currentUser || !schedulingTutor) return;
    const courseId =
      typeof scheduleCourseId === "number"
        ? scheduleCourseId
        : schedulingTutor.courses[0]?.id;

    if (!courseId || !scheduleDate || !scheduleTime) {
      toast.error("Please select a course, date, and time.");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    toast.success("Meeting request placeholder sent. Session API integration is pending.");
    closeScheduleModal();
  };

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">My Tutors</h1>

      {tutorsWithDetails.length > 0 && (
        <div className="card-base p-4 mb-6">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by tutor name, email, major, or course..."
            className="w-full"
          />
        </div>
      )}

      {isLoading ? (
        <div className="card-base p-6 text-center text-muted-foreground">
          Loading approved tutor assignments...
        </div>
      ) : error ? (
        <div className="card-base p-6 text-center text-destructive text-sm">{error}</div>
      ) : filteredTutors.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title={tutorsWithDetails.length === 0 ? "No tutors yet" : "No tutors found"}
          description={
            tutorsWithDetails.length === 0
              ? "You have no approved tutor requests yet."
              : "Try adjusting your search criteria."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTutors.map((tutor) => (
            <div key={tutor.user_id} className="card-base p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-medium text-primary">
                    {tutor.user.first_name[0]}
                    {tutor.user.last_name[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-lg">
                    {tutor.user.first_name} {tutor.user.last_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail size={14} className="text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{tutor.user.email}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={16} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    Classes Requested ({tutor.courses.length})
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tutor.courses.map((course) => (
                    <span
                      key={course.id}
                      className="px-2 py-1 text-xs rounded-md bg-muted text-muted-foreground"
                    >
                      {course.code} - {course.title}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => openScheduleModal(tutor)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Calendar size={16} />
                  Request Session/Meeting
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!schedulingTutor}
        onClose={closeScheduleModal}
        title={
          schedulingTutor
            ? `Schedule meeting with ${schedulingTutor.user.first_name} ${schedulingTutor.user.last_name}`
            : "Schedule meeting"
        }
        size="lg"
      >
        {schedulingTutor && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-course">Course</Label>
              <select
                id="schedule-course"
                value={scheduleCourseId}
                onChange={(e) => setScheduleCourseId(e.target.value ? Number(e.target.value) : "")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {schedulingTutor.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-notes">Notes (optional)</Label>
              <Textarea
                id="schedule-notes"
                placeholder="What do you want to cover?"
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeScheduleModal} className="btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScheduleMeeting}
                disabled={isSubmitting || !scheduleDate || !scheduleTime}
                className="btn-primary"
              >
                {isSubmitting ? "Sending..." : "Send request"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
