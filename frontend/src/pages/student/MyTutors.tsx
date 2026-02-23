import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  mockTutoringSessions,
  mockCourses,
  getTutorWithUser,
  addSessionRequest,
} from "@/data/mockData";
import type { TutorWithUser, Course } from "@/types";
import { Users, BookOpen, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";

interface TutorWithDetails extends TutorWithUser {
  courses: Course[];
}

export default function MyTutors() {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [schedulingTutor, setSchedulingTutor] = useState<TutorWithDetails | null>(null);
  const [scheduleCourseId, setScheduleCourseId] = useState<number | "">("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  const userId = currentUser.user.id;

  // Get all sessions for this student
  const mySessions = mockTutoringSessions.filter((s) => s.user_id === userId);

  // Get unique tutors from sessions
  const uniqueTutorIds = [...new Set(mySessions.map((s) => s.tutor_id))];
  const tutorsWithDetails: TutorWithDetails[] = uniqueTutorIds
    .map((tutorId) => {
      const tutor = getTutorWithUser(tutorId);
      if (!tutor) return null;

      // Get sessions with this tutor
      const tutorSessions = mySessions.filter((s) => s.tutor_id === tutorId);

      // Get unique courses
      const courseIds = [...new Set(tutorSessions.map((s) => s.course_id))];
      const courses = courseIds
        .map((id) => mockCourses.find((c) => c.id === id))
        .filter(Boolean) as Course[];

      return {
        ...tutor,
        courses,
      };
    })
    .filter(Boolean) as TutorWithDetails[];

  // Filter tutors based on search query
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
    const courseId = typeof scheduleCourseId === "number" ? scheduleCourseId : schedulingTutor.courses[0]?.id;
    if (!courseId || !scheduleDate || !scheduleTime) {
      toast.error("Please select a course, date, and time.");
      return;
    }
    setIsSubmitting(true);
    const startTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    const endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();
    await new Promise((r) => setTimeout(r, 800));
    addSessionRequest(
      schedulingTutor.user_id,
      currentUser.user.id,
      courseId,
      startTime,
      endTime,
      scheduleNotes || null
    );
    setIsSubmitting(false);
    toast.success("Meeting request sent! The tutor will confirm the session.");
    closeScheduleModal();
  };

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">My Tutors</h1>

      {/* Search */}
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

      {/* Tutors List */}
      {filteredTutors.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title={
            tutorsWithDetails.length === 0
              ? "No tutors yet"
              : "No tutors found"
          }
          description={
            tutorsWithDetails.length === 0
              ? "You haven't been matched with any tutors yet. Request tutoring to get started!"
              : "Try adjusting your search criteria."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTutors.map((tutor) => (
            <div key={tutor.user_id} className="card-base p-6">
              {/* Tutor Header */}
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
                    <p className="text-sm text-muted-foreground">
                      {tutor.user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Courses */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={16} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    Courses Teaching ({tutor.courses.length})
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

              {/* Schedule meeting button */}
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

      {/* Schedule meeting modal */}
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
                    {c.code} – {c.title}
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
                {isSubmitting ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
