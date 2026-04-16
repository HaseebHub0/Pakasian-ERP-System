import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import {
  Search, Plus, Pencil, ToggleLeft, ToggleRight,
  Loader2, X, ChevronLeft, ChevronRight,
  Warehouse as WarehouseIcon, MapPin, Box,
} from "lucide-react";
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse } from "../../hooks/useWarehouses";
import type { Warehouse } from "../../api/masterData";

// ─── Zod validation schema ────────────────────────────────────────────────────
const warehouseSchema = z.object({
  warehouse_name: z.string().min(1, "Name is required"),
  warehouse_type: z.enum(["Factory", "Regional", "City", "Retail"]),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  country: z.string().default("Pakistan"),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

const TYPE_COLORS: Record<string, string> = {
  Factory:  "bg-violet-100 text-violet-800",
  Regional: "bg-blue-100 text-blue-800",
  City:     "bg-emerald-100 text-emerald-800",
  Retail:   "bg-amber-100 text-amber-800",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WarehousesPage() {
  const [params, setParams] = useState({
    search: "",
    status: "",
    warehouse_type: "",
    page: 1,
    page_size: 20,
  });
  const [searchInput, setSearchInput] = useState("");
  const { data, isLoading } = useWarehouses(params);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setParams((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }));
  };

  const openAddModal = () => {
    setEditingWarehouse(null);
    setIsModalOpen(true);
  };

  const openEditModal = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWarehouse(null);
  };

  const updateMutation = useUpdateWarehouse();

  const handleToggleStatus = (wh: Warehouse) => {
    const newStatus = wh.status === "active" ? "inactive" : "active";
    updateMutation.mutate(
      { id: wh.id, data: { status: newStatus } },
      {
        onSuccess: () => toast.success(`Warehouse marked as ${newStatus}`),
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  // Stats
  const totalCount  = data?.count ?? 0;
  const activeCount = data?.results?.filter((w) => w.status === "active").length ?? 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage storage locations, warehouse types and capacities
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={16} /> Add Warehouse
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatTile label="Total Warehouses" value={totalCount} color="text-indigo-600" />
        <StatTile label="Active" value={activeCount} color="text-emerald-600" />
        <StatTile label="Inactive" value={totalCount - activeCount} color="text-gray-500" />
        <StatTile
          label="Showing"
          value={`Page ${params.page}`}
          color="text-blue-500"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-1/3 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or city..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={params.status}
          onChange={(e) => setParams((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
          className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={params.warehouse_type}
          onChange={(e) =>
            setParams((prev) => ({ ...prev, warehouse_type: e.target.value, page: 1 }))
          }
          className="w-full sm:w-44 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
        >
          <option value="">All Types</option>
          <option value="Factory">Factory</option>
          <option value="Regional">Regional</option>
          <option value="City">City</option>
          <option value="Retail">Retail</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Warehouse Name</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Type</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Location</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Country</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Bins</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                /* Loading skeleton */
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.results?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <WarehouseIcon className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="text-gray-500 font-medium">No warehouses found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Add your first warehouse to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                data?.results?.map((wh: Warehouse) => (
                  <tr key={wh.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <WarehouseIcon size={16} className="text-indigo-400 shrink-0" />
                        {wh.warehouse_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          TYPE_COLORS[wh.warehouse_type] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {wh.warehouse_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={13} className="text-gray-400 shrink-0" />
                        {wh.city}, {wh.province}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{wh.country}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Box size={13} className="text-gray-400 shrink-0" />
                        {wh.bin_count ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          wh.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {wh.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(wh)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(wh)}
                          disabled={updateMutation.isPending}
                          className={`${
                            wh.status === "active" ? "text-red-500" : "text-green-500"
                          } hover:opacity-80 transition disabled:opacity-40`}
                          title={wh.status === "active" ? "Deactivate" : "Activate"}
                        >
                          {wh.status === "active" ? (
                            <ToggleRight size={20} />
                          ) : (
                            <ToggleLeft size={20} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.count > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Showing {(params.page - 1) * params.page_size + 1}–
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

      {/* Modal */}
      {isModalOpen && (
        <WarehouseModal
          isOpen={isModalOpen}
          onClose={closeModal}
          initialData={editingWarehouse}
        />
      )}
    </div>
  );
}

// ─── Mini stat tile ───────────────────────────────────────────────────────────
function StatTile({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function WarehouseModal({
  isOpen,
  onClose,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: Warehouse | null;
}) {
  const isEditing = !!initialData;
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: initialData
      ? {
          warehouse_name: initialData.warehouse_name,
          warehouse_type: initialData.warehouse_type as WarehouseFormValues["warehouse_type"],
          city: initialData.city,
          province: initialData.province,
          country: initialData.country,
          latitude: initialData.latitude ?? undefined,
          longitude: initialData.longitude ?? undefined,
          status: initialData.status,
        }
      : {
          country: "Pakistan",
          warehouse_type: "Factory",
          status: "active",
        },
  });

  const onSubmit = async (values: WarehouseFormValues) => {
    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: values });
        toast.success("Warehouse updated successfully");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Warehouse created successfully");
      }
      onClose();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to save warehouse.";
      toast.error(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? "Edit Warehouse" : "Add Warehouse"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Section header */}
            <div className="sm:col-span-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              Basic Information
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse Name *
              </label>
              <input
                {...register("warehouse_name")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="e.g. Karachi Central Depot"
              />
              {errors.warehouse_name && (
                <p className="text-red-500 text-xs mt-1.5">{errors.warehouse_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse Type *
              </label>
              <select
                {...register("warehouse_type")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="Factory">Factory</option>
                <option value="Regional">Regional</option>
                <option value="City">City</option>
                <option value="Retail">Retail</option>
              </select>
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

            {/* Section header */}
            <div className="sm:col-span-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mt-2">
              Location
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                {...register("city")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="e.g. Karachi"
              />
              {errors.city && (
                <p className="text-red-500 text-xs mt-1.5">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
              <input
                {...register("province")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="e.g. Sindh"
              />
              {errors.province && (
                <p className="text-red-500 text-xs mt-1.5">{errors.province.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                {...register("country")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            {/* Section header */}
            <div className="sm:col-span-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mt-2">
              GPS Coordinates <span className="font-normal text-gray-400">(optional)</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="number"
                step="0.000001"
                {...register("latitude")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="e.g. 24.8607"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="number"
                step="0.000001"
                {...register("longitude")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="e.g. 67.0099"
              />
            </div>
          </div>

          {/* Footer */}
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
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isEditing ? "Update Warehouse" : "Save Warehouse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
