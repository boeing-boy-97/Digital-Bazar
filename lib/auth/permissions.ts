// Shop Employee Roles & Permissions - Real RBAC per point 10
// Roles: MANAGER, ORDER_PICKER, INVENTORY_MANAGER, CASHIER

export const SHOP_ROLES = {
  OWNER: 'owner', // Implicit from Shop.ownerId
  MANAGER: 'manager',
  ORDER_PICKER: 'order_picker',
  INVENTORY_MANAGER: 'inventory_manager',
  CASHIER: 'cashier'
} as const;

export type ShopRole = typeof SHOP_ROLES[keyof typeof SHOP_ROLES];

export const PERMISSIONS = {
  // Orders
  ORDERS_READ: 'orders.read',
  ORDERS_ACCEPT: 'orders.accept',
  ORDERS_PREPARE: 'orders.prepare',
  ORDERS_PICK: 'orders.pick',
  ORDERS_COMPLETE: 'orders.complete',
  ORDERS_REJECT: 'orders.reject',
  ORDERS_VIEW: 'order_view', // legacy compat

  // Inventory
  INVENTORY_READ: 'inventory.read',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_RECEIVE: 'inventory.receive',

  // Products
  PRODUCTS_READ: 'products.read',
  PRODUCTS_MANAGE: 'products.manage',

  // Employees
  EMPLOYEES_READ: 'employees.read',
  EMPLOYEES_MANAGE: 'employees.manage',

  // Settings
  SETTINGS_MANAGE: 'settings.manage',

  // Billing
  BILLING_READ: 'billing.read',
  BILLING_MANAGE: 'billing.manage',

  // Customers
  CUSTOMERS_READ: 'customers.read',

  // Analytics
  ANALYTICS_READ: 'analytics.read'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role -> Permissions mapping
export const ROLE_PERMISSIONS: Record<ShopRole, Permission[]> = {
  [SHOP_ROLES.OWNER]: Object.values(PERMISSIONS), // All

  [SHOP_ROLES.MANAGER]: [
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_ACCEPT,
    PERMISSIONS.ORDERS_PREPARE,
    PERMISSIONS.ORDERS_PICK,
    PERMISSIONS.ORDERS_COMPLETE,
    PERMISSIONS.ORDERS_REJECT,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_RECEIVE,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_MANAGE,
    PERMISSIONS.EMPLOYEES_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.SETTINGS_MANAGE
  ],

  [SHOP_ROLES.ORDER_PICKER]: [
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_PICK,
    PERMISSIONS.ORDERS_PREPARE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.PRODUCTS_READ
  ],

  [SHOP_ROLES.INVENTORY_MANAGER]: [
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_RECEIVE,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_MANAGE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_VIEW
  ],

  [SHOP_ROLES.CASHIER]: [
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_COMPLETE,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.PRODUCTS_READ
  ]
};

// Order status -> required permission
export const ORDER_STATUS_PERMISSIONS: Record<string, Permission[]> = {
  ACCEPTED: [PERMISSIONS.ORDERS_ACCEPT, PERMISSIONS.ORDERS_READ],
  REJECTED: [PERMISSIONS.ORDERS_ACCEPT, PERMISSIONS.ORDERS_REJECT],
  PREPARING: [PERMISSIONS.ORDERS_PREPARE, PERMISSIONS.ORDERS_PICK],
  READY_FOR_PICKUP: [PERMISSIONS.ORDERS_COMPLETE, PERMISSIONS.ORDERS_PREPARE],
  COMPLETED: [PERMISSIONS.ORDERS_COMPLETE],
  CANCELLED: [PERMISSIONS.ORDERS_ACCEPT] // Manager can cancel
};

export function hasPermission(role: ShopRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

export function hasAnyPermission(role: ShopRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

export function getRolePermissions(role: ShopRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Validate shop employee membership and permission - server-side, never trust browser per point 9
export async function validateShopAccess(
  prisma: any,
  shopId: string,
  userId: string,
  requiredPermissions: Permission[]
): Promise<{ allowed: boolean; role?: ShopRole; reason?: string }> {
  // Check owner
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { ownerId: true } });
  if (!shop) return { allowed: false, reason: 'Shop not found' };
  if (shop.ownerId === userId) return { allowed: true, role: SHOP_ROLES.OWNER as ShopRole };

  // Check member
  const member = await prisma.shopMember.findFirst({
    where: { shopId, userId, isActive: true }
  });
  if (!member) return { allowed: false, reason: 'Not a member of this shop' };

  const role = member.permission as ShopRole;
  const rolePerms = ROLE_PERMISSIONS[role] || [];

  // Manager has all manager perms, but check if required perms are subset
  const hasRequired = requiredPermissions.every(rp => rolePerms.includes(rp));

  if (!hasRequired) {
    return { allowed: false, role, reason: `Insufficient permission: need ${requiredPermissions.join(', ')}, has ${role}` };
  }

  return { allowed: true, role };
}
