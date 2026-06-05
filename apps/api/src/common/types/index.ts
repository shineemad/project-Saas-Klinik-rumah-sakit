export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN", // Platform-level admin (KlinikOS internal)
  OWNER = "OWNER", // Clinic owner / pemilik klinik
  DOCTOR = "DOCTOR", // Dokter
  NURSE = "NURSE", // Perawat
  RECEPTIONIST = "RECEPTIONIST", // Resepsionis / front-desk
  PHARMACIST = "PHARMACIST", // Apoteker
  CASHIER = "CASHIER", // Kasir
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  tenantId: string;
  sessionId: string;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export type SortOrder = "asc" | "desc";
