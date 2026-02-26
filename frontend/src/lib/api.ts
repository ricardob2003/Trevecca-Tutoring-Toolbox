const API_URL = import.meta.env.VITE_API_URL ?? (typeof window !== "undefined" ? "" : "http://localhost:3000");

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
  const response = await fetch(`${API_URL}/api/v1/tutors/assignable`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
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
  const response = await fetch(`${API_URL}/api/v1/courses`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

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
  const response = await fetch(url, { method: "GET", headers: getAuthHeaders() });
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
  const response = await fetch(`${API_URL}/api/v1/requests`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      userId: payload.userId,
      courseId: payload.courseId,
      ...(payload.description ? { description: payload.description } : {}),
      ...(payload.requestedTutorId != null ? { requestedTutorId: payload.requestedTutorId } : {}),
    }),
  });
  if (!response.ok) await parseApiError(response, "Failed to submit request");
  return response.json();
}

export interface PatchRequestPayload {
  status?: string;
  requestedTutorId?: number | null;
  declineReason?: string | null;
}

export async function patchRequestAPI(id: number, payload: PatchRequestPayload): Promise<RequestItem> {
  const response = await fetch(`${API_URL}/api/v1/requests/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Failed to update request");
  return response.json();
}

export async function patchRequestTutorResponseAPI(id: number, accepted: boolean): Promise<RequestItem> {
  const response = await fetch(`${API_URL}/api/v1/requests/${id}/tutor-response`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ accepted }),
  });
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
