"use client";
import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Statistic, Table, Tag, Spin } from "antd";
import {
  TeamOutlined, AppstoreOutlined, GlobalOutlined,
  CreditCardOutlined, RiseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface Stats {
  totalUsers: number;
  totalApps: number;
  hostedApps: number;
  freeApps: number;
  totalDomains: number;
  verifiedDomains: number;
  totalRevenuePaise: number;
  recentUsers: Array<{ _id: string; name: string; email: string; role: string; plan: string; createdAt: string }>;
}

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
    { title: "Total Users", value: stats.totalUsers, icon: <TeamOutlined />, color: "#1677ff" },
    { title: "Total Apps", value: stats.totalApps, icon: <AppstoreOutlined />, color: "#52c41a" },
    { title: "Hosted Apps", value: stats.hostedApps, icon: <RiseOutlined />, color: "#f59e0b" },
    { title: "Verified Domains", value: stats.verifiedDomains, icon: <GlobalOutlined />, color: "#8b5cf6" },
    {
      title: "Total Revenue",
      value: `₹${(stats.totalRevenuePaise / 100).toLocaleString("en-IN")}`,
      icon: <CreditCardOutlined />,
      color: "#ef4444",
      isString: true,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <Title level={3} className="!mb-1">Platform Overview</Title>
        <Text className="text-slate-400">Live stats across all tenants</Text>
      </div>

      <Row gutter={[16, 16]} className="mb-8">
        {statCards.map((s) => (
          <Col xs={12} md={8} lg={4} key={s.title} style={{ minWidth: 160 }}>
            <Card className="!rounded-xl !border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-base"
                  style={{ backgroundColor: s.color }}
                >
                  {s.icon}
                </div>
              </div>
              {s.isString ? (
                <div>
                  <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                  <div className="text-xs text-slate-400">{s.title}</div>
                </div>
              ) : (
                <Statistic title={s.title} value={s.value as number} valueStyle={{ fontSize: 24 }} />
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card title="Recent Signups" className="!rounded-xl !border-slate-100">
            <Table
              dataSource={stats.recentUsers}
              rowKey="_id"
              size="small"
              pagination={false}
              scroll={{ x: "max-content" }}
              columns={[
                {
                  title: "Name",
                  dataIndex: "name",
                  key: "name",
                  render: (name: string, u: Stats["recentUsers"][0]) => (
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </div>
                  ),
                },
                {
                  title: "Role",
                  dataIndex: "role",
                  key: "role",
                  render: (role: string) =>
                    role === "super_admin" ? <Tag color="red">super admin</Tag> : <Tag>tenant</Tag>,
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

        <Col xs={24} md={10}>
          <Card title="Quick Stats" className="!rounded-xl !border-slate-100 h-full">
            <div className="space-y-4">
              {[
                { label: "Apps on hosted plan", value: stats.hostedApps, total: stats.totalApps },
                { label: "Domains verified", value: stats.verifiedDomains, total: stats.totalDomains },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <Text className="text-slate-600">{item.label}</Text>
                    <Text className="font-medium">{item.value}/{item.total}</Text>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: item.total ? `${(item.value / item.total) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="text-sm text-slate-500">Revenue from hosted plans</div>
                <div className="text-2xl font-bold text-slate-800 mt-1">
                  ₹{(stats.totalRevenuePaise / 100).toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-slate-400">
                  {stats.hostedApps} hosted × ₹999 target
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
