import { useQuery } from "@tanstack/react-query";
import { getInventorySummary } from "../api/inventory";

export function useInventorySummary(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["inventory-summary", params],
    queryFn: () => getInventorySummary(params),
  });
}
