import { useQuery } from "@tanstack/react-query";
import { getSupplierMaterials, getPurchaseOrders } from "../api/procurement";

export function useSupplierMaterials(supplierId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ["supplier-materials", supplierId],
    queryFn: () => getSupplierMaterials(supplierId),
    enabled,
  });
}

export function useSupplierPurchaseOrders(supplierId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ["purchase-orders", { supplier_id: supplierId }],
    queryFn: () => getPurchaseOrders({ supplier_id: supplierId }),
    enabled,
  });
}
