import { authClient } from "@/lib/axios-instance";
import type {
  RegisterRequest, RegisterResponse, LoginRequest, LoginResponse,
  RefreshTokenRequest, ForgotPasswordRequest, ChangePasswordRequest,
  SocialLoginURLResponse, SocialCallbackRequest,
  ProfileResponse, UpdateProfileRequest,
  AddressResponse, CreateAddressRequest, UpdateAddressRequest,
} from "@/types/authTypes";

// ── Identity (Keycloak) ─────────────────────────────────────────────

export const register = (data: RegisterRequest) =>
  authClient.post<RegisterResponse>("/identity/register", data);

export const login = (data: LoginRequest) =>
  authClient.post<LoginResponse>("/identity/login", data);

export const refreshToken = (data: RefreshTokenRequest) =>
  authClient.post<LoginResponse>("/identity/refresh", data);

export const logout = (refreshToken: string) =>
  authClient.post("/identity/logout", { refresh_token: refreshToken });

export const forgotPassword = (data: ForgotPasswordRequest) =>
  authClient.post("/identity/forgot-password", data);

export const changePassword = (data: ChangePasswordRequest) =>
  authClient.post("/identity/change-password", data);

export const getSocialLoginURL = (provider: string, redirectUri: string) =>
  authClient.get<SocialLoginURLResponse>(`/identity/social/${provider}`, {
    params: { redirect_uri: redirectUri },
  });

export const socialCallback = (data: SocialCallbackRequest) =>
  authClient.post<LoginResponse>("/identity/social/callback", data);

export const resendVerificationEmail = () =>
  authClient.post("/identity/verify-email/resend");

// ── Profile ─────────────────────────────────────────────────────────

export const getProfile = () =>
  authClient.get<ProfileResponse>("/auth/profile");

export const updateProfile = (data: UpdateProfileRequest) =>
  authClient.put<ProfileResponse>("/auth/profile", data);

// ── Addresses ───────────────────────────────────────────────────────

export const listAddresses = () =>
  authClient.get<{ addresses: AddressResponse[] }>("/auth/addresses");

export const createAddress = (data: CreateAddressRequest) =>
  authClient.post<AddressResponse>("/auth/addresses", data);

export const updateAddress = (id: string, data: UpdateAddressRequest) =>
  authClient.put<AddressResponse>(`/auth/addresses/${id}`, data);

export const deleteAddress = (id: string) =>
  authClient.delete(`/auth/addresses/${id}`);
