import { useQuery } from "@tanstack/react-query";
import * as prestationDAL from "@/DAL/prestation";
import { useAuthStore } from "@/store/useAuthStore";

export function useAvailableSlots() {
  return useQuery({
    queryKey: ["prestation-slots"],
    queryFn: () => prestationDAL.listAvailableSlots().then((r) => r.data),
  });
}

export function usePrestationPricing() {
  return useQuery({
    queryKey: ["prestation-pricing"],
    queryFn: () => prestationDAL.getPrestationPricing().then((r) => r.data),
  });
}

export function useUserBookings() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["user-bookings"],
    queryFn: () => prestationDAL.listUserBookings().then((r) => r.data),
    enabled: !!accessToken,
  });
}

export function useBooking(bookingId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => prestationDAL.getBooking(bookingId).then((r) => r.data),
    enabled: !!accessToken && !!bookingId,
  });
}
