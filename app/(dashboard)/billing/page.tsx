"use client";
import { useEffect, useState } from "react";
import {
  Card, Row, Col, Typography, Button, Tag, List, Table, Spin, App,
} from "antd";
import {
  CheckCircleFilled, CrownOutlined, RocketOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import Script from "next/script";

const { Title, Text } = Typography;

interface AppRow {
  _id: string;
  name: string;
  template: string;
  plan: string;
  status: string;
  customDomain: string | null;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const FEATURES_FREE = [
  "Build unlimited apps",
  "All 6 templates",
  "Preview & test your app",
  "Full drag-drop builder",
  "Data management",
];

const FEATURES_HOSTED = [
  "Everything in Free",
  "Custom domain (myshop.com)",
  "Auto SSL certificate",
  "nginx config managed",
  "Instant deploy + live URL",
  "Priority support",
];

export default function BillingPage() {
  const { message } = App.useApp();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [rzpReady, setRzpReady] = useState(false);

  useEffect(() => {
    fetch("/api/apps")
      .then((r) => r.json())
      .then((data) => setApps(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(app: AppRow) {
    if (!rzpReady) {
      message.error("Payment system is loading. Please try again in a moment.");
      return;
    }

    setUpgrading(app._id);
    try {
      const res = await fetch("/api/billing/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: app._id }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error);

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "App Platform",
        description: `Custom Domain Hosting — ${order.appName}`,
        prefill: { name: order.userName, email: order.userEmail },
        theme: { color: "#1677ff" },
        handler: async (response: Record<string, string>) => {
          try {
            const verifyRes = await fetch("/api/billing/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                appId: app._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error);

            message.success(`${app.name} upgraded to Hosted plan!`);
            setApps((prev) =>
              prev.map((a) => (a._id === app._id ? { ...a, plan: "hosted" } : a))
            );
          } catch (e) {
            message.error(e instanceof Error ? e.message : "Payment verification failed.");
          } finally {
            setUpgrading(null);
          }
        },
        modal: {
          ondismiss: () => setUpgrading(null),
        },
      });
      rzp.open();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Could not start checkout.");
      setUpgrading(null);
    }
  }

  const columns = [
    { title: "App", dataIndex: "name", key: "name", render: (name: string) => <span className="font-medium">{name}</span> },
    { title: "Template", dataIndex: "template", key: "template", render: (t: string) => <Tag>{t}</Tag> },
    {
      title: "Domain",
      dataIndex: "customDomain",
      key: "customDomain",
      render: (d: string | null) => d ? <Text className="text-blue-600">{d}</Text> : <Text type="secondary">Not set</Text>,
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      render: (plan: string) =>
        plan === "hosted" ? (
          <Tag color="gold" icon={<CrownOutlined />}>Hosted</Tag>
        ) : (
          <Tag>Free</Tag>
        ),
    },
    {
      title: "",
      key: "action",
      render: (_: unknown, app: AppRow) =>
        app.plan === "hosted" ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>
        ) : (
          <Button
            type="primary"
            size="small"
            icon={<RocketOutlined />}
            loading={upgrading === app._id}
            onClick={() => handleUpgrade(app)}
          >
            Upgrade — ₹999
          </Button>
        ),
    },
  ];

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRzpReady(true)}
      />

      <div className="max-w-4xl">
        <div className="mb-8">
          <Title level={3} className="!mb-1">Billing & Plans</Title>
          <Text className="text-slate-400">Upgrade to host your app on your own custom domain</Text>
        </div>

        {/* Plan comparison */}
        <Row gutter={[24, 24]} className="mb-8">
          <Col xs={24} md={12}>
            <Card className="!rounded-2xl h-full" style={{ border: "2px solid #d9d9d9" }}>
              <div className="flex items-center justify-between mb-4">
                <Title level={4} className="!mb-0">Free</Title>
                <Tag>Current</Tag>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">₹0</span>
                <span className="text-slate-400">/month</span>
              </div>
              <List
                dataSource={FEATURES_FREE}
                renderItem={(item) => (
                  <List.Item className="!border-0 !py-1 !px-0">
                    <div className="flex items-center gap-2">
                      <CheckCircleFilled style={{ color: "#52c41a" }} />
                      <Text style={{ color: "#444" }}>{item}</Text>
                    </div>
                  </List.Item>
                )}
              />
              <List
                dataSource={["Custom domain hosting", "SSL certificate", "Live public URL"]}
                renderItem={(item) => (
                  <List.Item className="!border-0 !py-1 !px-0">
                    <div className="flex items-center gap-2 opacity-40">
                      <span>✕</span><Text>{item}</Text>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              className="!rounded-2xl h-full"
              style={{ border: "2px solid #1677ff", background: "linear-gradient(135deg, #1677ff, #0958d9)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <Title level={4} className="!mb-0 !text-white">Hosted</Title>
                <CrownOutlined className="text-yellow-300 text-xl" />
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">₹999</span>
                <span style={{ color: "#93c5fd" }}>/domain/month</span>
              </div>
              <List
                dataSource={FEATURES_HOSTED}
                renderItem={(item) => (
                  <List.Item className="!border-0 !py-1 !px-0">
                    <div className="flex items-center gap-2">
                      <CheckCircleFilled style={{ color: "#86efac" }} />
                      <Text style={{ color: "#e0f2fe" }}>{item}</Text>
                    </div>
                  </List.Item>
                )}
              />
              <div
                className="mt-6 rounded-lg py-2 px-4 text-center text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.15)", color: "#e0f2fe" }}
              >
                Upgrade per app below ↓
              </div>
            </Card>
          </Col>
        </Row>

        {/* Per-app upgrade table */}
        <Card title="Your Apps" className="!rounded-xl !border-slate-100 mb-8">
          {loading ? (
            <div className="flex justify-center py-8"><Spin /></div>
          ) : (
            <Table
              dataSource={apps}
              columns={columns}
              rowKey="_id"
              pagination={false}
              size="small"
              scroll={{ x: "max-content" }}
            />
          )}
        </Card>

        {/* How it works */}
        <Card className="!rounded-xl !border-slate-100">
          <Title level={5} className="!mb-3">How custom domain hosting works</Title>
          <div className="space-y-3">
            {[
              "Click Upgrade on any app above to pay ₹999.",
              "Enter your domain name in App Settings → Domain.",
              "We show you the DNS A record to point at our server.",
              "Once DNS propagates, click Verify — we auto-issue SSL.",
              "Your app is live at https://yourdomain.com.",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <Text className="text-slate-600">{text}</Text>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
