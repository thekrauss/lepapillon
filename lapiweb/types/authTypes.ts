// Maps to: identity/types + auth/types Go DTOs

// ── Identity (Keycloak) ─────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
}

export interface RegisterResponse {
  keycloak_user_id: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  new_password: string;
}

export interface SocialLoginURLResponse {
  url: string;
  provider: string;
}

export interface SocialCallbackRequest {
  code: string;
  state?: string;
  redirect_uri: string;
}

// ── Profile ─────────────────────────────────────────────────────────

export interface ProfileResponse {
  id: string;
  keycloak_user_id?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: "client" | "admin";
  addresses: AddressResponse[];
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

// ── Address ─────────────────────────────────────────────────────────

export interface AddressResponse {
  id: string;
  label: string;
  street: string;
  city: string;
  postal_code: string;
  is_default: boolean;
}

export interface CreateAddressRequest {
  label?: string;
  street: string;
  city: string;
  postal_code: string;
  is_default?: boolean;
}

export interface UpdateAddressRequest {
  label?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  is_default?: boolean;
}
