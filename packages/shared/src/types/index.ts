// User Types
export type UserStatus = 'active' | 'suspended' | 'deleted';
export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  school: string;
  nickname: string;
  created_at: Date;
  updated_at: Date;
  status: UserStatus;
  role: UserRole;
  last_active_at: Date | null;
}

// Board Types
export type BoardKey = 'free' | 'secret' | 'info' | 'hot' | 'cs';
export type BoardVisibility = 'school_only';

export interface Board {
  id: string;
  key: BoardKey;
  name: string;
  visibility: BoardVisibility;
  anon_mode: 'optional' | 'forced' | 'disabled';
}

// Post Types
export type PostStatus = 'active' | 'hidden' | 'deleted';

export interface Post {
  id: string;
  board_id: string;
  author_user_id: string;
  title: string;
  body: string;
  is_anonymous: boolean;
  anonymous_handle_id: string | null;
  like_count: number;
  comment_count: number;
  view_count: number;
  hot_score: number;
  status: PostStatus;
  created_at: Date;
  updated_at: Date;
}

// Comment Types
export type CommentStatus = 'active' | 'hidden' | 'deleted';

export interface Comment {
  id: string;
  post_id: string;
  author_user_id: string;
  body: string;
  is_anonymous: boolean;
  anonymous_handle_id: string | null;
  status: CommentStatus;
  created_at: Date;
  updated_at: Date;
}

// Report Types
export type ReportTargetType = 'post' | 'comment' | 'review' | 'user';
export type ReportReasonCode = 
  | 'spam' 
  | 'harassment' 
  | 'hate' 
  | 'sexual' 
  | 'privacy' 
  | 'illegal' 
  | 'other';
export type ReportStatus = 'open' | 'resolved' | 'rejected';

export interface Report {
  id: string;
  reporter_user_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason_code: ReportReasonCode;
  description: string | null;
  status: ReportStatus;
  created_at: Date;
  updated_at: Date;
}

// Course Types
export type CourseSource = 'manual' | 'api';

export interface Course {
  id: string;
  school: string;
  subject: string;
  catalog_number: string;
  title: string;
  credits_min: number;
  credits_max: number;
  term_tags: string[];
  source: CourseSource;
  created_at: Date;
  updated_at: Date;
}

// Review Types
export type ReviewStatus = 'active' | 'hidden' | 'deleted';

export interface Review {
  id: string;
  course_id: string;
  author_user_id: string;
  rating_overall: number; // 1-5
  difficulty: number; // 1-5
  workload: number; // 1-5
  exams: number; // 0-3
  attendance_required: boolean;
  text_body: string;
  status: ReviewStatus;
  created_at: Date;
  updated_at: Date;
}

// Schedule Types
export interface Schedule {
  id: string;
  user_id: string;
  name: string;
  total_credits_cached: number;
  created_at: Date;
  updated_at: Date;
}

export interface ScheduleItem {
  id: string;
  schedule_id: string;
  course_id: string | null;
  title: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_minute: number; // 0-1439
  end_minute: number; // 0-1439
  location: string | null;
  color: string | null;
  created_at: Date;
  updated_at: Date;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}
