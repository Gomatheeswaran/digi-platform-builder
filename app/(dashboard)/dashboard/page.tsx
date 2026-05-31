"use client";
import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Button, Empty, Spin, Tag, Space } from "antd";
import {
  AppstoreOutlined,
  GlobalOutlined,
  PlusOutlined,
  RocketOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface App {
  id: string;
  name: string;
  slug: string;
  template: string;
  status: string;
  customDomain: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  live: "success",
  draft: "default",
  paused: "warning",
};

const TEMPLATE_ICONS: Record<string, string> = {
  ecommerce: "🛍️",
  notepad: "📓",
  calculator: "🧮",
  directory: "📋",
  form_collector: "📝",
  blank: "⬜",
};

export default function DashboardPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/apps")
      .then((r) => r.json())
      .then((data) => setApps(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const liveApps = apps.filter((a) => a.status === "live");
  const draftApps = apps.filter((a) => a.status === "draft");

  return (
    <div className="max-w-6xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Title level={3} className="!mb-1">
            Dashboard
          </Title>
          <Text className="text-slate-400">
            Manage your apps and domains
          </Text>
        </div>
        <Link href="/apps/new">
          <Button type="primary" icon={<PlusOutlined />} size="large">
            New App
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} className="mb-8">
        {[
          {
            label: "Total Apps",
            value: apps.length,
            icon: <AppstoreOutlined className="text-blue-500 text-xl" />,
            color: "#e6f4ff",
          },
          {
            label: "Live Apps",
            value: liveApps.length,
            icon: <RocketOutlined className="text-green-500 text-xl" />,
            color: "#f6ffed",
          },
          {
            label: "Drafts",
            value: draftApps.length,
            icon: <ClockCircleOutlined className="text-amber-500 text-xl" />,
            color: "#fffbe6",
          },
          {
            label: "Custom Domains",
            value: apps.filter((a) => a.customDomain).length,
            icon: <GlobalOutlined className="text-purple-500 text-xl" />,
            color: "#f9f0ff",
          },
        ].map((stat) => (
          <Col xs={12} md={6} key={stat.label}>
            <Card
              className="!rounded-xl !border-slate-100"
              style={{ background: stat.color }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-slate-800">{stat.value}</div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
                {stat.icon}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Apps list */}
      <div className="mb-4 flex items-center justify-between">
        <Title level={5} className="!mb-0">
          Your Apps
        </Title>
        <Link href="/apps">
          <Button type="link" className="!p-0">
            View all
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      ) : apps.length === 0 ? (
        <Card className="!rounded-xl !border-slate-100">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="text-center">
                <Text className="text-slate-400 text-base block mb-4">
                  No apps yet. Create your first app!
                </Text>
                <Link href="/apps/new">
                  <Button type="primary" icon={<PlusOutlined />}>
                    Create App
                  </Button>
                </Link>
              </div>
            }
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {apps.slice(0, 6).map((app) => (
            <Col xs={24} md={12} lg={8} key={app.id}>
              <Link href={`/apps/${app.id}`}>
                <Card
                  hoverable
                  className="!rounded-xl !border-slate-100 hover:!border-blue-200 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl flex-shrink-0">
                      {TEMPLATE_ICONS[app.template] || "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{app.name}</div>
                      <div className="text-xs text-slate-400 mb-2">/{app.slug}</div>
                      <Space size="small">
                        <Tag color={STATUS_COLORS[app.status] || "default"} className="capitalize">
                          {app.status}
                        </Tag>
                        {app.customDomain && (
                          <Tag icon={<GlobalOutlined />} color="purple">
                            {app.customDomain}
                          </Tag>
                        )}
                      </Space>
                      <div className="text-xs text-slate-400 mt-2">
                        Updated {dayjs(app.updatedAt).fromNow()}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      )}

      {/* Quick actions */}
      {apps.length > 0 && (
        <div className="mt-8">
          <Title level={5} className="!mb-4">
            Quick Actions
          </Title>
          <Row gutter={[16, 16]}>
            {[
              { icon: "🛍️", title: "New E-Commerce Store", href: "/apps/new?template=ecommerce" },
              { icon: "📓", title: "New Notepad App", href: "/apps/new?template=notepad" },
              { icon: "🌐", title: "Manage Domains", href: "/domains" },
              { icon: "💳", title: "Upgrade Plan", href: "/billing" },
            ].map((action) => (
              <Col xs={12} md={6} key={action.title}>
                <Link href={action.href}>
                  <Card hoverable className="!rounded-xl !border-slate-100 text-center hover:!border-blue-200">
                    <div className="text-2xl mb-2">{action.icon}</div>
                    <Text className="text-slate-600 text-sm">{action.title}</Text>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
}
