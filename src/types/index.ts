
// TypeScript types matching the database schema EXACTLY
// DO NOT rename or add fields unless explicitly required

export interface User {
  id: number
  trevecca_id: string
  email: string
  first_name: string
  last_name: string
  year: number | null
  created_at: string // timestamp as ISO string
  temporary_password: string | null
  role: string // "admin" | "student"
}

export interface Tutor {
  user_id: number // PK/FK → user.id
  major: string | null
  subjects: string | null // comma-separated or JSON string
  hourly_limit: number | null
  active: boolean
}

export interface Course {
  id: number
  code: string
  title: string
  department: string | null
}

export interface TutoringRequest {
  id: number
  user_id: number
  requested_tutor_id: number | null

  // 2/16/2026 SS: Task 3 store decline reason on request
  decline_reason?: string | null

  course_id: number
  description: string | null // TODO: Match ERD type exactly if different
  status: string | null // "pending" | "approved" | "denied"
  created_at: string // timestamp as ISO string
}

export interface TutoringSession {
  id: number
  tutor_id: number
  user_id: number
  request_id: number
  course_id: number
  start_time: string | null // timestamp as ISO string
  end_time: string | null // timestamp as ISO string
  status: string | null // "scheduled" | "completed" | "cancelled"
  attended: boolean | null
  notes: string | null
}

export interface SessionMetrics {
  date: string // date as ISO string (PK)
  total_sessions: number | null
  total_requests: number | null
  avg_duration: number | null // in minutes
  total_spent: number | null
}

export interface TutorMetrics {
  tutor_id: number // PK
  total_sessions: number | null
  total_hours: number | null
  utilization: number | null // numeric(5,2)
}

export interface CourseMetrics {
  course_id: number // PK
  total_requests: number | null
  total_sessions: number | null
}

// Extended types for UI convenience
export interface TutorWithUser extends Tutor {
  user: User
}

export interface TutoringRequestWithDetails extends TutoringRequest {
  user: User
  course: Course
  requested_tutor?: TutorWithUser | null
}

export interface TutoringSessionWithDetails extends TutoringSession {
  tutor: TutorWithUser
  student: User
  course: Course
}

// Auth context types
export interface AuthUser {
  user: User
  tutor: Tutor | null
  isAdmin: boolean
  isTutor: boolean
}
