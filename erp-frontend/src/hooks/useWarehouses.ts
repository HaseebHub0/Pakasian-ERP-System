import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWarehouses, createWarehouse, updateWarehouse } from "../api/masterData";
import type { WarehouseParams, Warehouse } from "../api/masterData";

export function useWarehouses(params?: WarehouseParams) {
  return useQuery({
    queryKey: ["warehouses", params],
    queryFn: () => getWarehouses(params),
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Warehouse, "id" | "bin_count">) => createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Warehouse> }) => updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}
