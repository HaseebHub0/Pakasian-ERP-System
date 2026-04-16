import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRawMaterials, createRawMaterial, updateRawMaterial } from "../api/masterData";
import type { RawMaterialParams, RawMaterial } from "../api/masterData";

export function useRawMaterials(params?: RawMaterialParams) {
  return useQuery({
    queryKey: ["raw-materials", params],
    queryFn: () => getRawMaterials(params),
  });
}

export function useCreateRawMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RawMaterial, "id">) => createRawMaterial(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
    },
  });
}

export function useUpdateRawMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RawMaterial> }) => updateRawMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
    },
  });
}
