import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as authDAL from "@/DAL/auth";
import { useAuthStore } from "@/store/useAuthStore";
import type { LoginRequest, RegisterRequest, UpdateProfileRequest, CreateAddressRequest, UpdateAddressRequest } from "@/types/authTypes";

// ── Identity ────────────────────────────────────────────────────────

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authDAL.register(data).then((r) => r.data),
    onSuccess: () => toast.success("Compte créé ! Vérifiez votre email."),
    onError: () => toast.error("Erreur lors de l'inscription"),
  });
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const loginRes = await authDAL.login(data).then((r) => r.data);
      setSession({
        accessToken: loginRes.access_token,
        refreshToken: loginRes.refresh_token,
        userId: null,
        role: null,
      });
      try {
        const profile = await authDAL.getProfile().then((r) => r.data);
        setSession({
          accessToken: loginRes.access_token,
          refreshToken: loginRes.refresh_token,
          userId: profile.id,
          role: profile.role,
        });
        return { ...loginRes, role: profile.role };
      } catch {
        return { ...loginRes, role: null as "client" | "admin" | null };
      }
    },
    onSuccess: () => toast.success("Connexion réussie"),
    onError: () => toast.error("Email ou mot de passe incorrect"),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (newPassword: string) => authDAL.changePassword({ new_password: newPassword }),
    onSuccess: () => toast.success("Mot de passe modifie"),
    onError: () => toast.error("Erreur lors du changement de mot de passe"),
  });
}

export function useLogout() {
  const { refreshToken, clear } = useAuthStore();
  return useMutation({
    mutationFn: () => authDAL.logout(refreshToken ?? ""),
    onSettled: () => {
      clear();
      toast.success("Déconnecté");
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authDAL.forgotPassword({ email }),
    onSuccess: () => toast.success("Si un compte existe, un email de réinitialisation a été envoyé."),
  });
}

export function useSocialLoginURL(provider: string, redirectUri: string) {
  return useQuery({
    queryKey: ["social-login-url", provider],
    queryFn: () => authDAL.getSocialLoginURL(provider, redirectUri).then((r) => r.data),
    enabled: false,
  });
}

// ── Profile ─────────────────────────────────────────────────────────

export function useProfile() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => authDAL.getProfile().then((r) => r.data),
    enabled: !!accessToken,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => authDAL.updateProfile(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profil mis à jour");
    },
  });
}

// ── Addresses ───────────────────────────────────────────────────────

export function useAddresses() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["addresses"],
    queryFn: () => authDAL.listAddresses().then((r) => r.data.addresses),
    enabled: !!accessToken,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAddressRequest) => authDAL.createAddress(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Adresse ajoutée");
    },
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAddressRequest }) =>
      authDAL.updateAddress(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Adresse modifiée");
    },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authDAL.deleteAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Adresse supprimée");
    },
  });
}
