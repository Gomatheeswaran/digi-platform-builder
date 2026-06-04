"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Card, Input, Button, Typography, Spin, Empty, Tag } from "antd";
import { SendOutlined, CustomerServiceOutlined, RobotOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

interface Message {
  _id: string;
  tenantId: string;
  fromAdmin: boolean;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await fetch("/api/support/messages");
    const data = await res.json();
    setMessages(data.messages || []);
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => fetchMessages(true), 8000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!text.trim() || sending) return;
    setSending(true);
    await fetch("/api/support/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text.trim() }),
    });
    setText("");
    await fetchMessages(true);
    setSending(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
          <CustomerServiceOutlined className="text-lg" />
        </div>
        <div>
          <Title level={4} className="!mb-0">Support</Title>
          <Text className="text-slate-400 text-sm">Chat with the platform team</Text>
        </div>
        <Tag color="green" className="ml-auto">Online</Tag>
      </div>

      {/* Chat window */}
      <Card
        className="!rounded-xl !border-slate-200"
        styles={{ body: { padding: 0 } }}
      >
        {/* Messages area */}
        <div
          className="overflow-y-auto p-4 space-y-3 bg-slate-50"
          style={{ height: 480 }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Spin />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-slate-400 text-sm">
                    No messages yet. Send us a message and we&apos;ll get back to you!
                  </span>
                }
              />
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex gap-2 ${msg.fromAdmin ? "justify-start" : "justify-end"}`}
                >
                  {msg.fromAdmin && (
                    <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <RobotOutlined className="text-red-500 text-xs" />
                    </div>
                  )}
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl text-sm ${
                      msg.fromAdmin
                        ? "bg-white text-slate-800 border border-slate-200 rounded-tl-sm"
                        : "bg-blue-600 text-white rounded-tr-sm"
                    }`}
                  >
                    <p className="m-0 whitespace-pre-wrap break-words">{msg.message}</p>
                    <p
                      className={`m-0 text-xs mt-1 ${
                        msg.fromAdmin ? "text-slate-400" : "text-blue-200"
                      }`}
                    >
                      {dayjs(msg.createdAt).fromNow()}
                    </p>
                  </div>
                  {!msg.fromAdmin && (
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <UserOutlined className="text-blue-600 text-xs" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-200 bg-white rounded-b-xl">
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
              placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
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
          <Text className="text-xs text-slate-400 mt-1 block">
            We typically reply within a few hours during business hours.
          </Text>
        </div>
      </Card>
    </div>
  );
}
