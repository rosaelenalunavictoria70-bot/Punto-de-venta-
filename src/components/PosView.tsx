import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, Product, OrderItem, PaymentMethod, DeliveryTimeSlot, ProductCategory } from '../types';
import { formatCurrencySoles } from '../data/initialData';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  User,
  MapPin,
  Phone,
  Calendar,
  Clock,
  Banknote,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Package,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const PosView: React.FC = () => {
  const {
    customers,
    products,
    posCustomer,
    setPosCustomer,
    createOrder,
    selectedRouteDay,
    companyConfig,
  } = useApp();

  // Search and category filters
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Cart state
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo contra entrega');
  const [cashAmountGiven, setCashAmountGiven] = useState<string>('');
  
  // Tomorrow's date formatted as default delivery
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDeliveryDate = tomorrow.toISOString().split('T')[0];

  const [deliveryDate, setDeliveryDate] = useState<string>(defaultDeliveryDate);
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<DeliveryTimeSlot>('Mañana (08:00 - 13:00)');
  const [orderNotes, setOrderNotes] = useState('');
  const [quickCustomerModal, setQuickCustomerModal] = useState(false);

  // Quick customer form fields
  const [quickCode, setQuickCode] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickOwner, setQuickOwner] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickAddress, setQuickAddress] = useState('');
  const [quickDistrict, setQuickDistrict] = useState('Lima');
  const [quickReference, setQuickReference] = useState('');

  // Auto-select first customer from route if none selected
  useEffect(() => {
    if (!posCustomer) {
      const todayFirst = customers.find(c => c.routeDay === selectedRouteDay);
      if (todayFirst) {
        setPosCustomer(todayFirst);
      } else if (customers.length > 0) {
        setPosCustomer(customers[0]);
      }
    }
  }, [posCustomer, selectedRouteDay, customers, setPosCustomer]);

  // Product categories list
  const categories: ProductCategory[] = [
    'Bebidas',
    'Abarrotes',
    'Lácteos',
    'Limpieza',
    'Snacks y Golosinas',
    'Licores',
  ];

  // Filtered products
  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.barcode && p.barcode.includes(productSearch));

    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  // Filtered customers for customer switcher
  const filteredCustomers = customers.filter(c => {
    return (
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.address.toLowerCase().includes(customerSearch.toLowerCase())
    );
  });

  // Cart operations
  const addToCart = (product: Product, quantityToAdd = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + quantityToAdd,
                subtotal: (item.quantity + quantityToAdd) * item.unitPrice,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productCode: product.code,
            productName: product.name,
            unit: product.unit,
            unitPrice: product.price,
            quantity: quantityToAdd,
            subtotal: quantityToAdd * product.price,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscountAmount(0);
    setCashAmountGiven('');
    setOrderNotes('');
  };

  // Calculations
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);
  const cashNum = parseFloat(cashAmountGiven) || 0;
  const cashChange = cashNum > cartTotal ? cashNum - cartTotal : 0;

  // Handle Quick Customer creation
  const handleCreateQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !quickAddress.trim()) return;

    const nextCodeNum = customers.length + 1;
    const assignedCode = quickCode.trim() || `CLI-${String(nextCodeNum).padStart(3, '0')}`;

    const newCust: Customer = {
      id: `c-${Date.now()}`,
      code: assignedCode,
      name: quickName.trim(),
      ownerName: quickOwner.trim() || quickName.trim(),
      documentType: 'DNI',
      documentNumber: '00000000',
      phone: quickPhone.trim() || '999999999',
      address: quickAddress.trim(),
      district: quickDistrict.trim(),
      reference: quickReference.trim(),
      routeDay: selectedRouteDay,
      notes: 'Cliente registrado en ruta',
      visitStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    setPosCustomer(newCust);
    setQuickCustomerModal(false);
    // Reset quick form
    setQuickCode('');
    setQuickName('');
    setQuickOwner('');
    setQuickPhone('');
    setQuickAddress('');
    setQuickReference('');
  };

  // Submit Order and generate ticket
  const handleGenerateTicket = () => {
    if (!posCustomer) {
      alert('Por favor selecciona un cliente para emitir el ticket.');
      return;
    }

    if (cartItems.length === 0) {
      alert('Por favor agrega al menos un producto al pedido.');
      return;
    }

    createOrder({
      customerId: posCustomer.id,
      customerCode: posCustomer.code,
      customerName: posCustomer.name,
      customerOwner: posCustomer.ownerName,
      customerDocumentType: posCustomer.documentType,
      customerDocumentNumber: posCustomer.documentNumber,
      customerPhone: posCustomer.phone,
      customerAddress: posCustomer.address,
      customerDistrict: posCustomer.district,
      customerReference: posCustomer.reference,
      routeDay: posCustomer.routeDay,
      items: cartItems,
      subtotal: cartSubtotal,
      discount: discountAmount,
      total: cartTotal,
      paymentMethod,
      cashChangeFor: cashNum > 0 ? cashNum : undefined,
      deliveryDate,
      deliveryTimeSlot,
      sellerName: companyConfig.sellerName,
      notes: orderNotes.trim() || posCustomer.notes,
      status: 'pendiente_entrega',
    });

    // Clear cart for next order
    clearCart();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      
      {/* LEFT/MAIN SECTION (8 Cols): Customer Info & Product Catalog */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        
        {/* Customer Active Banner & Selector */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Cliente Seleccionado en Punto de Venta:
              </span>
              {posCustomer ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                    {posCustomer.code}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    {posCustomer.name}
                  </h2>
                </div>
              ) : (
                <p className="text-sm font-semibold text-rose-600">
                  Ningún cliente seleccionado
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {showCustomerDropdown ? 'Ocultar Selector' : 'Cambiar Cliente'}
              </button>
              <button
                onClick={() => setQuickCustomerModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
              >
                + Cliente al Paso
              </button>
            </div>
          </div>

          {/* Quick Dropdown / Customer Search */}
          {showCustomerDropdown && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar cliente por código, bodega, nombre..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white rounded-lg border border-slate-200">
                {filteredCustomers.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 text-center">No se encontraron clientes</div>
                ) : (
                  filteredCustomers.map(cust => (
                    <button
                      key={cust.id}
                      onClick={() => {
                        setPosCustomer(cust);
                        setShowCustomerDropdown(false);
                      }}
                      className={`w-full text-left p-2.5 hover:bg-slate-50 text-xs flex items-center justify-between cursor-pointer ${
                        posCustomer?.id === cust.id ? 'bg-emerald-50/70 font-semibold' : ''
                      }`}
                    >
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-700 mr-2">
                          [{cust.code}]
                        </span>
                        <span className="text-slate-900 font-medium">{cust.name}</span>
                        <span className="text-slate-500 text-[11px] block">{cust.address} ({cust.district})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                        {cust.routeDay}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Customer Metadata Preview */}
          {posCustomer && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Titular: <strong>{posCustomer.ownerName}</strong> ({posCustomer.documentType}: {posCustomer.documentNumber})</span>
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="truncate">
                  {posCustomer.address}, {posCustomer.district}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Cel: <strong>{posCustomer.phone}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Product Catalog & Fast Add Grid */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Catálogo de Productos para Venta</h2>
              <p className="text-xs text-slate-500">
                Toca cualquier producto o usa los botones rápidos para sumar al ticket
              </p>
            </div>

            {/* Product search bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por código (BEB-001) o nombre..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({products.filter(p => p.active).length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-slate-500">
                No se encontraron productos coincidentes con "{productSearch}".
              </div>
            ) : (
              filteredProducts.map(product => {
                const inCart = cartItems.find(item => item.productId === product.id);
                const quantityInCart = inCart?.quantity || 0;

                return (
                  <div
                    key={product.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      quantityInCart > 0
                        ? 'border-emerald-500 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {product.code}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Stock: <strong className="text-slate-800">{product.stock}</strong>
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 min-h-[32px]">
                        {product.name}
                      </h3>

                      <div className="text-[11px] text-slate-500 mt-0.5 mb-2">
                        Pres: <span className="font-medium text-slate-700">{product.unit}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between pt-2 border-t border-slate-100 mb-2">
                        <span className="text-[10px] text-slate-400">Precio x {product.unit}:</span>
                        <span className="text-base font-extrabold text-slate-900 tabular-nums">
                          {formatCurrencySoles(product.price)}
                        </span>
                      </div>

                      {/* Quick Add Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => addToCart(product, 1)}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar</span>
                        </button>
                        <button
                          onClick={() => addToCart(product, 5)}
                          title="Sumar 5 unidades"
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => addToCart(product, 10)}
                          title="Sumar 10 unidades"
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          +10
                        </button>
                      </div>

                      {quantityInCart > 0 && (
                        <div className="mt-2 text-center text-[11px] font-bold text-emerald-700 bg-emerald-100/60 py-1 rounded-md">
                          En pedido: {quantityInCart} {product.unit} = {formatCurrencySoles(quantityInCart * product.price)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION (4-5 Cols): CART & TICKET CHECKOUT */}
      <div className="lg:col-span-5 xl:col-span-4 sticky top-20 space-y-4">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Ticket en Preparación
              </h2>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Cart items list */}
          <div className="my-3 max-h-[300px] overflow-y-auto divide-y divide-slate-100 pr-1">
            {cartItems.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">El carrito está vacío</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Selecciona productos del catálogo a la izquierda
                </p>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-slate-500 font-bold">
                        {item.productCode}
                      </span>
                      <h4 className="font-semibold text-slate-900 truncate">
                        {item.productName}
                      </h4>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.quantity} x {formatCurrencySoles(item.unitPrice)}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-slate-900 tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <div className="w-16 text-right font-bold text-slate-900 tabular-nums">
                      {formatCurrencySoles(item.subtotal)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Summary */}
          <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Productos ({cartItems.reduce((sum, i) => sum + i.quantity, 0)} unidades):</span>
              <span className="font-semibold tabular-nums">{formatCurrencySoles(cartSubtotal)}</span>
            </div>

            {/* Discount input */}
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px]">Descuento especial (S/.):</span>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={discountAmount || ''}
                  onChange={e => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.00"
                  className="w-full text-right px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden"
                />
              </div>
            </div>

            {/* Huge Total To Collect in Soles */}
            <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
              <div>
                <span className="text-xs font-bold text-emerald-950 block">
                  TOTAL A COBRAR EN SOLES
                </span>
                <span className="text-[10px] text-emerald-700">
                  (Monto a pagar al entregar)
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 tabular-nums">
                {formatCurrencySoles(cartTotal)}
              </div>
            </div>
          </div>

          {/* Payment & Delivery Configuration */}
          <div className="mt-4 pt-3 border-t border-slate-200 space-y-3 text-xs">
            
            {/* Payment Method */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Forma de Cobro:
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden"
              >
                <option value="Efectivo contra entrega">Efectivo contra entrega</option>
                <option value="Yape / Plin contra entrega">Yape / Plin contra entrega</option>
                <option value="Transferencia bancaria BCP/BBVA">Transferencia bancaria BCP/BBVA</option>
                <option value="Crédito a 7 días">Crédito a 7 días</option>
              </select>
            </div>

            {/* Cash change calculation */}
            {paymentMethod === 'Efectivo contra entrega' && (
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 font-medium">¿Con cuánto billete paga?</span>
                  <div className="w-28 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">S/</span>
                    <input
                      type="number"
                      placeholder="Ej: 100"
                      value={cashAmountGiven}
                      onChange={e => setCashAmountGiven(e.target.value)}
                      className="w-full pl-6 pr-2 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-hidden text-right font-bold"
                    />
                  </div>
                </div>
                {cashNum > 0 && (
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 font-semibold">
                    <span className="text-slate-600">Vuelto a llevar:</span>
                    <span className={`tabular-nums ${cashChange >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {cashChange >= 0 ? formatCurrencySoles(cashChange) : 'Falta dinero'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Delivery Date & Time slot */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-medium mb-1 text-[11px]">
                  Fecha Entrega:
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1 text-[11px]">
                  Turno Entrega:
                </label>
                <select
                  value={deliveryTimeSlot}
                  onChange={e => setDeliveryTimeSlot(e.target.value as DeliveryTimeSlot)}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Mañana (08:00 - 13:00)">Mañana (8am - 1pm)</option>
                  <option value="Tarde (14:00 - 18:30)">Tarde (2pm - 6:30pm)</option>
                  <option value="Todo el día (08:00 - 18:00)">Todo el día</option>
                  <option value="Urgente primera hora">Urgente 1ra hora</option>
                </select>
              </div>
            </div>

            {/* Delivery Notes */}
            <div>
              <label className="block text-slate-700 font-medium mb-1 text-[11px]">
                Indicaciones de Entrega:
              </label>
              <input
                type="text"
                placeholder="Ej: Dejar en 2do piso, llamar antes..."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Primary Action Button: GENERAR TICKET */}
          <div className="mt-5">
            <button
              onClick={handleGenerateTicket}
              disabled={cartItems.length === 0}
              className={`w-full py-3.5 px-4 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                cartItems.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-emerald-600/20'
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              <Receipt className="w-5 h-5" />
              <span>EMITIR TICKET DE VENTA ({formatCurrencySoles(cartTotal)})</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Se generará el ticket impreso y opción de WhatsApp inmediato
            </p>
          </div>
        </div>
      </div>

      {/* QUICK CUSTOMER MODAL */}
      {quickCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Registrar Cliente al Paso
              </h3>
              <button
                onClick={() => setQuickCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuickCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Código de Cliente (Auto o Personalizado):
                </label>
                <input
                  type="text"
                  placeholder={`Ej: CLI-${String(customers.length + 1).padStart(3, '0')}`}
                  value={quickCode}
                  onChange={e => setQuickCode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombre de la Bodega / Tienda *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Bodega Don José"
                  value={quickName}
                  onChange={e => setQuickName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Titular / Encargado:
                  </label>
                  <input
                    type="text"
                    placeholder="José Mendoza"
                    value={quickOwner}
                    onChange={e => setQuickOwner(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Celular / WhatsApp:
                  </label>
                  <input
                    type="tel"
                    placeholder="987654321"
                    value={quickPhone}
                    onChange={e => setQuickPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Dirección Exacta *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Av. Los Pinos 340, Los Olivos"
                  value={quickAddress}
                  onChange={e => setQuickAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Distrito:
                  </label>
                  <input
                    type="text"
                    placeholder="Los Olivos, Lima"
                    value={quickDistrict}
                    onChange={e => setQuickDistrict(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Referencia:
                  </label>
                  <input
                    type="text"
                    placeholder="Frente al parque"
                    value={quickReference}
                    onChange={e => setQuickReference(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickCustomerModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
