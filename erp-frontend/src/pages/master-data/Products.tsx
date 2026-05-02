import React from 'react';
import { Plus, Search, Edit2, Power } from 'lucide-react';
import { Table, Badge, Modal } from '@/components/ui/Shared';
import { SearchBar, FormField } from '@/components/ui/Forms';
import { formatCurrency, getStatusColor } from '@/utils/formatters';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuditStore } from '@/store/useAuditStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataAPI } from '@/api/masterData';

const productSchema = z.object({
  sku_code: z.string().min(1, 'SKU is required'),
  product_name: z.string().min(1, 'Name is required'),
  brand: z.string().min(1, 'Brand is required'),
  category: z.string().min(1, 'Category is required'),
  pack_size: z.string().min(1, 'Pack size is required'),
  net_weight: z.string().min(1, 'Net weight is required'),
  gross_weight: z.string().min(1, 'Gross weight is required'),
  barcode: z.string().optional(),
  shelf_life_days: z.string().min(1, 'Shelf life is required'),
  standard_cost: z.string().min(1, 'Standard cost is required'),
  status: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<any>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const { user } = useAuthStore();
  const addLog = useAuditStore(state => state.addLog);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: masterDataAPI.getProducts
  });

  const { data: apiCategories = [] } = useQuery({
    queryKey: ['productCategories'],
    queryFn: masterDataAPI.getProductCategories
  });

  const categoriesOptions = apiCategories.map((c: any) => ({
    label: c.category_name,
    value: c.id
  }));

  const createMutation = useMutation({
    mutationFn: masterDataAPI.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product added successfully');
      setIsModalOpen(false);
      methods.reset();
    },
    onError: (error: any) => toast.error(error.message)
  });

  const createCategoryMutation = useMutation({
    mutationFn: masterDataAPI.createProductCategory,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
      toast.success('Category added successfully');
      setShowNewCategoryInput(false);
      setNewCategory('');
      methods.setValue('category', data.id.toString());
    },
    onError: (error: any) => toast.error(error.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => masterDataAPI.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
      setIsModalOpen(false);
      setEditingProduct(null);
      methods.reset();
    },
    onError: (error: any) => toast.error(error.message)
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => masterDataAPI.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => toast.error(error.message)
  });

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  const addCategory = () => {
    if (!newCategory.trim()) return;
    createCategoryMutation.mutate({ category_name: newCategory.trim() });
  };


  const onSubmit = (data: ProductFormValues) => {
    const payload = {
      ...data,
      category_id: data.category, // Map form field 'category' to backend 'category_id' if needed
      standard_cost: parseFloat(data.standard_cost),
      shelf_life_days: parseInt(data.shelf_life_days, 10),
      status: data.status || 'active'
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    methods.reset({
      ...product,
      category: product.category_id?.toString() || product.category?.toString(),
      standard_cost: product.standard_cost?.toString(),
      shelf_life_days: product.shelf_life_days?.toString(),
      status: product.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (row: any) => {
    const newStatus = row.status === 'active' ? 'inactive' : 'active';
    toggleStatusMutation.mutate({ id: row.id, data: { status: newStatus } });
  };

  const filteredProducts = products.filter((p: any) => {
    const matchesSearch =
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || p.category_id?.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Products Master</h2>
          <p className="text-sm text-gray-500">Manage finished goods and SKUs</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            methods.reset();
            setIsModalOpen(true);
          }}
          className="btn btn-primary gap-2"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="w-full max-w-md">
            <SearchBar onSearch={setSearchTerm} placeholder="Search by SKU or name..." />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-white"
            >
              <option value="">All Categories</option>
              {apiCategories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table
          columns={[
            { header: 'SKU', accessor: 'sku_code' },
            { header: 'Name', accessor: 'product_name' },
            { header: 'Brand', accessor: 'brand' },
            { header: 'Pack Size', accessor: 'pack_size' },
            { header: 'Net Weight', accessor: 'net_weight' },
            { header: 'Std. Cost', accessor: 'standard_cost', render: (val) => formatCurrency(val) },
            {
              header: 'Status',
              accessor: 'status',
              render: (val) => <Badge color={getStatusColor(val)}>{val}</Badge>
            },
            {
              header: 'Actions',
              accessor: 'id',
              render: (_, row) => (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(row)}
                    title={row.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
                    className={`p-1 rounded ${
                      row.status === 'active'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <Power size={16} />
                  </button>
                </div>
              )
            }
          ]}
          data={filteredProducts}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="xl"
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="sku_code" label="SKU Code" placeholder="e.g. NM-001" required />
              <FormField name="product_name" label="Product Name" placeholder="e.g. Nimko Mix" required />
              <FormField name="brand" label="Brand" placeholder="e.g. Pakistani Foods" required />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Category *</label>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                    className="text-xs text-primary hover:underline"
                  >
                    {showNewCategoryInput ? 'Cancel' : '+ Add New Category'}
                  </button>
                </div>
                {showNewCategoryInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md text-sm focus:ring-primary focus:border-primary"
                      placeholder="New category name..."
                    />
                    <button
                      type="button"
                      onClick={addCategory}
                      className="btn btn-primary px-3 py-2"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <FormField
                    name="category"
                    label=""
                    type="select"
                    options={categoriesOptions}
                    required
                  />
                )}
              </div>

              <FormField name="pack_size" label="Pack Size" placeholder="e.g. 200g" required />
              <FormField name="net_weight" label="Net Weight (g)" placeholder="200" required />
              <FormField name="gross_weight" label="Gross Weight (g)" placeholder="210" required />
              <FormField name="barcode" label="Barcode" placeholder="UPC/EAN" />
              <FormField name="shelf_life_days" label="Shelf Life (Days)" placeholder="180" required />
              <FormField name="standard_cost" label="Standard Cost (PKR)" placeholder="120" required />
              <FormField
                name="status"
                label="Status"
                type="select"
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' }
                ]}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingProduct ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};
