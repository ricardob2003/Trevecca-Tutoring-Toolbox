const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function withCredentials(init: RequestInit = {}): RequestInit {
  return {
    ...init,
    credentials: "include",
  };
}

export interface LoginResponse {
  token?: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tutor: {
      subjects: string[];
      hourlyLimit: number;
      active: boolean;
    } | null;
    authProvider: string;
  };
}

export async function loginAPI(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/login`,
    withCredentials({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Login failed",
    }));
    throw new Error(error.message || "Login failed");
  }

  return response.json();
}

export async function getCurrentUserAPI(): Promise<{ user: LoginResponse["user"] }> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/me`,
    withCredentials({
      method: "GET",
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to load current user");
  }

  return response.json();
}

export async function logoutAPI(): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/logout`,
    withCredentials({
      method: "POST",
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to log out");
  }
}

export interface TutorApiUser {
  treveccaId: number;
  email: string;
  firstName: string;
  lastName: string;
  major: string | null;
  year: number | null;
  role: string;
}

export interface TutorApiRecord {
  userId: number;
  subjects: string[];
  hourlyLimit: number;
  active: boolean;
  user: TutorApiUser;
}

export interface CreateTutorPayload {
  userId: number;
  subjects: string[];
  hourlyLimit: number;
  active?: boolean;
}

export interface UpdateTutorPayload {
  major: string | null;
  subjects: string[];
  hourlyLimit: number;
}

function getJsonHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
  };
}

async function parseApiError(response: Response, fallbackMessage: string) {
  const error = await response.json().catch(() => null);
  const message =
    (error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message) ||
    fallbackMessage;

  throw new Error(message);
}

export async function getTutorsAPI(): Promise<TutorApiRecord[]> {
  const response = await fetch(
    `${API_URL}/api/v1/tutors`,
    withCredentials({
      method: "GET",
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to load tutors");
  }

  return response.json();
}

export async function createTutorAPI(
  payload: CreateTutorPayload
): Promise<TutorApiRecord> {
  const response = await fetch(
    `${API_URL}/api/v1/tutors`,
    withCredentials({
      method: "POST",
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to create tutor");
  }

  return response.json();
}

export async function updateTutorAPI(
  tutorId: number,
  payload: UpdateTutorPayload
): Promise<TutorApiRecord> {
  const response = await fetch(
    `${API_URL}/api/v1/tutors/${tutorId}`,
    withCredentials({
      method: "PUT",
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to update tutor");
  }

  return response.json();
}

export async function updateTutorActiveAPI(
  tutorId: number,
  active: boolean
): Promise<TutorApiRecord> {
  const response = await fetch(
    `${API_URL}/api/v1/tutors/${tutorId}/active`,
    withCredentials({
      method: "PATCH",
      headers: getJsonHeaders(),
      body: JSON.stringify({ active }),
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to update tutor status");
  }

  return response.json();
}

export async function getTutorAssignedStudentsAPI(
  tutorId: number
): Promise<
  Array<{
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
  }>
> {
  const response = await fetch(
    `${API_URL}/api/v1/tutors/${tutorId}/students`,
    withCredentials({
      method: "GET",
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to load assigned students");
  }

  return response.json();
}

export async function getAssignableTutorsAPI(): Promise<TutorApiRecord[]> {
  const response = await fetch(
    `${API_URL}/api/v1/tutors/assignable`,
    withCredentials({
      method: "GET",
    })
  );
  if (!response.ok) await parseApiError(response, "Failed to load tutors");
  return response.json();
}

// --- Courses API ---
export interface CourseApiItem {
  id: number;
  code: string;
  title: string;
  department: string | null;
}

export async function getCoursesAPI(): Promise<CourseApiItem[]> {
  const response = await fetch(
    `${API_URL}/api/v1/courses`,
    withCredentials({
      method: "GET",
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to load courses");
  }

  return response.json();
}

// --- Requests API ---
export interface RequestItemUser {
  treveccaId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}
export interface RequestItemCourse {
  id: number;
  code: string;
  title: string;
  department: string | null;
}
export interface RequestItemTutorUser {
  treveccaId: number;
  email: string;
  firstName: string;
  lastName: string;
}
export interface RequestItemTutor {
  userId: number;
  subjects: string[];
  hourlyLimit: number;
  active: boolean;
  user: RequestItemTutorUser;
}
export interface RequestItem {
  id: number;
  userId: number;
  requestedTutorId: number | null;
  courseId: number;
  description: string | null;
  status: string;
  declineReason: string | null;
  createdAt: string;
  user: RequestItemUser;
  course: RequestItemCourse;
  requestedTutor: RequestItemTutor | null;
}

export interface GetRequestsParams {
  status?: string;
  requestedTutorId?: number;
  userId?: number;
}

export async function getRequestsAPI(
  params?: GetRequestsParams
): Promise<{ items: RequestItem[] }> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.requestedTutorId != null) search.set("requestedTutorId", String(params.requestedTutorId));
   if (params?.userId != null) search.set("userId", String(params.userId));
  const qs = search.toString();
  const url = `${API_URL}/api/v1/requests${qs ? `?${qs}` : ""}`;
  const response = await fetch(
    url,
    withCredentials({
      method: "GET",
    })
  );
  if (!response.ok) await parseApiError(response, "Failed to load requests");
  return response.json();
}

export interface CreateRequestPayload {
  userId: number;
  courseId: number;
  description?: string;
  requestedTutorId?: number | null;
}

export async function createRequestAPI(payload: CreateRequestPayload): Promise<RequestItem> {
  const response = await fetch(
    `${API_URL}/api/v1/requests`,
    withCredentials({
      method: "POST",
      headers: getJsonHeaders(),
      body: JSON.stringify({
        userId: payload.userId,
        courseId: payload.courseId,
        ...(payload.description ? { description: payload.description } : {}),
        ...(payload.requestedTutorId != null ? { requestedTutorId: payload.requestedTutorId } : {}),
      }),
    })
  );
  if (!response.ok) await parseApiError(response, "Failed to submit request");
  return response.json();
}

export interface PatchRequestPayload {
  status?: string;
  requestedTutorId?: number | null;
  declineReason?: string | null;
}

export async function patchRequestAPI(id: number, payload: PatchRequestPayload): Promise<RequestItem> {
  const response = await fetch(
    `${API_URL}/api/v1/requests/${id}`,
    withCredentials({
      method: "PATCH",
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    })
  );
  if (!response.ok) await parseApiError(response, "Failed to update request");
  return response.json();
}

export async function patchRequestTutorResponseAPI(id: number, accepted: boolean): Promise<RequestItem> {
  const response = await fetch(
    `${API_URL}/api/v1/requests/${id}/tutor-response`,
    withCredentials({
      method: "PATCH",
      headers: getJsonHeaders(),
      body: JSON.stringify({ accepted }),
    })
  );
  if (!response.ok) await parseApiError(response, "Failed to respond");
  return response.json();
}

export function mapRequestItemToWithDetails(
  item: RequestItem
): import("@/types").TutoringRequestWithDetails {
  return {
    id: item.id,
    user_id: item.userId,
    requested_tutor_id: item.requestedTutorId,
    course_id: item.courseId,
    description: item.description,
    status: item.status,
    decline_reason: item.declineReason ?? null,
    created_at: item.createdAt,
    user: {
      id: item.user.treveccaId,
      trevecca_id: String(item.user.treveccaId),
      email: item.user.email,
      first_name: item.user.firstName,
      last_name: item.user.lastName,
      year: null,
      created_at: "",
      temporary_password: null,
      role: item.user.role,
    },
    course: {
      id: item.course.id,
      code: item.course.code,
      title: item.course.title,
      department: item.course.department,
    },
    requested_tutor: item.requestedTutor
      ? {
          user_id: item.requestedTutor.userId,
          major: null,
          subjects: Array.isArray(item.requestedTutor.subjects) ? item.requestedTutor.subjects.join(",") : "",
          hourly_limit: item.requestedTutor.hourlyLimit,
          active: item.requestedTutor.active,
          user: {
            id: item.requestedTutor.user.treveccaId,
            trevecca_id: String(item.requestedTutor.user.treveccaId),
            email: item.requestedTutor.user.email,
            first_name: item.requestedTutor.user.firstName,
            last_name: item.requestedTutor.user.lastName,
            year: null,
            created_at: "",
            temporary_password: null,
            role: "",
          },
        }
      : null,
  };
}

// --- Sessions API ---
export interface SessionItem {
  id: number;
  studentName: string;
  studentId: number;
  courseCode: string;
  startTime: string;
  endTime: string;
  status: string;
  attended: boolean | null;
  notes: string | null;
}

export interface StudentSessionItem {
  id: number;
  tutorId: number | null;
  tutorName: string;
  courseCode: string;
  courseTitle: string;
  startTime: string;
  endTime: string;
  status: string;
  attended: boolean | null;
  notes: string | null;
}

export interface AdminSessionItem {
  id: number;
  tutorId: number | null;
  userId: number | null;
  requestId: number | null;
  courseId: number | null;
  startTime: string | null;
  endTime: string | null;
  status: string | null;
  attended: boolean | null;
  notes: string | null;
  tutorName: string;
  tutorEmail: string | null;
  studentName: string;
  studentEmail: string | null;
  courseCode: string;
  courseTitle: string;
}

export interface GetSessionsParams {
  tutorId?: number;
  userId?: number;
  from?: string;
  to?: string;
}

function getPersonName(person: any): string {
  const first = person?.firstName ?? person?.first_name ?? "";
  const last = person?.lastName ?? person?.last_name ?? "";
  const full = `${first} ${last}`.trim();
  return full || "Unknown";
}

export async function getSessionsAPI(
  params?: GetSessionsParams
): Promise<AdminSessionItem[]> {
  const search = new URLSearchParams();
  if (params?.tutorId != null) search.set("tutor_id", String(params.tutorId));
  if (params?.userId != null) search.set("user_id", String(params.userId));
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const qs = search.toString();
  const url = `${API_URL}/api/v1/sessions${qs ? `?${qs}` : ""}`;

  const response = await fetch(
    url,
    withCredentials({
      method: "GET",
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to load sessions");
  }

  const raw = (await response.json()) as any[];
  return raw.map((session) => {
    const tutorUser = session.tutor?.user ?? null;
    const studentUser = session.user ?? null;
    const course = session.course ?? null;

    return {
      id: session.id,
      tutorId: session.tutorId ?? session.tutor_id ?? null,
      userId: session.userId ?? session.user_id ?? null,
      requestId: session.requestId ?? session.request_id ?? null,
      courseId: session.courseId ?? session.course_id ?? null,
      startTime: session.startTime ?? session.start_time ?? null,
      endTime: session.endTime ?? session.end_time ?? null,
      status: session.status ?? null,
      attended: session.attended ?? null,
      notes: session.notes ?? null,
      tutorName: tutorUser ? getPersonName(tutorUser) : "Unknown",
      tutorEmail: tutorUser?.email ?? null,
      studentName: studentUser ? getPersonName(studentUser) : "Unknown",
      studentEmail: studentUser?.email ?? null,
      courseCode: course?.code ?? "",
      courseTitle: course?.title ?? "",
    };
  });
}

export interface GetTutorSessionsParams {
  from?: string;
  to?: string;
}

export async function getTutorSessionsAPI(
  tutorId: number,
  params?: GetTutorSessionsParams
): Promise<SessionItem[]> {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const qs = search.toString();
  const url = `${API_URL}/api/v1/tutors/${tutorId}/sessions${qs ? `?${qs}` : ""}`;

  const response = await fetch(
    url,
    withCredentials({ method: "GET" })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to load sessions");
  }

  return response.json();
}

export async function getStudentSessionsAPI(
  userId: number
): Promise<StudentSessionItem[]> {
  const response = await fetch(
    `${API_URL}/api/v1/sessions?user_id=${userId}`,
    withCredentials({ method: "GET" })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to load sessions");
  }

  const raw = (await response.json()) as any[];

  return raw.map((session) => ({
    id: session.id,
    tutorId: session.tutor?.user?.treveccaId ?? session.tutorId ?? null,
    tutorName: session.tutor?.user
      ? `${session.tutor.user.firstName} ${session.tutor.user.lastName}`
      : "Tutor",
    courseCode: session.course?.code ?? "",
    courseTitle: session.course?.title ?? "",
    startTime: session.startTime,
    endTime: session.endTime,
    status: session.status,
    attended: session.attended ?? null,
    notes: session.notes ?? null,
  }));
}

export interface CreateSessionPayload {
  requestId: number;
  startTime: string;
  endTime: string;
}

export interface CompleteSessionPayload {
  attended: boolean;
  notes?: string;
}

export async function createSessionAPI(
  payload: CreateSessionPayload
): Promise<any> {
  const response = await fetch(
    `${API_URL}/api/v1/sessions`,
    withCredentials({
      method: "POST",
      headers: getJsonHeaders(),
      body: JSON.stringify({
        request_id: payload.requestId,
        start_time: payload.startTime,
        end_time: payload.endTime,
      }),
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to create session");
  }

  return response.json();
}

export async function completeSessionAPI(
  id: number,
  payload: CompleteSessionPayload
): Promise<any> {
  const response = await fetch(
    `${API_URL}/api/v1/sessions/${id}/complete`,
    withCredentials({
      method: "PATCH",
      headers: getJsonHeaders(),
      body: JSON.stringify({
        attended: payload.attended,
        ...(payload.notes ? { notes: payload.notes } : {}),
      }),
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to complete session");
  }

  return response.json();
}
