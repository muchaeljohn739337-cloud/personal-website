"use client";

import RequireRole from "@/components/RequireRole";
import {
  ArrowPathIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

const quickActions: QuickAction[] = [
  {
    id: "balance",
    label: "Check Balance",
    icon: <CurrencyDollarIcon className="w-5 h-5" />,
    prompt: "What is my current account balance and recent transactions?",
  },
  {
    id: "refund",
    label: "Request Refund",
    icon: <DocumentTextIcon className="w-5 h-5" />,
    prompt: "I would like to request a refund for a recent transaction.",
  },
  {
    id: "security",
    label: "Security Help",
    icon: <ShieldCheckIcon className="w-5 h-5" />,
    prompt: "I need help with account security and enabling 2FA.",
  },
  {
    id: "general",
    label: "General Question",
    icon: <QuestionMarkCircleIcon className="w-5 h-5" />,
    prompt: "I have a general question about my account.",
  },
];

export default function AIChatSupportPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(
    () => `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: `👋 Hello! I'm your AI-powered financial assistant. I can help you with:

• **Account inquiries** - Check balances, transactions, and statements
• **Refund requests** - Submit and track refund requests
• **Security assistance** - Enable 2FA, reset password, report suspicious activity
• **General support** - Answer questions about our services

How can I assist you today?`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Add typing indicator
    const typingId = `typing-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: typingId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isTyping: true,
      },
    ]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content.trim(),
          sessionId,
          history: messages.filter((m) => !m.isTyping).slice(-10), // Last 10 messages for context
        }),
      });

      const data = await response.json();

      // Remove typing indicator and add response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== typingId);
        return [
          ...filtered,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content:
              data.response ||
              "I apologize, but I couldn't process your request. Please try again.",
            timestamp: new Date(),
          },
        ];
      });
    } catch (error) {
      console.error("Chat error:", error);
      // Remove typing indicator and add error message
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== typingId);
        return [
          ...filtered,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content:
              "I'm experiencing technical difficulties. Please try again or contact support directly.",
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.prompt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-new",
        role: "assistant",
        content: "Chat cleared. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <RequireRole roles={["user", "admin"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Support Assistant
                </h1>
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Online - Powered by AI
                </p>
              </div>
            </div>

            <button
              onClick={clearChat}
              title="Clear chat history"
              aria-label="Clear chat history"
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === "user"
                        ? "bg-blue-600"
                        : "bg-gradient-to-br from-purple-500 to-blue-600"
                    }`}
                  >
                    {message.role === "user" ? (
                      <UserCircleIcon className="w-5 h-5 text-white" />
                    ) : (
                      <SparklesIcon className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[75%] ${
                      message.role === "user"
                        ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-200 dark:border-gray-700"
                    } px-4 py-3`}
                  >
                    {message.isTyping ? (
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    ) : (
                      <>
                        <div
                          className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: message.content
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\n/g, "<br />"),
                          }}
                        />
                        <p
                          className={`text-xs mt-2 ${
                            message.role === "user"
                              ? "text-blue-200"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (show when no user messages yet) */}
          {messages.length <= 1 && (
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Quick actions:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                  >
                    <div className="text-blue-600 dark:text-blue-400">
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <PaperAirplaneIcon className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
              AI responses are for informational purposes. For urgent issues,
              contact support directly.
            </p>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
