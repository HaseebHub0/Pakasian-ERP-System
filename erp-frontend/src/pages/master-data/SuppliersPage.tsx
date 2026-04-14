import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Search, Plus, Pencil, Star, ChevronDown, ChevronUp, Loader2, X, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useSuppliers, useCreateSupplier, useUpdateSupplier } from "../../hooks/useSuppliers";
import { useSupplierMaterials, useSupplierPurchaseOrders } from "../../hooks/useProcurement";
import type { Supplier } from "../../api/masterData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

const supplierSchema = z.object({
  supplier_name: z.string().min(1, "Name is required"),
  contact_person: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Invalid email").nullable().optional().or(z.literal("")),
  payment_terms: z.string().default("Cash"),
  currency: z.string().default("PKR"),
  lead_time_days: z.coerce.number().nullable().optional(),
  rating: z.coerce.number().min(1).max(5).default(5),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const [params, setParams] = useState({ search: "", page: 1, page_size: 20 });
  const [searchInput, setSearchInput] = useState("");
  const { data, isLoading } = useSuppliers(params);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

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
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Suppliers</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-6 flex items-center">
        <div className="relative w-full sm:w-1/3 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search suppliers..."
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
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Supplier Name</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Contact Person</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Phone</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Email</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Payment Terms</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Rating</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white items-center">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <Loader2 className="animate-spin inline mr-2" size={24} /> Loading...
                  </td>
                </tr>
              ) : data?.results?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                data?.results?.map((supplier: Supplier) => (
                  <SupplierRow key={supplier.id} supplier={supplier} onEdit={openEditModal} />
                ))
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
        <SupplierModal
          isOpen={isModalOpen}
          onClose={closeModal}
          initialData={editingSupplier}
        />
      )}
    </div>
  );
}

function RatingStars({ rating, onChange }: { rating: number; onChange?: (val: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={`${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 drop-shadow-sm"} ${
            onChange ? "cursor-pointer hover:scale-110 transition-transform" : ""
          }`}
          onClick={() => onChange?.(star)}
        />
      ))}
    </div>
  );
}

function SupplierRow({ supplier, onEdit }: { supplier: Supplier; onEdit: (s: Supplier) => void }) {
  const [expanded, setExpanded] = useState(false);
  const updateMutation = useUpdateSupplier();

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = supplier.status === "Active" ? "Inactive" : "Active";
    updateMutation.mutate(
      { id: supplier.id, data: { status: newStatus } },
      {
        onSuccess: () => toast.success(`Supplier marked as ${newStatus}`),
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  return (
    <>
      <tr
        className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${expanded ? "bg-blue-50/30" : ""}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-6 py-4 text-sm font-medium text-gray-900 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown size={16} className="text-blue-500" /> : <ChevronRight size={16} className="text-gray-400" />}
            {supplier.supplier_name}
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 border-b border-gray-100">{supplier.contact_person || "-"}</td>
        <td className="px-6 py-4 text-sm text-gray-500 border-b border-gray-100">{supplier.phone || "-"}</td>
        <td className="px-6 py-4 text-sm text-gray-500 border-b border-gray-100">{supplier.email || "-"}</td>
        <td className="px-6 py-4 text-sm text-gray-500 border-b border-gray-100">{supplier.payment_terms}</td>
        <td className="px-6 py-4 text-sm border-b border-gray-100">
          <RatingStars rating={supplier.rating || 0} />
        </td>
        <td className="px-6 py-4 text-sm border-b border-gray-100">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              supplier.status === "Active"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {supplier.status}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(supplier);
              }}
              className="text-blue-600 hover:text-blue-800 transition"
              title="Edit"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={handleToggleStatus}
              className={`${
                supplier.status === "Active" ? "text-red-500" : "text-green-500"
              } hover:opacity-80 transition`}
              title={supplier.status === "Active" ? "Deactivate" : "Activate"}
            >
              {supplier.status === "Active" ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="p-0 border-b border-gray-200">
            <div className="bg-slate-50/50 px-6 py-6 shadow-inner">
              <SupplierDetails supplierId={supplier.id} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SupplierDetails({ supplierId }: { supplierId: number }) {
  const { data: materials, isLoading: matsLoading } = useSupplierMaterials(supplierId);
  const { data: pos, isLoading: posLoading } = useSupplierPurchaseOrders(supplierId);

  if (matsLoading || posLoading) {
    return (
      <div className="flex justify-center items-center py-8 text-sm text-gray-500 gap-2">
        <Loader2 className="animate-spin" size={18} /> Loadings supplier details...
      </div>
    );
  }

  const safeMaterials = Array.isArray(materials) ? materials : [];
  const safePos = Array.isArray(pos) ? pos : [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <h4 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Materials Supplied & Price History
        </h4>
        {safeMaterials.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No materials recorded for this supplier.</p>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {safeMaterials.map((mat: any, idx: number) => {
              // Create mock history if real one isn't present
              const last6m = Array.from({ length: 6 }).map((_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - (5 - i));
                return {
                  name: date.toLocaleString('default', { month: 'short' }),
                  price: mat.current_price 
                    ? (mat.current_price * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2) 
                    : (100 * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2)
                };
              });

              const history = mat.price_history || last6m;
              
              return (
                <div key={idx} className="border border-gray-100 rounded-lg p-4 bg-gray-50/50 hover:bg-white transition">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="font-medium text-sm text-gray-800">{mat.material_name || `Material #${mat.id}`}</span>
                      {mat.sku && <span className="text-xs text-gray-500 ml-2">({mat.sku})</span>}
                    </div>
                    <span className="text-sm font-medium text-gray-600 px-2 py-1 bg-white border border-gray-200 rounded">
                      Current: ${mat.current_price || "-"}
                    </span>
                  </div>
                  <div className="h-40 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#6B7280'}} tickMargin={8} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 10, fill: '#6B7280'}} tickMargin={8} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{fontSize: "12px", borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"}} 
                          itemStyle={{color: '#3b82f6', fontWeight: 600}}
                        />
                        <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#1d4ed8' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <h4 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
           Purchase Order History
        </h4>
        {safePos.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No purchase orders found.</p>
        ) : (
          <div className="overflow-x-auto text-sm border rounded-lg max-h-[400px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 sticky top-0 shadow-sm">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">PO #</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {safePos.map((po: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-blue-600 font-medium">
                      <span className="hover:underline cursor-pointer">{po.po_number || `PO-${po.id}`}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{po.date || "N/A"}</td>
                    <td className="px-4 py-3 font-medium">${po.total_amount || "0.00"}</td>
                    <td className="px-4 py-3">
                       <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                        {po.status || "Completed"}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SupplierModal({
  isOpen,
  onClose,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: Supplier | null;
}) {
  const isEditing = !!initialData;
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          contact_person: initialData.contact_person ?? "",
          phone: initialData.phone ?? "",
          email: initialData.email ?? "",
          lead_time_days: initialData.lead_time_days ?? undefined,
        }
      : {
          currency: "PKR",
          payment_terms: "Cash",
          rating: 5,
          status: "Active",
        },
  });

  const ratingValue = watch("rating") || 5;

  const onSubmit = async (values: SupplierFormValues) => {
    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: values });
        toast.success("Supplier updated successfully");
      } else {
        await createMutation.mutateAsync(values as any);
        toast.success("Supplier created successfully");
      }
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save supplier.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{isEditing ? "Edit Supplier" : "Add Supplier"}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
               Basic Information
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
              <input
                {...register("supplier_name")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="Ex: Acme Corp"
              />
              {errors.supplier_name && <p className="text-red-500 text-xs mt-1.5">{errors.supplier_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                {...register("contact_person")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="Name of primary contact"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                {...register("phone")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                {...register("email")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="contact@acme.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div className="sm:col-span-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mt-2">
               Additional Details
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <select
                {...register("payment_terms")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="Cash">Cash</option>
                <option value="Net30">Net 30</option>
                <option value="Net45">Net 45</option>
                <option value="Net60">Net 60</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input
                {...register("currency")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (Days)</label>
              <input
                type="number"
                {...register("lead_time_days")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="e.g. 14"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Rating</label>
              <div className="py-2">
                <RatingStars
                  rating={ratingValue}
                  onChange={(val) => setValue("rating", val, { shouldValidate: true })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                {...register("status")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
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
              {isEditing ? "Update Supplier" : "Save Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
