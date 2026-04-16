import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Search, Plus, Pencil, Loader2, X, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { useRawMaterials, useCreateRawMaterial, useUpdateRawMaterial } from "../../hooks/useRawMaterials";
import { useInventorySummary } from "../../hooks/useInventory";
import type { RawMaterial } from "../../api/masterData";

const rawMaterialSchema = z.object({
  material_code: z.string().min(1, "Material Code is required"),
  material_name: z.string().min(1, "Material Name is required"),
  material_type: z.enum(["ingredient", "oil", "spice", "packaging", "additive"]).default("ingredient"),
  unit_of_measure: z.string().min(1, "Unit of measure is required"),
  density: z.coerce.number().nullable().optional(),
  standard_cost: z.coerce.number().min(0, "Must be positive number").default(0),
  safety_stock: z.coerce.number().min(0, "Must be positive number").default(0),
  reorder_level: z.coerce.number().min(0, "Must be positive number").default(0),
  shelf_life_days: z.coerce.number().nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active").optional(),
});

type RawMaterialFormValues = z.infer<typeof rawMaterialSchema>;

const TYPE_COLORS: Record<string, string> = {
  ingredient: "bg-blue-100 text-blue-800",
  oil: "bg-yellow-100 text-yellow-800",
  spice: "bg-red-100 text-red-800",
  packaging: "bg-purple-100 text-purple-800",
  additive: "bg-pink-100 text-pink-800",
};

export default function RawMaterialsPage() {
  const [params, setParams] = useState({ search: "", page: 1, page_size: 20 });
  const [searchInput, setSearchInput] = useState("");
  
  const { data, isLoading } = useRawMaterials(params);
  
  // Fetch inventory summary for current stock mapping
  const { data: inventoryData, isLoading: invLoading } = useInventorySummary({ item_type: "material", page_size: 1000 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setParams((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const handlePageChange = (newPage: number) => {
    setParams({ ...params, page: newPage });
  };

  const openAddModal = () => {
    setEditingMaterial(null);
    setIsModalOpen(true);
  };

  const openEditModal = (material: RawMaterial) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMaterial(null);
  };

  const updateMutation = useUpdateRawMaterial();

  const handleToggleStatus = (material: RawMaterial) => {
    const newStatus = material.status === "active" ? "inactive" : "active";
    updateMutation.mutate(
      { id: material.id, data: { status: newStatus } },
      {
        onSuccess: () => toast.success(`Material marked as ${newStatus}`),
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  // Map inventory data to materials
  const inventoryMap = useMemo(() => {
    const map = new Map<string | number, number>();
    const items = inventoryData?.results || inventoryData || [];
    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        // Handle various potential structures from API
        if (item.item_code) map.set(item.item_code, item.current_stock || item.quantity_on_hand || item.total_stock || 0);
        if (item.item_id) map.set(item.item_id, item.current_stock || item.quantity_on_hand || item.total_stock || 0);
      });
    }
    return map;
  }, [inventoryData]);

  // Compute alerts
  const materialsBelowReorder = useMemo(() => {
    if (!data?.results) return 0;
    return data.results.filter(mat => {
      const currentStock = inventoryMap.get(mat.material_code) ?? inventoryMap.get(mat.id) ?? 0;
      const reorderLevel = mat.reorder_level || 0;
      return currentStock < reorderLevel && mat.status !== 'inactive';
    }).length;
  }, [data?.results, inventoryMap]);

  return (
    <div className="p-6">
      {/* Alert Banner */}
      {materialsBelowReorder > 0 && (
        <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-md shadow-sm flex items-start animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="text-orange-500 mr-3 mt-0.5" size={20} />
          <div>
            <h3 className="text-orange-800 font-medium">Low Stock Alert</h3>
            <p className="text-sm text-orange-700 mt-1">
              <span className="font-bold">{materialsBelowReorder}</span> materials are below reorder level — purchase requisitions may be needed.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Raw Materials</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={16} /> Add Material
        </button>
      </div>

      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-6 flex items-center">
        <div className="relative w-full sm:w-1/3 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search materials by code or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Code</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Name</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Type</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Unit</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Standard Cost</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Safety Stock</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Reorder Level</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Current Stock</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading || invLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    <Loader2 className="animate-spin inline mr-2" size={24} /> Loading materials...
                  </td>
                </tr>
              ) : data?.results?.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    No raw materials found.
                  </td>
                </tr>
              ) : (
                data?.results?.map((mat: RawMaterial) => {
                  const currentStock = inventoryMap.get(mat.material_code) ?? inventoryMap.get(mat.id) ?? 0;
                  const safetyLevel = mat.safety_stock || 0;
                  const reorderLevel = mat.reorder_level || 0;
                  
                  // Compute Stock Color
                  let stockColor = "bg-gray-100 text-gray-800 border-gray-200";
                  if (mat.status === 'active') {
                     if (currentStock < reorderLevel) {
                       stockColor = "bg-red-50 text-red-700 font-bold border-red-200";
                     } else if (currentStock < safetyLevel) {
                       stockColor = "bg-orange-50 text-orange-700 font-bold border-orange-200";
                     } else {
                       stockColor = "bg-emerald-50 text-emerald-700 font-medium border-emerald-200";
                     }
                  }

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 border-b border-gray-100">{mat.material_code}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-100">{mat.material_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 border-b border-gray-100">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${TYPE_COLORS[mat.material_type] || "bg-gray-100 text-gray-800"}`}>
                          {mat.material_type.charAt(0).toUpperCase() + mat.material_type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 border-b border-gray-100">{mat.unit_of_measure}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 border-b border-gray-100">
                        ${Number(mat.standard_cost || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 border-b border-gray-100">{mat.safety_stock || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 border-b border-gray-100">{mat.reorder_level || 0}</td>
                      <td className="px-6 py-4 text-sm border-b border-gray-100">
                        <div className={`px-3 py-1.5 rounded-md border text-center ${stockColor}`}>
                          {currentStock.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm border-b border-gray-100">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            mat.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {mat.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openEditModal(mat)}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(mat)}
                            className={`${
                              mat.status === "active" ? "text-red-500" : "text-green-500"
                            } hover:opacity-80 transition`}
                            title={mat.status === "active" ? "Deactivate" : "Activate"}
                          >
                            {mat.status === "active" ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.count > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Showing {(params.page - 1) * params.page_size + 1} to{" "}
              {Math.min(params.page * params.page_size, data.count)} of {data.count} results
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={!data.previous}
                onClick={() => handlePageChange(params.page - 1)}
                className="p-1 rounded-md border text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium px-2">{params.page}</span>
              <button
                disabled={!data.next}
                onClick={() => handlePageChange(params.page + 1)}
                className="p-1 rounded-md border text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <RawMaterialModal
          isOpen={isModalOpen}
          onClose={closeModal}
          initialData={editingMaterial}
        />
      )}
    </div>
  );
}

function RawMaterialModal({
  isOpen,
  onClose,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: RawMaterial | null;
}) {
  const isEditing = !!initialData;
  const createMutation = useCreateRawMaterial();
  const updateMutation = useUpdateRawMaterial();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RawMaterialFormValues>({
    resolver: zodResolver(rawMaterialSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          density: initialData.density ?? undefined,
          standard_cost: initialData.standard_cost ?? 0,
          safety_stock: initialData.safety_stock ?? 0,
          reorder_level: initialData.reorder_level ?? 0,
          shelf_life_days: initialData.shelf_life_days ?? undefined,
          material_type: initialData.material_type as any, // type casting map
        }
      : {
          status: "active" as const,
          material_type: "ingredient",
          standard_cost: 0,
          safety_stock: 0,
          reorder_level: 0,
        },
  });

  const onSubmit = async (values: RawMaterialFormValues) => {
    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: values });
        toast.success("Raw Material updated successfully");
      } else {
        await createMutation.mutateAsync(values as any);
        toast.success("Raw Material created successfully");
      }
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save raw material.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{isEditing ? "Edit Raw Material" : "Add Raw Material"}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
               Basic Details
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material Code *</label>
              <input
                {...register("material_code")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="Ex: RM-101"
              />
              {errors.material_code && <p className="text-red-500 text-xs mt-1.5">{errors.material_code.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
              <input
                {...register("material_name")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="Ex: Palm Oil"
              />
              {errors.material_name && <p className="text-red-500 text-xs mt-1.5">{errors.material_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
              <select
                {...register("material_type")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="ingredient">Ingredient</option>
                <option value="oil">Oil</option>
                <option value="spice">Spice</option>
                <option value="packaging">Packaging</option>
                <option value="additive">Additive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure *</label>
              <input
                {...register("unit_of_measure")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="kg, liters, pcs..."
              />
              {errors.unit_of_measure && <p className="text-red-500 text-xs mt-1.5">{errors.unit_of_measure.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Density</label>
              <input
                type="number"
                step="0.001"
                {...register("density")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="e.g., 0.92"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard Cost</label>
              <input
                type="number"
                step="0.01"
                {...register("standard_cost")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="0.00"
              />
              {errors.standard_cost && <p className="text-red-500 text-xs mt-1.5">{errors.standard_cost.message}</p>}
            </div>

            <div className="sm:col-span-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mt-2">
               Inventory & Limits
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Safety Stock</label>
              <input
                type="number"
                {...register("safety_stock")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              {errors.safety_stock && <p className="text-red-500 text-xs mt-1.5">{errors.safety_stock.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
              <input
                type="number"
                {...register("reorder_level")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              {errors.reorder_level && <p className="text-red-500 text-xs mt-1.5">{errors.reorder_level.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Life (Days)</label>
              <input
                type="number"
                {...register("shelf_life_days")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                {...register("status")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm flex items-center shadow-blue-500/20"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
              {isEditing ? "Update Material" : "Save Material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
