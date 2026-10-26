import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Customer,
  Product,
  OrderItem,
  PaymentMethod,
  DeliveryTimeSlot,
  ProductCategory,
  PresentationType,
  ProductPresentation,
  ProductUnit,
} from '../types';
import { formatCurrencySoles, getProductPresentations } from '../data/initialData';
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

  // Custom prices and custom quantities state per product+presentation in catalog
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [inputQuantities, setInputQuantities] = useState<Record<string, string>>({});

  // Helper to get presentation key
  const getPresKey = (productId: string, presType: PresentationType) => `${productId}__${presType}`;

  const presentationTypeToUnit = (presType: PresentationType): ProductUnit => {
    switch (presType) {
      case 'Unitario':
        return 'Unidad';
      case 'Caja':
        return 'Caja';
      case 'Pack':
        return 'Pack';
      case 'Display':
        return 'Display';
    }
  };

  // Filtered products (also matches any presentation code like BEB-001-CAJ, BEB-001-UND, etc.)
  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    const presentations = getProductPresentations(p);
    const q = productSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q)) ||
      presentations.some(pres => pres.code.toLowerCase().includes(q));

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

  // Add or update a specific presentation (Unitario, Pack, Display, Caja) in Cart
  const addPresentationToCart = (
    product: Product,
    pres: ProductPresentation,
    quantityToAdd: number,
    overridePrice?: number
  ) => {
    if (quantityToAdd <= 0) return;
    const key = getPresKey(product.id, pres.type);
    const effectivePrice =
      overridePrice !== undefined
        ? overridePrice
        : customPrices[key] !== undefined
        ? customPrices[key]
        : pres.price;

    const unitLabel = presentationTypeToUnit(pres.type);

    setCartItems(prev => {
      const existing = prev.find(
        item => item.productId === product.id && item.productCode === pres.code
      );
      if (existing) {
        const nextQty = existing.quantity + quantityToAdd;
        return prev.map(item =>
          item.productId === product.id && item.productCode === pres.code
            ? {
                ...item,
                unitPrice: effectivePrice,
                quantity: nextQty,
                subtotal: Number((nextQty * effectivePrice).toFixed(2)),
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productCode: pres.code,
            productName: `${product.name.replace(/\s*\(.*?\)\s*$/, '')} (${pres.type})`,
            unit: unitLabel,
            presentationType: pres.type,
            unitPrice: effectivePrice,
            quantity: quantityToAdd,
            subtotal: Number((quantityToAdd * effectivePrice).toFixed(2)),
          },
        ];
      }
    });
  };

  // Set exact quantity for a presentation directly from the product card table
  const setExactPresentationQuantity = (
    product: Product,
    pres: ProductPresentation,
    exactQty: number
  ) => {
    const key = getPresKey(product.id, pres.type);
    const effectivePrice =
      customPrices[key] !== undefined ? customPrices[key] : pres.price;
    const unitLabel = presentationTypeToUnit(pres.type);

    if (exactQty <= 0) {
      setCartItems(prev =>
        prev.filter(
          item => !(item.productId === product.id && item.productCode === pres.code)
        )
      );
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(
        item => item.productId === product.id && item.productCode === pres.code
      );
      if (existing) {
        return prev.map(item =>
          item.productId === product.id && item.productCode === pres.code
            ? {
                ...item,
                unitPrice: effectivePrice,
                quantity: exactQty,
                subtotal: Number((exactQty * effectivePrice).toFixed(2)),
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productCode: pres.code,
            productName: `${product.name.replace(/\s*\(.*?\)\s*$/, '')} (${pres.type})`,
            unit: unitLabel,
            presentationType: pres.type,
            unitPrice: effectivePrice,
            quantity: exactQty,
            subtotal: Number((exactQty * effectivePrice).toFixed(2)),
          },
        ];
      }
    });
  };

  const updateCartItemQuantity = (productCode: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productCode);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.productCode === productCode
          ? {
              ...item,
              quantity: newQty,
              subtotal: Number((newQty * item.unitPrice).toFixed(2)),
            }
          : item
      )
    );
  };

  const updateCartItemPrice = (productCode: string, newPrice: number) => {
    const validPrice = Math.max(0, newPrice);
    setCartItems(prev =>
      prev.map(item =>
        item.productCode === productCode
          ? {
              ...item,
              unitPrice: validPrice,
              subtotal: Number((item.quantity * validPrice).toFixed(2)),
            }
          : item
      )
    );
  };

  const removeFromCart = (productCode: string) => {
    setCartItems(prev => prev.filter(item => item.productCode !== productCode));
  };

  const clearCart = () => {
    setCartItems([]);
    setInputQuantities({});
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

        {/* Product Catalog & Multi-Presentation Grid */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Catálogo por Presentación: Unitario, Pack, Display y Caja
              </h2>
              <p className="text-xs text-slate-500">
                Cada producto tiene código y precio editable para <strong>Unitario (-UND)</strong>, <strong>Pack (-PCK)</strong>, <strong>Display (-DSP)</strong> y <strong>Caja (-CAJ)</strong>. Escribe la cantidad exacta que pida el cliente.
              </p>
            </div>

            {/* Product search bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar BEB-001-UND, BEB-001-CAJ o nombre..."
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

          {/* Product Items Grid (2 Columns on XL so the 4 presentations table fits comfortably) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-slate-500">
                No se encontraron productos coincidentes con "{productSearch}".
              </div>
            ) : (
              filteredProducts.map(product => {
                const presentations = getProductPresentations(product);
                const productCartItems = cartItems.filter(item => item.productId === product.id);
                const totalProductSubtotal = productCartItems.reduce((s, i) => s + i.subtotal, 0);

                return (
                  <div
                    key={product.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      productCartItems.length > 0
                        ? 'border-emerald-500 bg-emerald-50/15 shadow-xs ring-1 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Product Header */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            Base: {product.code}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            {product.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Stock: <strong className="text-slate-900">{product.stock}</strong>
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {product.name}
                      </h3>
                    </div>

                    {/* 4 PRESENTATIONS TABLE: UNITARIO, PACK, DISPLAY, CAJA */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                      <div className="grid grid-cols-12 bg-slate-100/80 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                        <div className="col-span-4">Presentación / Código</div>
                        <div className="col-span-3 text-right">Precio (S/.)</div>
                        <div className="col-span-5 text-center">Cantidad Solicitada</div>
                      </div>

                      <div className="divide-y divide-slate-200/70">
                        {presentations.map(pres => {
                          const presKey = getPresKey(product.id, pres.type);
                          const currentPrice =
                            customPrices[presKey] !== undefined ? customPrices[presKey] : pres.price;
                          const inCartItem = cartItems.find(
                            i => i.productId === product.id && i.productCode === pres.code
                          );
                          const cartQty = inCartItem ? inCartItem.quantity : 0;
                          const displayQtyValue =
                            inputQuantities[presKey] !== undefined
                              ? inputQuantities[presKey]
                              : cartQty > 0
                              ? String(cartQty)
                              : '';

                          const badgeColors: Record<PresentationType, string> = {
                            Unitario: 'bg-blue-50 text-blue-800 border-blue-200',
                            Pack: 'bg-purple-50 text-purple-800 border-purple-200',
                            Display: 'bg-amber-50 text-amber-800 border-amber-200',
                            Caja: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                          };

                          return (
                            <div
                              key={pres.code}
                              className={`grid grid-cols-12 items-center px-2.5 py-2 gap-1.5 text-xs ${
                                cartQty > 0 ? 'bg-emerald-50/60' : 'bg-white'
                              }`}
                            >
                              {/* Code & Type */}
                              <div className="col-span-4 min-w-0">
                                <span
                                  className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeColors[pres.type]}`}
                                >
                                  {pres.type}
                                </span>
                                <div className="font-mono text-[10px] font-bold text-slate-700 mt-0.5 truncate">
                                  {pres.code}
                                </div>
                              </div>

                              {/* Editable Price in Soles */}
                              <div className="col-span-3 flex items-center justify-end">
                                <div className="relative w-20">
                                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                                    S/
                                  </span>
                                  <input
                                    type="number"
                                    min="0.1"
                                    step="0.10"
                                    value={currentPrice}
                                    onChange={e => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setCustomPrices(prev => ({ ...prev, [presKey]: val }));
                                      if (cartQty > 0) {
                                        updateCartItemPrice(pres.code, val);
                                      }
                                    }}
                                    title="Precio editable en Soles"
                                    className="w-full pl-5 pr-1 py-1 text-right font-mono font-bold text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
                                  />
                                </div>
                              </div>

                              {/* Editable Quantity Input + Stepper Buttons */}
                              <div className="col-span-5 flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = Math.max(0, cartQty - 1);
                                    setInputQuantities(prev => ({
                                      ...prev,
                                      [presKey]: next > 0 ? String(next) : '',
                                    }));
                                    setExactPresentationQuantity(product, pres, next);
                                  }}
                                  className="w-6 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold cursor-pointer shrink-0"
                                  title="Restar 1"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>

                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  placeholder="0"
                                  value={displayQtyValue}
                                  onChange={e => {
                                    const raw = e.target.value;
                                    setInputQuantities(prev => ({ ...prev, [presKey]: raw }));
                                    const num = parseInt(raw, 10);
                                    if (!isNaN(num) && num >= 0) {
                                      setExactPresentationQuantity(product, pres, num);
                                    } else if (raw === '') {
                                      setExactPresentationQuantity(product, pres, 0);
                                    }
                                  }}
                                  className={`w-14 h-7 text-center font-mono font-bold text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                                    cartQty > 0
                                      ? 'bg-emerald-600 text-white border-emerald-700'
                                      : 'bg-white text-slate-900 border-slate-300'
                                  }`}
                                  title={`Escribir cantidad de ${pres.type} (${pres.code})`}
                                />

                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = cartQty + 1;
                                    setInputQuantities(prev => ({
                                      ...prev,
                                      [presKey]: String(next),
                                    }));
                                    addPresentationToCart(product, pres, 1, currentPrice);
                                  }}
                                  className="w-6 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center font-bold cursor-pointer shrink-0"
                                  title="Sumar 1"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Summary of selected presentations for this product */}
                    {productCartItems.length > 0 && (
                      <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-between text-[11px] font-bold text-emerald-950">
                        <span>
                          En ticket:{' '}
                          {productCartItems
                            .map(i => `${i.quantity} ${i.presentationType || i.unit} (${i.productCode})`)
                            .join(' + ')}
                        </span>
                        <span className="tabular-nums text-emerald-800">
                          {formatCurrencySoles(totalProductSubtotal)}
                        </span>
                      </div>
                    )}
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

          {/* Cart items list with editable quantity and editable price */}
          <div className="my-3 max-h-[340px] overflow-y-auto divide-y divide-slate-100 pr-1">
            {cartItems.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">El carrito está vacío</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Escribe la cantidad en Unitario, Pack, Display o Caja a la izquierda
                </p>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.productCode} className="py-2.5 space-y-1.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-800 font-bold">
                          {item.productCode}
                        </span>
                        {item.presentationType && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {item.presentationType}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-slate-900 mt-0.5 leading-snug">
                        {item.productName}
                      </h4>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productCode)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                      title="Quitar del ticket"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Editable Quantity & Editable Price Row inside Cart */}
                  <div className="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-semibold mr-0.5">Cant:</span>
                      <button
                        onClick={() => updateCartItemQuantity(item.productCode, item.quantity - 1)}
                        className="w-5 h-6 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold cursor-pointer"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) {
                            updateCartItemQuantity(item.productCode, val);
                          }
                        }}
                        className="w-12 h-6 text-center font-mono font-bold text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                      <button
                        onClick={() => updateCartItemQuantity(item.productCode, item.quantity + 1)}
                        className="w-5 h-6 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-semibold">S/</span>
                      <input
                        type="number"
                        min="0.1"
                        step="0.10"
                        value={item.unitPrice}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0) {
                            updateCartItemPrice(item.productCode, val);
                          }
                        }}
                        className="w-16 h-6 text-right pr-1 font-mono font-bold text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        title="Precio unitario editable"
                      />
                    </div>

                    <div className="text-right font-extrabold text-slate-900 tabular-nums min-w-[62px]">
                      {formatCurrencySoles(item.subtotal)}
                    </div>
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
