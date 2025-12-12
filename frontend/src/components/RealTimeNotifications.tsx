"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

interface Notification {
  id: string;
  type: "transaction" | "reward" | "security" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export default function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) return;

    // Connect to Socket.IO server
    const socketInstance = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
      {
        auth: { token },
        transports: ["websocket", "polling"],
      },
    );

    socketInstance.on("connect", () => {
      console.log("✅ Socket.IO connected");
      // Join user's room for targeted notifications
      socketInstance.emit("join-room", userId);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Socket.IO disconnected");
    });

    // Listen for transaction notifications
    socketInstance.on("transaction:created", (data) => {
      addNotification({
        type: "transaction",
        title: "New Transaction",
        message: `Transaction of ${data.amount} ${data.currency}`,
        timestamp: new Date(),
      });
    });

    // Listen for reward notifications
    socketInstance.on("reward:earned", (data) => {
      addNotification({
        type: "reward",
        title: "🎉 Reward Earned!",
        message: `You earned ${data.amount} tokens`,
        timestamp: new Date(),
      });
    });

    // Listen for security alerts
    socketInstance.on("security:alert", (data) => {
      addNotification({
        type: "security",
        title: "🔒 Security Alert",
        message: data.message,
        timestamp: new Date(),
      });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const addNotification = (notification: Omit<Notification, "id" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 10)); // Keep last 10

    // Show browser notification if permitted
    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/logo.png",
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "transaction":
        return "💸";
      case "reward":
        return "🎁";
      case "security":
        return "🔒";
      case "system":
        return "ℹ️";
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "transaction":
        return "bg-blue-100 border-blue-300";
      case "reward":
        return "bg-green-100 border-green-300";
      case "security":
        return "bg-red-100 border-red-300";
      case "system":
        return "bg-gray-100 border-gray-300";
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="text-lg font-semibold text-gray-800">
              Notifications
            </h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto mb-3 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="font-medium">No notifications yet</p>
                <p className="text-sm mt-1">
                  You&apos;ll see updates here when they arrive
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div
                    className={`flex items-start gap-3 p-3 rounded-lg border ${getNotificationColor(
                      notification.type,
                    )}`}
                  >
                    <span className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-sm">
                        {notification.title}
                      </h4>
                      <p className="text-gray-600 text-sm mt-1">
                        {notification.message}
                      </p>
                      <p className="text-gray-400 text-xs mt-2">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
