// Mock notification service for testing
// Prevents crashes when notifyAllAdmins() is called during tests

export const createNotification = jest.fn().mockResolvedValue({
  id: "mock-notification-id",
  userId: "mock-user-id",
  type: "email",
  category: "system",
  title: "Mock Notification",
  message: "Mock message",
  isRead: false,
  createdAt: new Date(),
});

export const notifyAllAdmins = jest.fn().mockResolvedValue([
  {
    id: "mock-notification-1",
    userId: "mock-admin-id",
    type: "all",
    category: "admin",
    title: "Mock Admin Notification",
    message: "Mock admin message",
    isRead: false,
    createdAt: new Date(),
  },
]);

export const sendEmailNotification = jest.fn().mockResolvedValue(true);
export const sendPushNotification = jest.fn().mockResolvedValue(true);
export const setSocketIO = jest.fn();

// Export all mocked functions
export default {
  createNotification,
  notifyAllAdmins,
  sendEmailNotification,
  sendPushNotification,
  setSocketIO,
};
