export type UserRole = "ADMIN" | "SARPANCH" | "VILLAGER";

export type ComplaintStatus = "SUBMITTED" | "UNDER_PROCESS" | "RESOLVED" | "CLOSED";

export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH";

export type ComplaintCategory =
  | "WATER"
  | "ROAD"
  | "LAND"
  | "GOVERNMENT_SERVICES"
  | "SANITATION"
  | "FAMILY_ISSUES"
  | "STREET_LIGHTS"
  | "ELECTRICITY"
  | "ANIMAL"
  | "PUBLIC_SAFETY"
  | "OTHER";

export interface RegisterRequest {
  fullName: string;
  fathersName: string;
  mothersName: string;
  phone: string;
  pin: string;
  districtId: number;
  mandalId: number;
  gramPanchayatId: number;
}

export interface LoginRequest {
  phone: string;
  pin: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number;
    fullName: string;
    phone: string;
    role: UserRole;
    gramPanchayatId: number | null;
  };
}

export interface ComplaintResponse {
  id: number;
  complaintId: string;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  voiceUrl?: string;
  imageUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  id: number;
  phone: string;
  role: UserRole;
  gramPanchayatId: number | null;
}

export interface ErrorResponse {
  success: false;
  error: string;
  statusCode: number;
}

export interface SuccessResponse<T> {
  success: true;
  message?: string;
  data?: T;
  total?: number;
}
