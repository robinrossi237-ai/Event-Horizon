import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateBookingRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useBookings() {
  return useQuery({
    queryKey: [api.bookings.list.path],
    queryFn: async () => {
      const res = await fetch(api.bookings.list.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return api.bookings.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateBookingRequest) => {
      const res = await fetch(api.bookings.create.path, {
        method: api.bookings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create booking");
      }
      return api.bookings.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookings.list.path] });
      // Also refresh events so availability updates in UI
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      // If booking created for a specific event, refresh that event cache too
      try {
        // We don't have the created booking here, so just invalidate event detail caches broadly
        // Consumers should re-fetch accordingly.
      } catch (e) {}
      toast({
        title: "Booking Submitted",
        description: "Your booking is pending approval.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useApproveBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.bookings.approve.path, { id });
      const res = await fetch(url, {
        method: api.bookings.approve.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to approve booking");
      return api.bookings.approve.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookings.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      // Also notify listeners
      try { window.dispatchEvent(new CustomEvent('app:booking-updated')); } catch (e) {}
      toast({
        title: "Booking Approved",
        description: "The user has been notified.",
      });
    },
  });
}

export function useRejectBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.bookings.reject.path, { id });
      const res = await fetch(url, {
        method: api.bookings.reject.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to reject booking");
      return api.bookings.reject.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookings.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({
        title: "Booking Rejected",
        variant: "destructive",
      });
    },
  });
}
