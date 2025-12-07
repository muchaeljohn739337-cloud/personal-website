// User Approval System
// New users must be approved by admin before they can sign in

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PendingUser {
  id: string;
  email: string;
  name?: string;
  registeredAt: Date;
  status: ApprovalStatus;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory store (in production, use database)
const pendingUsers: Map<string, PendingUser> = new Map();

/**
 * Register a new user for approval
 */
export function registerForApproval(userData: {
  id: string;
  email: string;
  name?: string;
  ipAddress?: string;
  userAgent?: string;
}): PendingUser {
  const pendingUser: PendingUser = {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    registeredAt: new Date(),
    status: 'pending',
    ipAddress: userData.ipAddress,
    userAgent: userData.userAgent,
  };

  pendingUsers.set(userData.id, pendingUser);
  console.log(`[UserApproval] New user registered for approval: ${userData.email}`);

  return pendingUser;
}

/**
 * Check if user is approved
 */
export function isUserApproved(userId: string): boolean {
  const user = pendingUsers.get(userId);
  return user?.status === 'approved';
}

/**
 * Check if user is pending
 */
export function isUserPending(userId: string): boolean {
  const user = pendingUsers.get(userId);
  return user?.status === 'pending';
}

/**
 * Check if user is rejected
 */
export function isUserRejected(userId: string): boolean {
  const user = pendingUsers.get(userId);
  return user?.status === 'rejected';
}

/**
 * Get user approval status
 */
export function getUserApprovalStatus(userId: string): ApprovalStatus | null {
  const user = pendingUsers.get(userId);
  return user?.status || null;
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): PendingUser | undefined {
  return Array.from(pendingUsers.values()).find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Approve a user
 */
export function approveUser(userId: string, adminId: string): PendingUser | null {
  const user = pendingUsers.get(userId);
  if (!user) return null;

  user.status = 'approved';
  user.reviewedAt = new Date();
  user.reviewedBy = adminId;

  console.log(`[UserApproval] User approved: ${user.email} by ${adminId}`);
  return user;
}

/**
 * Reject a user
 */
export function rejectUser(userId: string, adminId: string, reason?: string): PendingUser | null {
  const user = pendingUsers.get(userId);
  if (!user) return null;

  user.status = 'rejected';
  user.reviewedAt = new Date();
  user.reviewedBy = adminId;
  user.rejectionReason = reason;

  console.log(`[UserApproval] User rejected: ${user.email} by ${adminId}`);
  return user;
}

/**
 * Get all pending users
 */
export function getPendingUsers(): PendingUser[] {
  return Array.from(pendingUsers.values())
    .filter((u) => u.status === 'pending')
    .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime());
}

/**
 * Get all users (for admin)
 */
export function getAllUsers(): PendingUser[] {
  return Array.from(pendingUsers.values()).sort(
    (a, b) => b.registeredAt.getTime() - a.registeredAt.getTime()
  );
}

/**
 * Get approval stats
 */
export function getApprovalStats(): {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
} {
  const users = Array.from(pendingUsers.values());
  return {
    pending: users.filter((u) => u.status === 'pending').length,
    approved: users.filter((u) => u.status === 'approved').length,
    rejected: users.filter((u) => u.status === 'rejected').length,
    total: users.length,
  };
}

/**
 * Get pending approval message for user
 */
export function getPendingMessage(): string {
  return `Thank you for registering with Advancia PayLedger! 🎉

Your account is currently being reviewed by our team. This is a standard security measure to ensure the safety of all our users.

Please check back shortly - we typically review new accounts within 24 hours.

If you have any questions, please contact our support team.

We appreciate your patience and look forward to welcoming you to our platform!`;
}

/**
 * Get rejection message for user
 */
export function getRejectionMessage(reason?: string): string {
  const baseMessage = `We're sorry, but your account registration could not be approved at this time.`;

  if (reason) {
    return `${baseMessage}\n\nReason: ${reason}\n\nIf you believe this is an error, please contact our support team.`;
  }

  return `${baseMessage}\n\nIf you believe this is an error or would like more information, please contact our support team.`;
}
