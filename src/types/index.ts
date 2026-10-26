export type RouteDay = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

export type VisitStatus = 'pending' | 'visited_order' | 'visited_no_order' | 'absent';

export type SalesRole = 'admin' | 'supervisor' | 'vendedor';

export interface SalesUser {
  id: string;
  sellerCode: string; // e.g. VEN-001
  username: string; // e.g. rosa.admin, juan.norte
  accessPin: string; // Contraseña / PIN de acceso
  fullName: string;
  role: SalesRole;
  phone: string;
  assignedZone: string;
  salesGoalSoles: number;
  active: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  code: string; // e.g. CLI-001
  name: string; // Nombre del negocio / Bodega
  ownerName: string; // Nombre del cliente / propietario
  documentType: 'DNI' | 'RUC';
  documentNumber: string;
  phone: string;
  address: string;
  district: string;
  reference: string;
  routeDay: RouteDay;
  notes?: string;
  visitStatus?: VisitStatus;
  assignedSellerCode?: string; // e.g. VEN-001, VEN-002
  dailyPurchaseQuotaSoles?: number; // Cuota objetivo por visita al cliente en S/.
  lastOrderAmount?: number;
  lastOrderId?: string;
  createdAt: string;
}

export type ProductCategory =
  | 'Bebidas'
  | 'Abarrotes'
  | 'Lácteos'
  | 'Limpieza'
  | 'Snacks y Golosinas'
  | 'Cuidado Personal'
  | 'Licores'
  | 'Otros';

export type ProductUnit =
  | 'Unidad'
  | 'Caja'
  | 'Pack'
  | 'Display'
  | 'Paquete'
  | 'Fardo'
  | 'Saco'
  | 'Docena';

export type PresentationType = 'Unitario' | 'Caja' | 'Pack' | 'Display';

export interface ProductPresentation {
  type: PresentationType;
  code: string; // e.g. BEB-001-UND, BEB-001-CAJ, BEB-001-PCK, BEB-001-DSP
  label: string; // e.g. "Unitario (1 und)", "Caja (x12 unds)", "Pack (x6 unds)", "Display (x24 unds)"
  unitsPerPresentation: number;
  price: number; // Precio en Soles S/.
}

export interface Product {
  id: string;
  code: string; // Código base e.g. BEB-001
  name: string;
  category: ProductCategory;
  unit: ProductUnit;
  price: number; // Precio principal en Soles S/.
  presentations?: ProductPresentation[]; // Códigos y precios para Unitario, Caja, Pack, Display
  costPrice?: number;
  suggestedRetailPrice?: number;
  stock: number;
  barcode?: string;
  active: boolean;
  image?: string;
}

export interface OrderItem {
  productId: string;
  productCode: string; // Código específico (ej. BEB-001-CAJ, BEB-001-UND, BEB-001-PCK, BEB-001-DSP)
  productName: string;
  unit: ProductUnit;
  presentationType?: PresentationType;
  unitPrice: number; // S/.
  quantity: number;
  subtotal: number; // S/.
}

export type PaymentMethod =
  | 'Efectivo contra entrega'
  | 'Yape / Plin contra entrega'
  | 'Transferencia bancaria BCP/BBVA'
  | 'Crédito a 7 días';

export type DeliveryTimeSlot =
  | 'Mañana (08:00 - 13:00)'
  | 'Tarde (14:00 - 18:30)'
  | 'Todo el día (08:00 - 18:00)'
  | 'Urgente primera hora';

export type OrderStatus = 'pendiente_entrega' | 'entregado_y_cobrado' | 'cancelado';

export interface Order {
  id: string;
  orderNumber: string; // e.g. PED-0042
  customerId: string;
  customerCode: string;
  customerName: string;
  customerOwner: string;
  customerDocumentType: 'DNI' | 'RUC';
  customerDocumentNumber: string;
  customerPhone: string;
  customerAddress: string;
  customerDistrict: string;
  customerReference: string;
  routeDay: RouteDay;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number; // Monto a cobrar en Soles S/.
  paymentMethod: PaymentMethod;
  cashChangeFor?: number; // Paga con S/ 100
  deliveryDate: string; // YYYY-MM-DD
  deliveryTimeSlot: DeliveryTimeSlot;
  sellerCode?: string;
  sellerName: string;
  notes?: string;
  status: OrderStatus;
  syncedToCloud?: boolean;
  createdAt: string;
}

export interface CategoryQuota {
  category: ProductCategory;
  dailyGoalSoles: number;
  dailyGoalUnits: number;
}

export interface QuotaConfig {
  dailyGeneralGoalSoles: number;
  weeklyGeneralGoalSoles: number;
  categoryQuotas: CategoryQuota[];
}

export interface CompanyConfig {
  companyName: string;
  tradeName: string;
  ruc: string;
  phone: string;
  address: string;
  city: string;
  sellerName: string;
  receiptFooterMessage: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'rutero'
  | 'pos'
  | 'cuotas'
  | 'clientes'
  | 'productos'
  | 'pedidos'
  | 'fuerza_ventas'
  | 'despliegue'
  | 'configuracion';
