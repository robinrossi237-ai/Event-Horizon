import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertEvent, InsertTicket } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useEvents(search?: string, category?: string) {
  return useQuery({
    queryKey: [api.events.list.path, { search, category }],
    queryFn: async () => {
      let url = api.events.list.path;
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      return api.events.list.responses[200].parse(await res.json());
    },
  });
}

export function useEvent(id?: number) {
  return useQuery({
    queryKey: [api.events.get.path, id],
    queryFn: async () => {
      if (id == null) return null;
      const url = buildUrl(api.events.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch event");
      return api.events.get.responses[200].parse(await res.json());
    },
    enabled: id != null,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertEvent & { tickets: InsertTicket[] }) => {
      // API expects string for organizerId, but it comes from auth on backend
      // Just need to make sure frontend sends valid payload matching schema
      // The schema requires organizerId but backend might override it
      
      const res = await fetch(api.events.create.path, {
        method: api.events.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create event");
      }
      return api.events.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({
        title: "Event Created",
        description: "Your event is now live!",
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

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertEvent & { tickets?: InsertTicket[] } }) => {
      const url = `/api/events/${id}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        // Try to parse JSON error, fall back to text
        const errBody = await res.text().catch(() => "");
        try {
          const json = JSON.parse(errBody || "{}");
          throw new Error(json.message || "Failed to update event");
        } catch {
          throw new Error(errBody || "Failed to update event");
        }
      }

      // Successful response: attempt to parse JSON, otherwise return raw text
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return await res.json();
      }
      const text = await res.text().catch(() => "");
      // If server returned HTML (e.g., index.html), include it in the error for debugging
      if (text.trim().startsWith("<!")) {
        throw new Error("Server returned non-JSON response during update: " + text.slice(0, 200));
      }
      return text;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: [api.events.get.path, variables.id] });
      }
      toast({ title: "Event Updated", description: "Event changes saved." });
      try {
        // Emit a global event so any part of the app can react (or refresh)
        window.dispatchEvent(new CustomEvent("app:resource-updated", { detail: { id: variables?.id } }));
        // Force a full reload to ensure UI shows latest data (helps when client cache/state is stale)
        if (typeof window !== "undefined") window.location.reload();
      } catch (e) {
        // ignore in non-browser env
      }
    },
    onError: (error: any) => {
      // Dispatch a global error event with details for dev inspection
      try {
        window.dispatchEvent(new CustomEvent("app:api-error", { detail: { message: error.message } }));
      } catch (e) {}
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = `/api/events/${id}`;
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to delete event");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.events.get.path] });
      toast({ title: "Event Deleted", description: "The event was removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
