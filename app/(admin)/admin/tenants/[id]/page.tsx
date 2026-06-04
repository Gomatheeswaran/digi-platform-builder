"use client";
import { useEffect, useState, use } from "react";
import {
  Card, Row, Col, Typography, Tag, Button, Table, Statistic,
  Descriptions, Popconfirm, App, Spin, Breadcrumb,
} from "antd";
import {
  ArrowLeftOutlined, StopOutlined, CheckCircleOutlined,
  AppstoreOutlined, CreditCardOutlined, UserOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface TenantDetail {
  tenant: {
    _id: string;
    name: string;
    email: string;
    plan: string;
    role: string;
    isEmailVerified: boolean;
    suspended?: boolean;
    lastLoginAt?: string;
    createdAt: string;
  };
  apps: Array<{
    _id: string;
    name: string;
    slug: string;
    template: string;
    status: string;
    plan: string;
    customDomain: string | null;
    productCount: number;
    createdAt: string;
  }>;
  payments: Array<{
    _id: string;
    amount: number;
    currency: string;
    status: string;
    razorpayPaymentId: string;
    createdAt: string;
  }>;
  stats: {
    totalApps: number;
    liveApps: number;
    hostedApps: number;
    totalSpentPaise: number;
  };
}

const TEMPLATE_ICON: Record<string, string> = {
  ecommerce: "🛍️", notepad: "📓", calculator: "🧮",
  directory: "📋", form_collector: "📝", blank: "⬜",
};

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { message } = App.useApp();
  const [data, setData] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch(`/api/admin/tenants/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleSuspend() {
    if (!data) return;
    const next = !data.tenant.suspended;
    const res = await fetch(`/api/admin/tenants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: next }),
    });
    const json = await res.json();
    if (!res.ok) { message.error(json.error); return; }
    message.success(json.message);
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;
  if (!data) return <div className="p-8 text-slate-400">Tenant not found.</div>;

  const { tenant, apps, payments, stats } = data;
  const isSuspended = tenant.suspended;

  return (
    <div>
      <Breadcrumb
        className="mb-4"
        items={[
          { title: <Link href="/admin/tenants">Tenants</Link> },
          { title: tenant.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/tenants">
            <Button icon={<ArrowLeftOutlined />} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Title level={3} className="!mb-0">{tenant.name}</Title>
              {isSuspended
                ? <Tag color="error" icon={<StopOutlined />}>Suspended</Tag>
                : <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>}
            </div>
            <Text className="text-slate-400">{tenant.email}</Text>
          </div>
        </div>

        <Popconfirm
          title={isSuspended ? "Reactivate this account?" : "Suspend this account?"}
          description={
            isSuspended
              ? "The tenant will regain full access to the platform."
              : "The tenant will be locked out immediately. Their apps remain intact."
          }
          okText={isSuspended ? "Reactivate" : "Suspend"}
          okButtonProps={{ danger: !isSuspended }}
          onConfirm={toggleSuspend}
        >
          <Button
            danger={!isSuspended}
            type={isSuspended ? "primary" : "default"}
            icon={isSuspended ? <CheckCircleOutlined /> : <StopOutlined />}
          >
            {isSuspended ? "Reactivate Account" : "Suspend Account"}
          </Button>
        </Popconfirm>
      </div>

      {/* Stats row */}
      <Row gutter={[16, 16]} className="mb-6">
        {[
          { label: "Total Apps", value: stats.totalApps, icon: <AppstoreOutlined />, color: "#3b82f6" },
          { label: "Live Apps", value: stats.liveApps, icon: <CheckCircleOutlined />, color: "#10b981" },
          { label: "Hosted Apps", value: stats.hostedApps, icon: <AppstoreOutlined />, color: "#f59e0b" },
          { label: "Total Spent", value: `₹${(stats.totalSpentPaise / 100).toLocaleString("en-IN")}`, icon: <CreditCardOutlined />, color: "#8b5cf6", isString: true },
        ].map((s) => (
          <Col xs={12} sm={6} key={s.label}>
            <Card className="!rounded-xl !border-slate-100 text-center">
              <div className="text-2xl mb-1" style={{ color: s.color }}>{s.icon}</div>
              {s.isString
                ? <div className="text-xl font-bold">{s.value}</div>
                : <Statistic value={s.value as number} valueStyle={{ fontSize: 22 }} />}
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Profile */}
        <Col xs={24} lg={8}>
          <Card title={<><UserOutlined className="mr-2" />Profile</>} className="!rounded-xl !border-slate-100 mb-4">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Email">{tenant.email}</Descriptions.Item>
              <Descriptions.Item label="Plan">
                <Tag color={tenant.plan === "pro" ? "purple" : tenant.plan === "starter" ? "blue" : "default"}>
                  {tenant.plan}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Email Verified">
                <Tag color={tenant.isEmailVerified ? "success" : "warning"}>
                  {tenant.isEmailVerified ? "Verified" : "Unverified"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Last Login">
                {tenant.lastLoginAt ? dayjs(tenant.lastLoginAt).format("DD MMM YYYY HH:mm") : "Never"}
              </Descriptions.Item>
              <Descriptions.Item label="Joined">
                {dayjs(tenant.createdAt).format("DD MMM YYYY")}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Payments */}
          <Card title={<><CreditCardOutlined className="mr-2" />Payments</>} className="!rounded-xl !border-slate-100">
            {payments.length === 0
              ? <Text type="secondary" className="text-sm">No payments yet.</Text>
              : payments.map((p) => (
                <div key={p._id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <div className="text-sm font-medium">
                      ₹{(p.amount / 100).toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">{p.razorpayPaymentId || "—"}</div>
                  </div>
                  <div className="text-right">
                    <Tag color="green" className="text-xs">{p.status}</Tag>
                    <div className="text-xs text-slate-400">{dayjs(p.createdAt).format("DD MMM YY")}</div>
                  </div>
                </div>
              ))}
          </Card>
        </Col>

        {/* Apps */}
        <Col xs={24} lg={16}>
          <Card
            title={<><AppstoreOutlined className="mr-2" />Applications ({apps.length})</>}
            className="!rounded-xl !border-slate-100"
          >
            <Table
              dataSource={apps}
              rowKey="_id"
              size="small"
              pagination={false}
              scroll={{ x: "max-content" }}
              columns={[
                {
                  title: "App",
                  key: "app",
                  render: (_, a) => (
                    <div>
                      <div className="font-medium">{TEMPLATE_ICON[a.template] || "📦"} {a.name}</div>
                      <div className="text-xs text-slate-400">/{a.slug}</div>
                    </div>
                  ),
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  render: (s: string) => (
                    <Tag color={s === "live" ? "success" : s === "paused" ? "warning" : "default"}>{s}</Tag>
                  ),
                },
                {
                  title: "Plan",
                  dataIndex: "plan",
                  key: "plan",
                  render: (p: string) => <Tag color={p === "hosted" ? "blue" : "default"}>{p}</Tag>,
                },
                {
                  title: "Domain",
                  dataIndex: "customDomain",
                  key: "customDomain",
                  render: (d: string | null) => d ? <Text className="text-xs font-mono">{d}</Text> : <Text type="secondary" className="text-xs">—</Text>,
                },
                {
                  title: "Created",
                  dataIndex: "createdAt",
                  key: "createdAt",
                  render: (d: string) => dayjs(d).format("DD MMM YY"),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
