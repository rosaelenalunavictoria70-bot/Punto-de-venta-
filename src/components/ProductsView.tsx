import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, ProductCategory, ProductUnit } from '../types';
import { formatCurrencySoles } from '../data/initialData';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Tag,
  AlertTriangle,
  CheckCircle,
  Barcode,
  Layers,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const categories: ProductCategory[] = [
    'Bebidas',
    'Abarrotes',
    'Lácteos',
    'Limpieza',
    'Snacks y Golosinas',
    'Licores',
    'Otros',
  ];

  const units: ProductUnit[] = [
    'Caja',
    'Paquete',
    'Fardo',
    'Saco',
    'Unidad',
    'Docena',
  ];

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Abarrotes' as ProductCategory,
    unit: 'Caja' as ProductUnit,
    price: 0,
    costPrice: 0,
    suggestedRetailPrice: 0,
    stock: 50,
    barcode: '',
    active: true,
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));

    const matchesCategory =
      selectedCategory === 'all' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    const nextNum = products.length + 1;
    setFormData({
      code: `PROD-${String(nextNum).padStart(3, '0')}`,
      name: '',
      category: 'Abarrotes',
      unit: 'Caja',
      price: 25.00,
      costPrice: 20.00,
      suggestedRetailPrice: 30.00,
      stock: 50,
      barcode: '',
      active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      category: product.category,
      unit: product.unit,
      price: product.price,
      costPrice: product.costPrice || 0,
      suggestedRetailPrice: product.suggestedRetailPrice || 0,
      stock: product.stock,
      barcode: product.barcode || '',
      active: product.active,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price <= 0) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        ...formData,
      });
    } else {
      addProduct({
        ...formData,
      });
    }

    setModalOpen(false);
  };

  const handleDelete = (product: Product) => {
    if (confirm(`¿Estás seguro de eliminar el producto ${product.name} (${product.code})?`)) {
      deleteProduct(product.id);
    }
  };

  const handleQuickStock = (productId: string, delta: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const newStock = Math.max(0, prod.stock + delta);
    updateProduct(productId, { stock: newStock });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Inventario & Catálogo</span>
            <span aria-hidden="true">·</span>
            <span>Total: <strong>{products.length} productos en lista</strong></span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Base de Datos de Productos & Códigos
          </h1>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Nuevo Producto</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código (BEB-001), nombre o código de barra..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Producto & Presentación</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Unidad</th>
                <th className="py-3.5 px-4 text-right">Precio de Venta (S/.)</th>
                <th className="py-3.5 px-4 text-center">Stock Actual</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron productos coincidentes.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isLowStock = product.stock <= 10;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {product.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {product.name}
                        </div>
                        {product.barcode && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            EAN: {product.barcode}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-800 font-semibold">
                          {product.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-base font-extrabold text-slate-900 tabular-nums">
                          {formatCurrencySoles(product.price)}
                        </span>
                        {product.suggestedRetailPrice && (
                          <div className="text-[10px] text-slate-400">
                            Sugerido: {formatCurrencySoles(product.suggestedRetailPrice)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleQuickStock(product.id, -5)}
                            title="Restar 5"
                            className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-xs tabular-nums ${
                              isLowStock
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {product.stock}
                          </span>
                          <button
                            onClick={() => handleQuickStock(product.id, 5)}
                            title="Sumar 5"
                            className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        {isLowStock && (
                          <div className="text-[9px] text-rose-600 font-semibold mt-0.5">
                            Bajo Stock
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            title="Editar producto"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            title="Eliminar producto"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Código de Producto *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: BEB-008"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Categoría *:
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombre Completo del Producto & Presentación *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Aceite Primor Clásico 900ml (Caja x 12 unds)"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Unidad de Medida / Presentación *:
                  </label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value as ProductUnit })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Precio de Venta en Soles (S/.) *:
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="0.1"
                    required
                    value={formData.price || ''}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Precio Costo (Opcional S/.):
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={formData.costPrice || ''}
                    onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Precio Sugerido Venta Pública (S/.):
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={formData.suggestedRetailPrice || ''}
                    onChange={e => setFormData({ ...formData, suggestedRetailPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Stock en Almacén *:
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Código de Barras / EAN:
                  </label>
                  <input
                    type="text"
                    placeholder="775010600..."
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
