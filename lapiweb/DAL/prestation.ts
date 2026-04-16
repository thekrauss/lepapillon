import { authClient } from "@/lib/axios-instance";
import type { SlotResponse, BookingResponse, PrestationPricing } from "@/types/prestationTypes";

export const listAvailableSlots = () =>
  authClient.get<SlotResponse[]>("/prestations/slots");

export const getPrestationPricing = () =>
  authClient.get<PrestationPricing>("/prestations/pricing");

export const listUserBookings = () =>
  authClient.get<BookingResponse[]>("/prestations/bookings");

export const getBooking = (bookingId: string) =>
  authClient.get<BookingResponse>(`/prestations/bookings/${bookingId}`);
