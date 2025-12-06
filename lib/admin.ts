/**
 * Admin Management Utilities
 * Full control over users, content, and system settings
 */

import { prisma } from './prismaClient';
import { sendSuspensionEmail, sendUnsuspensionEmail } from './email';

// =============================================================================
// USER MANAGEMENT
// =============================================================================

// Get all users with pagination and filters
export async function getUsers(options: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isSuspended?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    role,
    isSuspended,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isSuspended !== undefined) {
    where.isSuspended = isSuspended;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isSuspended: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            wallets: true,
            medBedBookings: true,
            cryptoPayments: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Get single user with full details
export async function getUserDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tokenWallet: true,
      userRewards: true,
      healthProfile: true,
      suspensions: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      actionsReceived: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { admin: { select: { name: true, email: true } } },
      },
      cryptoPayments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      medBedBookings: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { facility: true },
      },
      _count: {
        select: {
          wallets: true,
          sentTransactions: true,
          receivedTransactions: true,
          medBedSessions: true,
          cryptoPayments: true,
        },
      },
    },
  });

  return user;
}

// Update user
export async function updateUser(
  adminId: string,
  userId: string,
  data: {
    name?: string;
    email?: string;
    role?: string;
    isVerified?: boolean;
    phone?: string;
  },
  ipAddress?: string
) {
  const oldUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!oldUser) throw new Error('User not found');

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: data as never,
  });

  // Log admin action
  await logAdminAction(adminId, {
    action: 'USER_UPDATE',
    targetUserId: userId,
    description: `Updated user ${oldUser.email}`,
    metadata: { changes: data, oldValues: { name: oldUser.name, email: oldUser.email, role: oldUser.role } },
    ipAddress,
  });

  return updatedUser;
}

// Change user role
export async function changeUserRole(
  adminId: string,
  userId: string,
  newRole: string,
  ipAddress?: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const oldRole = user.role;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole as never },
  });

  await logAdminAction(adminId, {
    action: 'USER_ROLE_CHANGE',
    targetUserId: userId,
    description: `Changed role from ${oldRole} to ${newRole}`,
    metadata: { oldRole, newRole },
    ipAddress,
  });

  return updatedUser;
}

// Suspend user
export async function suspendUser(
  adminId: string,
  userId: string,
  data: {
    reason: string;
    type: 'WARNING' | 'TEMPORARY' | 'PERMANENT' | 'REVIEW';
    endDate?: Date;
  },
  ipAddress?: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // Create suspension record
  const suspension = await prisma.userSuspension.create({
    data: {
      userId,
      adminId,
      reason: data.reason,
      type: data.type,
      endDate: data.endDate,
    },
  });

  // Update user status
  await prisma.user.update({
    where: { id: userId },
    data: { isSuspended: true },
  });

  // Log action
  await logAdminAction(adminId, {
    action: 'USER_SUSPEND',
    targetUserId: userId,
    description: `Suspended user: ${data.reason}`,
    metadata: { suspensionId: suspension.id, type: data.type, endDate: data.endDate },
    ipAddress,
  });

  // Send email notification
  try {
    await sendSuspensionEmail(user, data.reason, data.type, data.endDate);
  } catch (e) {
    console.error('Failed to send suspension email:', e);
  }

  return suspension;
}

// Unsuspend user
export async function unsuspendUser(
  adminId: string,
  userId: string,
  reason: string,
  ipAddress?: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // Update active suspensions
  await prisma.userSuspension.updateMany({
    where: { userId, isActive: true },
    data: {
      isActive: false,
      liftedAt: new Date(),
      liftedBy: adminId,
      liftReason: reason,
    },
  });

  // Update user status
  await prisma.user.update({
    where: { id: userId },
    data: { isSuspended: false },
  });

  // Log action
  await logAdminAction(adminId, {
    action: 'USER_UNSUSPEND',
    targetUserId: userId,
    description: `Unsuspended user: ${reason}`,
    ipAddress,
  });

  // Send email notification
  try {
    await sendUnsuspensionEmail(user);
  } catch (e) {
    console.error('Failed to send unsuspension email:', e);
  }

  return { success: true };
}

// Delete user
export async function deleteUser(adminId: string, userId: string, ipAddress?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // Log action before deletion
  await logAdminAction(adminId, {
    action: 'USER_DELETE',
    targetUserId: userId,
    description: `Deleted user ${user.email}`,
    metadata: { deletedUserData: { name: user.name, email: user.email, role: user.role } },
    ipAddress,
  });

  // Delete user (cascades to related records)
  await prisma.user.delete({ where: { id: userId } });

  return { success: true };
}

// Verify user email
export async function verifyUser(adminId: string, userId: string, ipAddress?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  await prisma.user.update({
    where: { id: userId },
    data: {
      isVerified: true,
      emailVerified: new Date(),
    },
  });

  await logAdminAction(adminId, {
    action: 'USER_VERIFY',
    targetUserId: userId,
    description: `Manually verified user ${user.email}`,
    ipAddress,
  });

  return { success: true };
}

// =============================================================================
// WALLET MANAGEMENT
// =============================================================================

// Adjust user's token balance
export async function adjustTokenBalance(
  adminId: string,
  userId: string,
  amount: number,
  reason: string,
  ipAddress?: string
) {
  const wallet = await prisma.tokenWallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error('Wallet not found');

  const oldBalance = Number(wallet.balance);
  const newBalance = oldBalance + amount;

  if (newBalance < 0) {
    throw new Error('Adjustment would result in negative balance');
  }

  // Update wallet
  await prisma.tokenWallet.update({
    where: { id: wallet.id },
    data: {
      balance: newBalance,
      ...(amount > 0 ? { lifetimeEarned: { increment: amount } } : { lifetimeSpent: { increment: Math.abs(amount) } }),
    },
  });

  // Create transaction record
  await prisma.tokenTransaction.create({
    data: {
      walletId: wallet.id,
      type: amount > 0 ? 'BONUS' : 'FEE',
      amount,
      balanceAfter: newBalance,
      description: `Admin adjustment: ${reason}`,
      metadata: { adminId, reason },
    },
  });

  // Log action
  await logAdminAction(adminId, {
    action: 'WALLET_ADJUST',
    targetUserId: userId,
    description: `Adjusted balance by ${amount}: ${reason}`,
    metadata: { oldBalance, newBalance, amount, reason },
    ipAddress,
  });

  return { oldBalance, newBalance, amount };
}

// =============================================================================
// SYSTEM SETTINGS
// =============================================================================

// Get all settings
export async function getSettings(category?: string) {
  return prisma.systemSetting.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  });
}

// Get single setting
export async function getSetting(key: string) {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (!setting) return null;

  // Parse value based on type
  switch (setting.type) {
    case 'NUMBER':
      return Number(setting.value);
    case 'BOOLEAN':
      return setting.value === 'true';
    case 'JSON':
      return JSON.parse(setting.value);
    default:
      return setting.value;
  }
}

// Update setting
export async function updateSetting(
  adminId: string,
  key: string,
  value: string | number | boolean | object,
  ipAddress?: string
) {
  const oldSetting = await prisma.systemSetting.findUnique({ where: { key } });

  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  const setting = await prisma.systemSetting.upsert({
    where: { key },
    update: { value: stringValue, updatedBy: adminId },
    create: {
      key,
      value: stringValue,
      type: typeof value === 'number' ? 'NUMBER' : typeof value === 'boolean' ? 'BOOLEAN' : typeof value === 'object' ? 'JSON' : 'STRING',
      updatedBy: adminId,
    },
  });

  await logAdminAction(adminId, {
    action: 'SETTING_CHANGE',
    description: `Updated setting ${key}`,
    metadata: { key, oldValue: oldSetting?.value, newValue: stringValue },
    ipAddress,
  });

  return setting;
}

// =============================================================================
// ADMIN ACTION LOGGING
// =============================================================================

interface LogActionParams {
  action: string;
  targetUserId?: string;
  resourceType?: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAdminAction(adminId: string, params: LogActionParams) {
  return prisma.adminAction.create({
    data: {
      adminId,
      targetUserId: params.targetUserId,
      action: params.action as never,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      description: params.description,
      metadata: params.metadata as object | undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

// Get admin action logs
export async function getAdminLogs(options: {
  adminId?: string;
  targetUserId?: string;
  action?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { adminId, targetUserId, action, page = 1, limit = 50 } = options;

  const where: Record<string, unknown> = {};
  if (adminId) where.adminId = adminId;
  if (targetUserId) where.targetUserId = targetUserId;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.adminAction.findMany({
      where,
      include: {
        admin: { select: { name: true, email: true } },
        targetUser: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adminAction.count({ where }),
  ]);

  return { logs, total, page, limit };
}

// =============================================================================
// DASHBOARD STATS
// =============================================================================

export async function getAdminDashboardStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    newUsersToday,
    newUsersThisMonth,
    suspendedUsers,
    totalPayments,
    paymentsThisMonth,
    totalBookings,
    activeBookings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.user.count({ where: { isSuspended: true } }),
    prisma.cryptoPayment.count({ where: { status: 'FINISHED' } }),
    prisma.cryptoPayment.count({ where: { status: 'FINISHED', createdAt: { gte: thisMonth } } }),
    prisma.medBedBooking.count(),
    prisma.medBedBooking.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] } } }),
  ]);

  return {
    users: {
      total: totalUsers,
      newToday: newUsersToday,
      newThisMonth: newUsersThisMonth,
      suspended: suspendedUsers,
    },
    payments: {
      total: totalPayments,
      thisMonth: paymentsThisMonth,
    },
    bookings: {
      total: totalBookings,
      active: activeBookings,
    },
  };
}
