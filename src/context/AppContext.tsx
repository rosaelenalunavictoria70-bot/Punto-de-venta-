import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Customer,
  Product,
  Order,
  RouteDay,
  CompanyConfig,
  VisitStatus,
  OrderStatus,
  SalesUser,
  ActiveTab,
  QuotaConfig,
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_SALES_USERS,
  DEFAULT_COMPANY_CONFIG,
  DEFAULT_QUOTA_CONFIG,
  getTodayRouteDay,
} from '../data/initialData';

interface AppContextType {
  customers: Customer[];
  products: Product[];
  orders: Order[];
  salesUsers: SalesUser[];
  companyConfig: CompanyConfig;
  selectedRouteDay: RouteDay;
  setSelectedRouteDay: (day: RouteDay) => void;
  activeTicketOrder: Order | null;
  openTicketModal: (order: Order) => void;
  closeTicketModal: () => void;
  // Auth & Multi-User Sales Force
  currentSalesUser: SalesUser | null;
  loginWithCredentials: (username: string, pin: string) => { success: boolean; error?: string };
  loginAsDemoUser: (user: SalesUser) => void;
  logoutSalesUser: () => void;
  // Cloud Sync (Firebase)
  firebaseUser: FirebaseUser | null;
  isAuthReady: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastRealtimeUpdate: string;
  pendingOfflineCount: number;
  signInWithGoogleCloud: () => Promise<void>;
  signOutGoogleCloud: () => Promise<void>;
  syncAllToCloud: () => Promise<{ success: boolean; message: string }>;
  // SalesUser CRUD
  addSalesUser: (data: Omit<SalesUser, 'id' | 'createdAt'>) => SalesUser;
  updateSalesUser: (id: string, data: Partial<SalesUser>) => void;
  deleteSalesUser: (id: string) => void;
  // Customer CRUD
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  updateCustomerVisitStatus: (customerId: string, status: VisitStatus) => void;
  // Product CRUD
  addProduct: (data: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  // Order CRUD
  createOrder: (data: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;
  // Config & Data Management
  quotaConfig: QuotaConfig;
  updateQuotaConfig: (data: Partial<QuotaConfig>) => void;
  updateCustomerQuota: (customerId: string, quotaSoles: number) => void;
  updateCompanyConfig: (data: Partial<CompanyConfig>) => void;
  resetToInitialData: () => void;
  exportDataAsJSON: () => string;
  importDataFromJSON: (jsonStr: string) => boolean;
  // Quick pre-selected customer for POS
  posCustomer: Customer | null;
  setPosCustomer: (customer: Customer | null) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const STORAGE_KEYS = {
  CUSTOMERS: 'rutaventa_customers_v2',
  PRODUCTS: 'rutaventa_products_v2',
  ORDERS: 'rutaventa_orders_v2',
  SALES_USERS: 'rutaventa_sales_users_v2',
  CURRENT_USER: 'rutaventa_current_sales_user_v2',
  CONFIG: 'rutaventa_config_v2',
  QUOTAS: 'rutaventa_quotas_v2',
  ROUTE_DAY: 'rutaventa_selected_day_v2',
  LAST_SYNC: 'rutaventa_last_sync_v2',
};

// Defensive sanitizer matching firebase-blueprint.json maxLength & regex constraints
function cleanId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128) || 'doc-1';
}

function clampStr(val: string | undefined, min: number, max: number, fallback = 'N/A'): string {
  const s = (val ?? '').trim();
  if (s.length < min) return fallback.slice(0, max);
  return s.slice(0, max);
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading customers', e);
    }
    return INITIAL_CUSTOMERS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading products', e);
    }
    return INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) {
        const parsed: Order[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map(o => o.id));
        const missingSeeds = INITIAL_ORDERS.filter(o => !existingIds.has(o.id));
        return [...parsed, ...missingSeeds];
      }
    } catch (e) {
      console.error('Error loading orders', e);
    }
    return INITIAL_ORDERS;
  });

  const [salesUsers, setSalesUsers] = useState<SalesUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES_USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading sales users', e);
    }
    return INITIAL_SALES_USERS;
  });

  const [currentSalesUser, setCurrentSalesUser] = useState<SalesUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading current sales user', e);
    }
    return INITIAL_SALES_USERS[0]; // Default to Admin Rosa Elena so app is immediately usable
  });

  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading config', e);
    }
    return DEFAULT_COMPANY_CONFIG;
  });

  const [quotaConfig, setQuotaConfig] = useState<QuotaConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUOTAS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading quotas', e);
    }
    return DEFAULT_QUOTA_CONFIG;
  });

  const [selectedRouteDay, setSelectedRouteDay] = useState<RouteDay>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROUTE_DAY);
      if (saved) return saved as RouteDay;
    } catch (e) {
      console.error('Error loading route day', e);
    }
    return getTodayRouteDay();
  });

  const [activeTicketOrder, setActiveTicketOrder] = useState<Order | null>(null);
  const [posCustomer, setPosCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Firebase Cloud state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.LAST_SYNC)
  );
  const [lastRealtimeUpdate, setLastRealtimeUpdate] = useState<string>(() =>
    new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // LocalStorage persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES_USERS, JSON.stringify(salesUsers));
  }, [salesUsers]);

  useEffect(() => {
    if (currentSalesUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentSalesUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentSalesUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(companyConfig));
  }, [companyConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUOTAS, JSON.stringify(quotaConfig));
  }, [quotaConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROUTE_DAY, selectedRouteDay);
  }, [selectedRouteDay]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore listeners when authenticated (sales_users, customers, orders)
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) return;

    const uid = firebaseUser.uid;
    const touchRealtimeStamp = () => {
      setLastRealtimeUpdate(
        new Date().toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    const qSalesUsers = query(collection(db, 'sales_users'), where('ownerId', '==', uid));
    const unsubSalesUsers = onSnapshot(
      qSalesUsers,
      snapshot => {
        if (!snapshot.empty) {
          const cloudUsers: SalesUser[] = snapshot.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              sellerCode: data.sellerCode,
              username: data.username,
              accessPin: data.accessPin,
              fullName: data.fullName,
              role: data.role,
              phone: data.phone,
              assignedZone: data.assignedZone,
              salesGoalSoles: Number(data.salesGoalSoles) || 0,
              active: Boolean(data.active),
              createdAt: new Date().toISOString(),
            };
          });
          setSalesUsers(prev => {
            const merged = [...prev];
            cloudUsers.forEach(cu => {
              const idx = merged.findIndex(u => u.id === cu.id || u.sellerCode === cu.sellerCode);
              if (idx >= 0) merged[idx] = cu;
              else merged.push(cu);
            });
            return merged;
          });
          touchRealtimeStamp();
        }
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'sales_users');
      }
    );

    const qCustomers = query(collection(db, 'customers'), where('ownerId', '==', uid));
    const unsubCustomers = onSnapshot(
      qCustomers,
      snapshot => {
        if (!snapshot.empty) {
          setCustomers(prev => {
            const merged = [...prev];
            snapshot.docs.forEach(d => {
              const data = d.data();
              const idx = merged.findIndex(c => c.id === d.id || c.code === data.code);
              if (idx >= 0) {
                merged[idx] = {
                  ...merged[idx],
                  visitStatus: data.visitStatus || merged[idx].visitStatus,
                  assignedSellerCode: data.assignedSellerCode || merged[idx].assignedSellerCode,
                };
              }
            });
            return merged;
          });
          touchRealtimeStamp();
        }
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'customers');
      }
    );

    const qOrders = query(collection(db, 'orders'), where('ownerId', '==', uid));
    const unsubOrders = onSnapshot(
      qOrders,
      snapshot => {
        if (!snapshot.empty) {
          setOrders(prev => {
            const merged = [...prev];
            snapshot.docs.forEach(d => {
              const data = d.data();
              const idx = merged.findIndex(
                o => o.id === d.id || o.orderNumber === data.orderNumber
              );
              if (idx >= 0) {
                merged[idx] = {
                  ...merged[idx],
                  status: data.status || merged[idx].status,
                  total: Number(data.total) || merged[idx].total,
                  sellerCode: data.sellerCode || merged[idx].sellerCode,
                  sellerName: data.sellerName || merged[idx].sellerName,
                  syncedToCloud: true,
                };
              }
            });
            return merged;
          });
          touchRealtimeStamp();
        }
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    return () => {
      unsubSalesUsers();
      unsubCustomers();
      unsubOrders();
    };
  }, [isAuthReady, firebaseUser]);

  // Helper to push a single customer to Firestore if logged in
  const pushCustomerToFirestore = useCallback(
    async (customer: Customer) => {
      if (!firebaseUser || !navigator.onLine) return;
      const docId = cleanId(customer.id);
      const path = `customers/${docId}`;
      try {
        await setDoc(doc(db, 'customers', docId), {
          ownerId: firebaseUser.uid,
          code: clampStr(customer.code, 2, 32, 'CLI-000').replace(/[^a-zA-Z0-9_-]/g, '-'),
          name: clampStr(customer.name, 2, 150, 'Bodega Cliente'),
          ownerName: clampStr(customer.ownerName, 1, 150, 'Titular'),
          documentType: customer.documentType === 'RUC' ? 'RUC' : 'DNI',
          documentNumber: clampStr(customer.documentNumber, 6, 20, '00000000'),
          phone: clampStr(customer.phone, 6, 30, '999999999'),
          address: clampStr(customer.address, 3, 250, 'Dirección Principal'),
          district: clampStr(customer.district, 2, 120, 'Lima'),
          reference: (customer.reference || '').slice(0, 250),
          routeDay: customer.routeDay,
          notes: (customer.notes || '').slice(0, 300),
          visitStatus: customer.visitStatus || 'pending',
          assignedSellerCode: (customer.assignedSellerCode || 'VEN-001').slice(0, 32),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [firebaseUser]
  );

  const pushProductToFirestore = useCallback(
    async (product: Product) => {
      if (!firebaseUser || !navigator.onLine) return;
      const docId = cleanId(product.id);
      const path = `products/${docId}`;
      try {
        await setDoc(doc(db, 'products', docId), {
          ownerId: firebaseUser.uid,
          code: clampStr(product.code, 2, 32, 'PROD-001').replace(/[^a-zA-Z0-9_-]/g, '-'),
          name: clampStr(product.name, 2, 180, 'Producto'),
          category: product.category,
          unit: product.unit,
          price: Math.max(0.1, Number(product.price) || 1),
          stock: Math.max(0, Number(product.stock) || 0),
          active: Boolean(product.active),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [firebaseUser]
  );

  const pushSalesUserToFirestore = useCallback(
    async (sUser: SalesUser) => {
      if (!firebaseUser || !navigator.onLine) return;
      const docId = cleanId(sUser.id);
      const path = `sales_users/${docId}`;
      try {
        await setDoc(doc(db, 'sales_users', docId), {
          ownerId: firebaseUser.uid,
          sellerCode: clampStr(sUser.sellerCode, 2, 32, 'VEN-001').replace(/[^a-zA-Z0-9_-]/g, '-'),
          username: clampStr(sUser.username, 3, 64, 'vendedor'),
          accessPin: clampStr(sUser.accessPin, 4, 64, '1234'),
          fullName: clampStr(sUser.fullName, 2, 120, 'Vendedor'),
          role: sUser.role,
          phone: clampStr(sUser.phone, 6, 30, '999999999'),
          assignedZone: clampStr(sUser.assignedZone, 2, 150, 'Lima'),
          salesGoalSoles: Math.max(0, Number(sUser.salesGoalSoles) || 0),
          active: Boolean(sUser.active),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [firebaseUser]
  );

  const pushOrderToFirestore = useCallback(
    async (order: Order, parentCustomer?: Customer) => {
      if (!firebaseUser || !navigator.onLine) return;
      const customerToEnsure =
        parentCustomer || customers.find(c => c.id === order.customerId);
      if (customerToEnsure) {
        await pushCustomerToFirestore(customerToEnsure);
      }

      const docId = cleanId(order.id);
      const path = `orders/${docId}`;
      const summary = order.items
        .map(i => `${i.quantity}x [${i.productCode}] ${i.productName} (S/ ${i.subtotal.toFixed(2)})`)
        .join('; ')
        .slice(0, 4000);

      try {
        await setDoc(doc(db, 'orders', docId), {
          ownerId: firebaseUser.uid,
          orderNumber: clampStr(order.orderNumber, 3, 40, 'PED-0001'),
          customerId: cleanId(order.customerId),
          customerCode: clampStr(order.customerCode, 2, 32, 'CLI-001'),
          customerName: clampStr(order.customerName, 2, 150, 'Cliente'),
          customerAddress: clampStr(order.customerAddress, 3, 250, 'Dirección'),
          customerPhone: clampStr(order.customerPhone, 6, 30, '999999999'),
          routeDay: order.routeDay,
          itemsSummary: clampStr(summary, 2, 4000, 'Productos varios'),
          total: Math.max(0, Number(order.total) || 0),
          paymentMethod: clampStr(order.paymentMethod, 3, 80, 'Efectivo'),
          sellerCode: clampStr(order.sellerCode || 'VEN-001', 2, 32, 'VEN-001'),
          sellerName: clampStr(order.sellerName, 2, 120, 'Preventista'),
          status: order.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [firebaseUser, customers, pushCustomerToFirestore]
  );

  // Sync all data to cloud
  const syncAllToCloud = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!firebaseUser) {
      return {
        success: false,
        message: 'Primero conecta tu cuenta de Google Cloud para sincronizar en la nube.',
      };
    }
    if (!navigator.onLine) {
      return {
        success: false,
        message: 'Estás en modo Offline. Los datos se sincronizarán cuando vuelva la conexión.',
      };
    }

    setIsSyncing(true);
    try {
      for (const sUser of salesUsers) {
        await pushSalesUserToFirestore(sUser);
      }
      for (const cust of customers) {
        await pushCustomerToFirestore(cust);
      }
      for (const prod of products) {
        await pushProductToFirestore(prod);
      }
      for (const ord of orders) {
        await pushOrderToFirestore(ord);
      }

      setOrders(prev => prev.map(o => ({ ...o, syncedToCloud: true })));
      const nowIso = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      setLastSyncedAt(nowIso);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, nowIso);
      setIsSyncing(false);
      return {
        success: true,
        message: `Sincronización exitosa (${customers.length} clientes, ${products.length} productos, ${orders.length} pedidos y ${salesUsers.length} usuarios).`,
      };
    } catch (e) {
      setIsSyncing(false);
      return {
        success: false,
        message: e instanceof Error ? e.message : 'Error durante la sincronización.',
      };
    }
  }, [
    firebaseUser,
    salesUsers,
    customers,
    products,
    orders,
    pushSalesUserToFirestore,
    pushCustomerToFirestore,
    pushProductToFirestore,
    pushOrderToFirestore,
  ]);

  const signInWithGoogleCloud = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOutGoogleCloud = async () => {
    await signOut(auth);
  };

  // Multi-user Sales Force Login
  const loginWithCredentials = (
    username: string,
    pin: string
  ): { success: boolean; error?: string } => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPin = pin.trim();

    const found = salesUsers.find(
      u =>
        (u.username.toLowerCase() === cleanUser || u.sellerCode.toLowerCase() === cleanUser) &&
        u.accessPin === cleanPin
    );

    if (!found) {
      return {
        success: false,
        error: 'Usuario/Código o contraseña incorrectos. Verifica tus credenciales.',
      };
    }

    if (!found.active) {
      return {
        success: false,
        error: 'Esta cuenta de vendedor está desactivada. Contacta al administrador.',
      };
    }

    setCurrentSalesUser(found);
    return { success: true };
  };

  const loginAsDemoUser = (user: SalesUser) => {
    setCurrentSalesUser(user);
  };

  const logoutSalesUser = () => {
    setCurrentSalesUser(null);
  };

  const openTicketModal = (order: Order) => {
    setActiveTicketOrder(order);
  };

  const closeTicketModal = () => {
    setActiveTicketOrder(null);
  };

  // SalesUser CRUD
  const addSalesUser = (data: Omit<SalesUser, 'id' | 'createdAt'>): SalesUser => {
    const newUser: SalesUser = {
      ...data,
      id: `su-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSalesUsers(prev => [newUser, ...prev]);
    void pushSalesUserToFirestore(newUser);
    return newUser;
  };

  const updateSalesUser = (id: string, data: Partial<SalesUser>) => {
    setSalesUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const updated = { ...u, ...data };
          void pushSalesUserToFirestore(updated);
          if (currentSalesUser?.id === id) {
            setCurrentSalesUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const deleteSalesUser = (id: string) => {
    setSalesUsers(prev => prev.filter(u => u.id !== id));
    if (firebaseUser && navigator.onLine) {
      const docId = cleanId(id);
      deleteDoc(doc(db, 'sales_users', docId)).catch(err =>
        handleFirestoreError(err, OperationType.DELETE, `sales_users/${docId}`)
      );
    }
  };

  // Customer Management
  const addCustomer = (data: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCustomer: Customer = {
      ...data,
      id: `c-${Date.now()}`,
      visitStatus: 'pending',
      assignedSellerCode: data.assignedSellerCode || currentSalesUser?.sellerCode || 'VEN-001',
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => [newCustomer, ...prev]);
    void pushCustomerToFirestore(newCustomer);
    return newCustomer;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updated = { ...c, ...data };
          void pushCustomerToFirestore(updated);
          return updated;
        }
        return c;
      })
    );
    if (posCustomer && posCustomer.id === id) {
      setPosCustomer(prev => (prev ? { ...prev, ...data } : null));
    }
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (posCustomer && posCustomer.id === id) {
      setPosCustomer(null);
    }
    if (firebaseUser && navigator.onLine) {
      const docId = cleanId(id);
      deleteDoc(doc(db, 'customers', docId)).catch(err =>
        handleFirestoreError(err, OperationType.DELETE, `customers/${docId}`)
      );
    }
  };

  const updateCustomerVisitStatus = (customerId: string, status: VisitStatus) => {
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === customerId) {
          const updated = { ...c, visitStatus: status };
          if (firebaseUser && navigator.onLine) {
            const docId = cleanId(customerId);
            updateDoc(doc(db, 'customers', docId), {
              visitStatus: status,
              updatedAt: serverTimestamp(),
            }).catch(() => {
              void pushCustomerToFirestore(updated);
            });
          }
          return updated;
        }
        return c;
      })
    );
  };

  // Product Management
  const addProduct = (data: Omit<Product, 'id'>): Product => {
    const newProduct: Product = {
      ...data,
      id: `p-${Date.now()}`,
    };
    setProducts(prev => [newProduct, ...prev]);
    void pushProductToFirestore(newProduct);
    return newProduct;
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, ...data };
          void pushProductToFirestore(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    if (firebaseUser && navigator.onLine) {
      const docId = cleanId(id);
      deleteDoc(doc(db, 'products', docId)).catch(err =>
        handleFirestoreError(err, OperationType.DELETE, `products/${docId}`)
      );
    }
  };

  // Order Management
  const createOrder = (data: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): Order => {
    const orderCount = orders.length + 41;
    const orderNumber = `PED-2026-${String(orderCount).padStart(4, '0')}`;
    const isOnlineNow = typeof navigator !== 'undefined' ? navigator.onLine : true;

    const newOrder: Order = {
      ...data,
      id: `ord-${Date.now()}`,
      orderNumber,
      sellerCode: currentSalesUser?.sellerCode || data.sellerCode || 'VEN-001',
      sellerName: currentSalesUser
        ? `${currentSalesUser.fullName} (${currentSalesUser.sellerCode})`
        : data.sellerName,
      syncedToCloud: Boolean(firebaseUser && isOnlineNow),
      createdAt: new Date().toISOString(),
    };

    setOrders(prev => [newOrder, ...prev]);

    // Ensure customer is in customers list or update status
    let targetCustomer: Customer | undefined;
    setCustomers(prev => {
      const exists = prev.some(c => c.id === data.customerId);
      if (!exists) {
        const createdQuickCust: Customer = {
          id: data.customerId,
          code: data.customerCode,
          name: data.customerName,
          ownerName: data.customerOwner,
          documentType: data.customerDocumentType,
          documentNumber: data.customerDocumentNumber,
          phone: data.customerPhone,
          address: data.customerAddress,
          district: data.customerDistrict,
          reference: data.customerReference,
          routeDay: data.routeDay,
          visitStatus: 'visited_order',
          assignedSellerCode: currentSalesUser?.sellerCode || 'VEN-001',
          lastOrderAmount: data.total,
          lastOrderId: newOrder.id,
          createdAt: new Date().toISOString(),
        };
        targetCustomer = createdQuickCust;
        return [createdQuickCust, ...prev];
      }
      return prev.map(c => {
        if (c.id === data.customerId) {
          const updated: Customer = {
            ...c,
            visitStatus: 'visited_order',
            lastOrderAmount: data.total,
            lastOrderId: newOrder.id,
          };
          targetCustomer = updated;
          return updated;
        }
        return c;
      });
    });

    // Decrement product stocks
    setProducts(prev =>
      prev.map(prod => {
        const item = data.items.find(i => i.productId === prod.id);
        if (item) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          return { ...prod, stock: newStock };
        }
        return prod;
      })
    );

    if (firebaseUser && isOnlineNow) {
      void pushOrderToFirestore(newOrder, targetCustomer);
    }

    openTicketModal(newOrder);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          const updated = { ...o, status };
          if (firebaseUser && navigator.onLine) {
            const docId = cleanId(orderId);
            updateDoc(doc(db, 'orders', docId), {
              status,
              updatedAt: serverTimestamp(),
            }).catch(() => {
              void pushOrderToFirestore(updated);
            });
          }
          return updated;
        }
        return o;
      })
    );
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    if (firebaseUser && navigator.onLine) {
      const docId = cleanId(orderId);
      deleteDoc(doc(db, 'orders', docId)).catch(err =>
        handleFirestoreError(err, OperationType.DELETE, `orders/${docId}`)
      );
    }
  };

  const updateCompanyConfig = (data: Partial<CompanyConfig>) => {
    setCompanyConfig(prev => ({ ...prev, ...data }));
  };

  const updateQuotaConfig = (data: Partial<QuotaConfig>) => {
    setQuotaConfig(prev => ({ ...prev, ...data }));
  };

  const updateCustomerQuota = (customerId: string, quotaSoles: number) => {
    setCustomers(prev =>
      prev.map(c => (c.id === customerId ? { ...c, dailyPurchaseQuotaSoles: quotaSoles } : c))
    );
  };

  const resetToInitialData = () => {
    setCustomers(INITIAL_CUSTOMERS);
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setSalesUsers(INITIAL_SALES_USERS);
    setCompanyConfig(DEFAULT_COMPANY_CONFIG);
    setQuotaConfig(DEFAULT_QUOTA_CONFIG);
    setSelectedRouteDay(getTodayRouteDay());
    setPosCustomer(null);
  };

  const exportDataAsJSON = (): string => {
    const payload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      companyConfig,
      quotaConfig,
      salesUsers,
      customers,
      products,
      orders,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importDataFromJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.customers && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      }
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
      }
      if (data.orders && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
      if (data.salesUsers && Array.isArray(data.salesUsers)) {
        setSalesUsers(data.salesUsers);
      }
      if (data.companyConfig) {
        setCompanyConfig(data.companyConfig);
      }
      if (data.quotaConfig) {
        setQuotaConfig(data.quotaConfig);
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  const pendingOfflineCount = orders.filter(o => o.syncedToCloud === false).length;

  return (
    <AppContext.Provider
      value={{
        customers,
        products,
        orders,
        salesUsers,
        companyConfig,
        quotaConfig,
        selectedRouteDay,
        setSelectedRouteDay,
        activeTicketOrder,
        openTicketModal,
        closeTicketModal,
        currentSalesUser,
        loginWithCredentials,
        loginAsDemoUser,
        logoutSalesUser,
        firebaseUser,
        isAuthReady,
        isSyncing,
        lastSyncedAt,
        lastRealtimeUpdate,
        pendingOfflineCount,
        signInWithGoogleCloud,
        signOutGoogleCloud,
        syncAllToCloud,
        addSalesUser,
        updateSalesUser,
        deleteSalesUser,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        updateCustomerVisitStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        createOrder,
        updateOrderStatus,
        deleteOrder,
        updateQuotaConfig,
        updateCustomerQuota,
        updateCompanyConfig,
        resetToInitialData,
        exportDataAsJSON,
        importDataFromJSON,
        posCustomer,
        setPosCustomer,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
