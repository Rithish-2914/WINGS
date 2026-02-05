import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertVisit, type Visit } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function useVisits(params?: { userId?: number; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: [api.visits.list.path, params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.userId) queryParams.append("userId", String(params.userId));
      if (params?.startDate) queryParams.append("startDate", params.startDate);
      if (params?.endDate) queryParams.append("endDate", params.endDate);
      
      const url = `${api.visits.list.path}?${queryParams.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch visits");
      return api.visits.list.responses[200].parse(await res.json());
    },
  });
}

export function useVisit(id: number) {
  return useQuery({
    queryKey: [api.visits.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.visits.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch visit details");
      return api.visits.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data: InsertVisit) => {
      const res = await fetch(api.visits.create.path, {
        method: api.visits.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.visits.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create visit");
      }
      return api.visits.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.visits.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-stats"] }); // Ensure stats refresh
      toast({
        title: "Visit Logged Successfully",
        description: "Your field visit has been recorded.",
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Submission Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUploadPhoto() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(api.upload.create.path, {
        method: api.upload.create.method,
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to upload photo");
      return await res.json() as { url: string };
    },
  });
}
