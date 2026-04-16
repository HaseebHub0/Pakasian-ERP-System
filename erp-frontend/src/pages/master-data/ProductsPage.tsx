import React, { useState, useEffect } from "react";
import { useProducts, useCreateProduct, useUpdateProduct, useCategories } from "../../hooks/useProducts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Search, Plus, Pencil, ToggleLeft, ToggleRight, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "../../api/masterData";

const productSchema = z.object({
  sku_code: z.string().min(1, "SKU Code is required"),
  product_name: z.string().min(1, "Product Name is required"),
  brand: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  pack_size: z.string().nullable().optional(),
  net_weight: z.coerce.number().nullable().optional(),
  gross_weight: z.coerce.number().nullable().optional(),
  barcode: z.string().nullable().optional(),
  shelf_life_days: z.coerce.number().nullable().optional(),
  standard_cost: z.coerce.number().min(0, "Must be positive number"),
  status: z.enum(["active", "inactive"]).default("active"),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const [params, setParams] = useState({ search: "", status: "", page: 1, page_size: 20 });
  const [searchInput, setSearchInput] = useState("");
  const { data, isLoading } = useProducts(params);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setParams((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParams({ ...params, status: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setParams({ ...params, page: newPage });
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const updateProductMutation = useUpdateProduct();

  const handleToggleStatus = (product: Product) => {
    const newStatus = product.status === "active" ? "inactive" : "active";
    updateProductMutation.mutate(
      { id: product.id, data: { status: newStatus } },
      {
        onSuccess: () => toast.success(`Product marked as ${newStatus}`),
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-1/3 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, SKU, or barcode..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={params.status}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">SKU Code</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Product Name</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Brand</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Pack Size</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Net Weight</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Standard Cost</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <Loader2 className="animate-spin inline mr-2" size={24} /> Loading...
                  </td>
                </tr>
              ) : data?.results?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                data?.results?.map((product: Product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{product.sku_code}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.product_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.brand || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.pack_size || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.net_weight || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">${product.standard_cost}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(product)}
                          className={`${
                            product.status === "active" ? "text-red-500" : "text-green-500"
                          } hover:opacity-80`}
                          title={product.status === "active" ? "Deactivate" : "Activate"}
                        >
                          {product.status === "active" ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
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
              Showing {(params.page - 1) * params.page_size + 1} to{" "}
              {Math.min(params.page * params.page_size, data.count)} of {data.count} results
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={!data.previous}
                onClick={() => handlePageChange(params.page - 1)}
                className="p-1 rounded-md border text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium px-2">{params.page}</span>
              <button
                disabled={!data.next}
                onClick={() => handlePageChange(params.page + 1)}
                className="p-1 rounded-md border text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={closeModal}
          initialData={editingProduct}
        />
      )}
    </div>
  );
}

function ProductModal({
  isOpen,
  onClose,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: Product | null;
}) {
  const { data: categoriesData } = useCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          category_id: initialData.category_id ?? undefined,
          net_weight: initialData.net_weight ?? undefined,
          gross_weight: initialData.gross_weight ?? undefined,
          shelf_life_days: initialData.shelf_life_days ?? undefined,
          brand: initialData.brand ?? "",
          pack_size: initialData.pack_size ?? "",
          barcode: initialData.barcode ?? "",
        }
      : {
          sku_code: "",
          product_name: "",
          status: "active" as const,
          standard_cost: 0,
        },
  });

  const onSubmit = async (values: ProductFormValues) => {
    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: values });
        toast.success("Product updated");
      } else {
        await createMutation.mutateAsync(values as Omit<Product, "id">);
        toast.success("Product created");
      }
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold">{isEditing ? "Edit Product" : "Add Product"}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU Code *</label>
              <input
                {...register("sku_code")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.sku_code && <p className="text-red-500 text-xs mt-1">{errors.sku_code.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                {...register("product_name")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.product_name && <p className="text-red-500 text-xs mt-1">{errors.product_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                {...register("brand")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                {...register("category_id")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select Category...</option>
                {categoriesData?.results?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pack Size</label>
              <input
                {...register("pack_size")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Net Weight</label>
              <input
                type="number"
                step="0.01"
                {...register("net_weight")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gross Weight</label>
              <input
                type="number"
                step="0.01"
                {...register("gross_weight")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input
                {...register("barcode")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Life (Days)</label>
              <input
                type="number"
                {...register("shelf_life_days")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard Cost *</label>
              <input
                type="number"
                step="0.01"
                {...register("standard_cost")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.standard_cost && <p className="text-red-500 text-xs mt-1">{errors.standard_cost.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                {...register("status")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
              {isEditing ? "Update Product" : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
