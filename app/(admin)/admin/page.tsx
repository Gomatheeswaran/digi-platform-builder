"use client";
import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Table, Tag, Spin, Progress } from "antd";
import {
  TeamOutlined, AppstoreOutlined, GlobalOutlined, CreditCardOutlined,
  RiseOutlined, StopOutlined, ThunderboltOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface Stats {
  totalUsers: number;
  suspendedUsers: number;
  activeUsers: number;
  totalApps: number;
  hostedApps: number;
  freeApps: number;
  totalDomains: number;
  verifiedDomains: number;
  totalRevenuePaise: number;
  appsByTemplate: Record<string, number>;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    plan: string;
    suspended?: boolean;
    lastLoginAt?: string;
    createdAt: string;
  }>;
}

const TEMPLATE_ICON: Record<string, string> = {
  ecommerce: "🛍️", notepad: "📓", calculator: "🧮",
  directory: "📋", form_collector: "📝", blank: "⬜",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spin size="large" /></div>;
  if (!stats) return null;

  const statCards = [
    {
      title: "Total Tenants",
      value: stats.totalUsers,
      icon: <TeamOutlined />,
      color: "#3b82f6",
      sub: `${stats.suspendedUsers} suspended`,
      subColor: stats.suspendedUsers > 0 ? "#ef4444" : "#94a3b8",
      href: "/admin/tenants",
    },
    {
      title: "Active Today",
      value: stats.activeUsers,
      icon: <ThunderboltOutlined />,
      color: "#10b981",
      sub: `of ${stats.totalUsers} total`,
      subColor: "#94a3b8",
      href: "/admin/tenants",
    },
    {
      title: "Suspended",
      value: stats.suspendedUsers,
      icon: <StopOutlined />,
      color: "#ef4444",
      sub: stats.suspendedUsers > 0 ? "Needs attention" : "None",
      subColor: stats.suspendedUsers > 0 ? "#ef4444" : "#10b981",
      href: "/admin/tenants?status=suspended",
    },
    {
      title: "Total Apps",
      value: stats.totalApps,
      icon: <AppstoreOutlined />,
      color: "#8b5cf6",
      sub: `${stats.hostedApps} hosted · ${stats.freeApps} free`,
      subColor: "#94a3b8",
      href: "/admin/apps",
    },
    {
      title: "Hosted Apps",
      value: stats.hostedApps,
      icon: <RiseOutlined />,
      color: "#f59e0b",
      sub: `${stats.totalApps > 0 ? Math.round((stats.hostedApps / stats.totalApps) * 100) : 0}% of all apps`,
      subColor: "#94a3b8",
      href: "/admin/apps?plan=hosted",
    },
    {
      title: "Verified Domains",
      value: stats.verifiedDomains,
      icon: <GlobalOutlined />,
      color: "#06b6d4",
      sub: `of ${stats.totalDomains} total`,
      subColor: "#94a3b8",
      href: "/admin/domains",
    },
    {
      title: "Total Revenue",
      value: `₹${(stats.totalRevenuePaise / 100).toLocaleString("en-IN")}`,
      icon: <CreditCardOutlined />,
      color: "#10b981",
      sub: `${stats.hostedApps} hosted subscriptions`,
      subColor: "#94a3b8",
      href: "/admin/payments",
      isString: true,
    },
  ];

  const templateEntries = Object.entries(stats.appsByTemplate || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div className="mb-6">
        <Title level={3} className="!mb-1">Platform Overview</Title>
        <Text className="text-slate-400">Live stats across all tenants · Updated now</Text>
      </div>

      {/* Stat cards */}
      <Row gutter={[12, 12]} className="mb-6">
        {statCards.map((s) => (
          <Col xs={12} sm={8} lg={6} xl={4} key={s.title} style={{ minWidth: 140 }}>
            <Link href={s.href} className="block">
              <Card
                className="!rounded-xl !border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
                styles={{ body: { padding: "14px 16px" } }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm mb-2"
                  style={{ backgroundColor: s.color }}
                >
                  {s.icon}
                </div>
                {s.isString
                  ? <div className="text-xl font-bold text-slate-800">{s.value}</div>
                  : <div className="text-2xl font-bold text-slate-800">{s.value as number}</div>}
                <div className="text-xs text-slate-400">{s.title}</div>
                <div className="text-xs mt-0.5" style={{ color: s.subColor }}>{s.sub}</div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Recent tenants */}
        <Col xs={24} lg={14}>
          <Card
            title="Recent Tenants"
            extra={<Link href="/admin/tenants" className="text-sm text-blue-500">View all</Link>}
            className="!rounded-xl !border-slate-100"
          >
            <Table
              dataSource={stats.recentUsers}
              rowKey="_id"
              size="small"
              pagination={false}
              scroll={{ x: "max-content" }}
              columns={[
                {
                  title: "Tenant",
                  key: "tenant",
                  render: (_, u) => (
                    <Link href={`/admin/tenants/${u._id}`}>
                      <div className="hover:text-blue-500">
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </div>
                    </Link>
                  ),
                },
                {
                  title: "Status",
                  key: "status",
                  render: (_, u) => u.suspended
                    ? <Tag color="error" icon={<StopOutlined />}>Suspended</Tag>
                    : <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>,
                },
                {
                  title: "Last Active",
                  key: "lastActive",
                  render: (_, u) => u.lastLoginAt
                    ? <span className="text-xs">{dayjs(u.lastLoginAt).fromNow()}</span>
                    : <Text type="secondary" className="text-xs">Never</Text>,
                },
                {
                  title: "Joined",
                  dataIndex: "createdAt",
                  key: "createdAt",
                  render: (d: string) => dayjs(d).format("DD MMM YYYY"),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Right column */}
        <Col xs={24} lg={10}>
          {/* Platform health */}
          <Card title="Platform Health" className="!rounded-xl !border-slate-100 mb-4">
            <div className="space-y-4">
              {[
                {
                  label: "Tenant activation rate",
                  value: stats.totalUsers > 0 ? stats.totalUsers - stats.suspendedUsers : 0,
                  total: stats.totalUsers,
                  color: "#10b981",
                },
                {
                  label: "Apps on hosted plan",
                  value: stats.hostedApps,
                  total: stats.totalApps,
                  color: "#f59e0b",
                },
                {
                  label: "Domains verified",
                  value: stats.verifiedDomains,
                  total: stats.totalDomains,
                  color: "#06b6d4",
                },
                {
                  label: "Active users today",
                  value: stats.activeUsers,
                  total: stats.totalUsers,
                  color: "#3b82f6",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <Text className="text-slate-600">{item.label}</Text>
                    <Text className="font-medium">{item.value}/{item.total}</Text>
                  </div>
                  <Progress
                    percent={item.total ? Math.round((item.value / item.total) * 100) : 0}
                    size="small"
                    showInfo={false}
                    strokeColor={item.color}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Apps by template */}
          {templateEntries.length > 0 && (
            <Card title="Apps by Template" className="!rounded-xl !border-slate-100">
              <div className="space-y-2">
                {templateEntries.map(([tmpl, count]) => (
                  <div key={tmpl} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span>{TEMPLATE_ICON[tmpl] || "📦"}</span>
                      <span className="capitalize text-slate-600">{tmpl.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        percent={stats.totalApps ? Math.round((count / stats.totalApps) * 100) : 0}
                        size="small"
                        showInfo={false}
                        style={{ width: 80 }}
                        strokeColor="#8b5cf6"
                      />
                      <Text className="text-xs w-6 text-right">{count}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
