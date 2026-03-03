import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Users, BookOpen } from "lucide-react";
import { getRequestsAPI, mapRequestItemToWithDetails } from "@/lib/api";
import type { TutoringRequestWithDetails } from "@/types";

export default function TutorStudents() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<TutoringRequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser?.isTutor) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          icon={<Users size={40} />}
          title="Tutor Access Required"
          description="You need to be an active tutor to access this page."
        />
      </div>
    );
  }

  const tutorId = currentUser.user.id;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const { items } = await getRequestsAPI({
          requestedTutorId: tutorId,
          status: "approved",
        });

        if (cancelled) return;
        setRequests(items.map(mapRequestItemToWithDetails));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load students");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [tutorId]);

  const studentsByCourse = useMemo(() => {
    const courseMap = new Map<
      number,
      {
        course: TutoringRequestWithDetails["course"];
        students: Array<{
          id: number;
          first_name: string;
          last_name: string;
          email: string;
          status: string | null;
        }>;
      }
    >();

    for (const request of requests) {
      const existingCourse = courseMap.get(request.course.id);
      if (!existingCourse) {
        courseMap.set(request.course.id, {
          course: request.course,
          students: [
            {
              id: request.user.id,
              first_name: request.user.first_name,
              last_name: request.user.last_name,
              email: request.user.email,
              status: request.status,
            },
          ],
        });
        continue;
      }

      const exists = existingCourse.students.some((s) => s.id === request.user.id);
      if (!exists) {
        existingCourse.students.push({
          id: request.user.id,
          first_name: request.user.first_name,
          last_name: request.user.last_name,
          email: request.user.email,
          status: request.status,
        });
      }
    }

    return Array.from(courseMap.values());
  }, [requests]);

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">My Students</h1>

      {isLoading ? (
        <div className="card-base p-6 text-center text-muted-foreground">
          Loading approved student assignments...
        </div>
      ) : error ? (
        <div className="card-base p-6 text-center text-destructive text-sm">{error}</div>
      ) : studentsByCourse.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="No students yet"
          description="Students from approved requests will appear here, grouped by course."
        />
      ) : (
        <div className="space-y-6">
          {studentsByCourse.map(({ course, students }) => (
            <div key={course.id} className="card-base">
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{course.code}</h2>
                    <p className="text-sm text-muted-foreground">{course.title}</p>
                  </div>
                  <span className="ml-auto badge-primary">
                    {students.length} student{students.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-border">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {student.first_name[0]}
                        {student.last_name[0]}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>

                    <StatusBadge status={student.status || "approved"} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
