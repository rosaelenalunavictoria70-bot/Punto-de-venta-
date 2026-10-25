/**
 * Firestore Security Rules Test Suite - Validating Dirty Dozen Payloads
 * Verifies that all 12 adversarial payloads return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: {
    uid: string;
    email: string;
    email_verified: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Customer Creation',
    collection: 'customers',
    docId: 'c-101',
    operation: 'create',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: { ownerId: 'user_B', code: 'CLI-001', name: 'Bodega Test' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Spoofing on Admin Access',
    collection: 'customers',
    docId: 'c-101',
    operation: 'get',
    auth: {
      uid: 'spoof_uid',
      email: 'rosaelenalunavictoria70@gmail.com',
      email_verified: false,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Product Creation',
    collection: 'products',
    docId: 'p-101',
    operation: 'create',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      ownerId: 'user_A',
      code: 'BEB-001',
      name: 'Inca Kola',
      category: 'Bebidas',
      unit: 'Caja',
      price: 36.5,
      stock: 10,
      active: true,
      isSuperFeatured: true, // Ghost field
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Value Poisoning on Order Update',
    collection: 'orders',
    docId: 'ord-101',
    operation: 'update',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: { status: 'INVALID_STATUS_ENUM' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'ID Poisoning Attack with Special Characters',
    collection: 'customers',
    docId: 'invalid$id!with@spaces',
    operation: 'create',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: { ownerId: 'user_A' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Immortal Field Mutation (ownerId change)',
    collection: 'customers',
    docId: 'c-101',
    operation: 'update',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: { ownerId: 'user_C' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Client Timestamp Forgery on Order Creation',
    collection: 'orders',
    docId: 'ord-102',
    operation: 'create',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: { createdAt: '1999-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'PII Cross-Tenant Read Leak',
    collection: 'sales_users',
    docId: 'ven-001',
    operation: 'get',
    auth: { uid: 'user_B', email: 'b@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Self-Assigned Admin Escalation',
    collection: 'admins',
    docId: 'user_B',
    operation: 'create',
    auth: { uid: 'user_B', email: 'b@example.com', email_verified: true },
    payload: { uid: 'user_B', email: 'b@example.com' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Terminal State Re-opening on Cancelled Order',
    collection: 'orders',
    docId: 'ord-cancelled',
    operation: 'update',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: { status: 'pendiente_entrega' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Denial of Wallet Oversized Address String',
    collection: 'customers',
    docId: 'c-105',
    operation: 'create',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: { address: 'A'.repeat(5000) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unauthenticated Write Attempt',
    collection: 'orders',
    docId: 'ord-anon',
    operation: 'create',
    auth: null,
    payload: { total: 100 },
    expectedResult: 'PERMISSION_DENIED',
  },
];
