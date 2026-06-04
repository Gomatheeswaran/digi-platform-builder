"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Card, Input, Button, Typography, Spin, Empty, Badge, Tag, List, Avatar,
} from "antd";
import {
  SendOutlined, UserOutlined, RobotOutlined, CustomerServiceOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

interface Thread {
  _id: string;
  unreadCount: number;
  lastActivity: string;
  totalMessages: number;
  lastMessage: {
    message: string;
    fromAdmin: boolean;
  };
  tenant: {
    _id: string;
    name: string;
    email: string;
    plan: string;
  };
}

interface Message {
  _id: string;
  fromAdmin: boolean;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function AdminSupportPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedThread = threads.find((t) => t._id === selectedId);

  const fetchThreads = useCallback(async (silent = false) => {
    if (!silent) setLoadingThreads(true);
    const res = await fetch("/api/support/threads");
    const data = await res.json();
    setThreads(data.threads || []);
    if (!silent) setLoadingThreads(false);
  }, []);

  const fetchMessages = useCallback(async (tenantId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    const res = await fetch(`/api/support/messages?tenantId=${tenantId}`);
    const data = await res.json();
    setMessages(data.messages || []);
    if (!silent) setLoadingMessages(false);
    // After reading, refresh threads to clear badge
    fetchThreads(true);
  }, [fetchThreads]);

  // Initial load + polling
  useEffect(() => {
    fetchThreads();
    const interval = setInterval(() => {
      fetchThreads(true);
      if (selectedId) fetchMessages(selectedId, true);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchThreads, fetchMessages, selectedId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function selectTenant(id: string) {
    setSelectedId(id);
    setMessages([]);
    fetchMessages(id);
  }

  async function sendMessage() {
    if (!text.trim() || !selectedId || sending) return;
    setSending(true);
    await fetch("/api/support/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text.trim(), tenantId: selectedId }),
    });
    setText("");
    await fetchMessages(selectedId, true);
    setSending(false);
  }

  return (
    <div>
      <div className="mb-4">
        <Title level={3} className="!mb-1">
          <CustomerServiceOutlined className="mr-2 text-blue-500" />
          Support Inbox
        </Title>
        <Text className="text-slate-400">Chat with tenants — reply to their queries</Text>
      </div>

      <div className="flex gap-4" style={{ height: "calc(100vh - 180px)", minHeight: 500 }}>
        {/* Thread list */}
        <Card
          className="!rounded-xl !border-slate-200 flex-shrink-0 overflow-hidden"
          style={{ width: 280 }}
          styles={{ body: { padding: 0, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" } }}
        >
          <div className="p-3 border-b border-slate-100">
            <Text className="font-medium text-slate-700 text-sm">Conversations</Text>
          </div>
          <div className="overflow-y-auto flex-1">
            {loadingThreads ? (
              <div className="flex justify-center py-8"><Spin /></div>
            ) : threads.length === 0 ? (
              <div className="p-4">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No messages yet" />
              </div>
            ) : (
              <List
                dataSource={threads}
                renderItem={(t) => (
                  <List.Item
                    key={t._id}
                    className={`!px-3 !py-2.5 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors ${
                      selectedId === t._id ? "!bg-blue-50" : ""
                    }`}
                    onClick={() => selectTenant(t._id)}
                  >
                    <div className="flex items-start gap-2 w-full min-w-0">
                      <Badge count={t.unreadCount} size="small">
                        <Avatar
                          size={36}
                          style={{ backgroundColor: "#1677ff", flexShrink: 0 }}
                          icon={<UserOutlined />}
                        />
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <Text className="font-medium text-sm truncate">{t.tenant.name}</Text>
                          <Text className="text-xs text-slate-400 flex-shrink-0">
                            {dayjs(t.lastActivity).fromNow()}
                          </Text>
                        </div>
                        <Text className="text-xs text-slate-400 truncate block">
                          {t.lastMessage.fromAdmin ? "You: " : ""}{t.lastMessage.message}
                        </Text>
                        <Tag
                          className="text-xs mt-0.5"
                          color={t.tenant.plan === "pro" ? "purple" : t.tenant.plan === "starter" ? "blue" : "default"}
                        >
                          {t.tenant.plan}
                        </Tag>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </div>
        </Card>

        {/* Chat area */}
        <Card
          className="!rounded-xl !border-slate-200 flex-1 overflow-hidden"
          styles={{ body: { padding: 0, height: "100%", display: "flex", flexDirection: "column" } }}
        >
          {!selectedThread ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <CustomerServiceOutlined className="text-4xl" />
              <Text type="secondary">Select a conversation to reply</Text>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
                <Avatar style={{ backgroundColor: "#1677ff" }} icon={<UserOutlined />} />
                <div>
                  <div className="font-medium text-slate-800">{selectedThread.tenant.name}</div>
                  <div className="text-xs text-slate-400">{selectedThread.tenant.email}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-full"><Spin /></div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No messages" />
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex gap-2 ${msg.fromAdmin ? "justify-end" : "justify-start"}`}
                      >
                        {!msg.fromAdmin && (
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                            <UserOutlined className="text-blue-600 text-xs" />
                          </div>
                        )}
                        <div
                          className={`max-w-sm px-3 py-2 rounded-2xl text-sm ${
                            msg.fromAdmin
                              ? "bg-blue-600 text-white rounded-tr-sm"
                              : "bg-white text-slate-800 border border-slate-200 rounded-tl-sm"
                          }`}
                        >
                          <p className="m-0 whitespace-pre-wrap break-words">{msg.message}</p>
                          <p className={`m-0 text-xs mt-1 ${msg.fromAdmin ? "text-blue-200" : "text-slate-400"}`}>
                            {dayjs(msg.createdAt).fromNow()}
                          </p>
                        </div>
                        {msg.fromAdmin && (
                          <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                            <RobotOutlined className="text-red-500 text-xs" />
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-slate-200 bg-white flex-shrink-0">
                <div className="flex gap-2">
                  <Input.TextArea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Reply to tenant… (Enter to send)"
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    className="flex-1 !rounded-lg"
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    loading={sending}
                    disabled={!text.trim()}
                    className="!rounded-lg self-end"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
