export interface AdminUser {
  id: string;
  email: string;
  role: 'superadmin' | 'moderator';
  must_change_password: boolean;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  admin: AdminUser;
}

export interface ApiError {
  error: string;
}
