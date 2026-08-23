import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { UpdatePaymentSettingsRequest } from "@shared/schema";

export function usePaymentSettings(enabled = true) {
  return useQuery({
    queryKey: [api.paymentSettings.get.path],
    enabled,
    queryFn: async () => {
      const res = await fetch(api.paymentSettings.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load payment settings");
      return api.paymentSettings.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdatePaymentSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: UpdatePaymentSettingsRequest) => {
      const res = await fetch(api.admin.paymentSettings.update.path, {
        method: api.admin.paymentSettings.update.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to update payment settings");
      }

      return api.admin.paymentSettings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.paymentSettings.get.path] });
      toast({
        title: "Payment numbers updated",
        description: "Booking instructions now use the new numbers.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
