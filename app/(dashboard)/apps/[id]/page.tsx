"use client";
import { useEffect, useState, use } from "react";
import {
  Card, Row, Col, Typography, Button, Tag, Spin,
  Descriptions, Alert,
} from "antd";
import {
  EditOutlined, GlobalOutlined, SettingOutlined,
  ArrowLeftOutlined, ExportOutlined, RocketOutlined, EyeOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const TEMPLATE_ICONS: Record<string, string> = {
  ecommerce: "🛍️", notepad: "📓", calculator: "🧮",
  directory: "📋", form_collector: "📝", blank: "⬜",
};

const STATUS_COLORS: Record<string, string> = {
  live: "success", draft: "default", paused: "warning",
};

export default function AppOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [app, setApp] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/apps/${id}`)
      .then((r) => r.json())
      .then(setApp)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-16"><Spin size="large" /></div>;
  if (!app) return <Alert message="App not found" type="error" />;

  const status = app.status as string;
  const template = app.template as string;
  const customDomain = app.customDomain as string | null;
  const domainVerified = app.domainVerified as boolean;
  const sslStatus = app.sslStatus as string;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-3">
          <Link href="/apps"><Button icon={<ArrowLeftOutlined />} type="text" className="mt-1 flex-shrink-0" /></Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl">{TEMPLATE_ICONS[template] || "📦"}</span>
              <Title level={4} className="!mb-0 !leading-tight truncate">{app.name as string}</Title>
              <Tag color={STATUS_COLORS[status]} className="capitalize">{status}</Tag>
            </div>
            <Text className="text-slate-400 text-sm">/{app.slug as string}</Text>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-10">
          <Link href={`/preview/${id}`} target="_blank">
            <Button icon={<EyeOutlined />} size="small">Preview</Button>
          </Link>
          <Link href={`/apps/${id}/builder`}>
            <Button type="primary" icon={<EditOutlined />} size="small">Open Builder</Button>
          </Link>
          {customDomain && domainVerified && (
            <Button
              icon={<ExportOutlined />}
              size="small"
              onClick={() => window.open(`https://${customDomain}`, "_blank")}
            >
              Visit Live
            </Button>
          )}
        </div>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        {/* Quick actions */}
        {[
          { href: `/apps/${id}/builder`, icon: <EditOutlined />, label: "App Builder", desc: "Edit design & content" },
          { href: `/apps/${id}/data`, icon: <RocketOutlined />, label: "Data Manager", desc: "View & edit app data" },
          { href: `/apps/${id}/settings`, icon: <GlobalOutlined />, label: "Domain & Settings", desc: "Connect your domain" },
        ].map((action) => (
          <Col xs={24} md={8} key={action.label}>
            <Link href={action.href}>
              <Card hoverable className="!rounded-xl !border-slate-100 hover:!border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                    {action.icon}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">{action.label}</div>
                    <div className="text-xs text-slate-400">{action.desc}</div>
                  </div>
                </div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card title="App Info" className="!rounded-xl !border-slate-100">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Template">{template}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={STATUS_COLORS[status]} className="capitalize">{status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Created">{dayjs(app.createdAt as string).format("DD MMM YYYY, h:mm A")}</Descriptions.Item>
              <Descriptions.Item label="Last Updated">{dayjs(app.updatedAt as string).format("DD MMM YYYY, h:mm A")}</Descriptions.Item>
              {(app.description as string) && <Descriptions.Item label="Description">{app.description as string}</Descriptions.Item>}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title="Domain & Hosting" className="!rounded-xl !border-slate-100">
            {customDomain ? (
              <div className="space-y-3">
                <div>
                  <Text className="text-slate-500 text-xs block mb-1">Custom Domain</Text>
                  <Text strong className="text-slate-800">{customDomain}</Text>
                </div>
                <div className="flex gap-2">
                  <Tag color={domainVerified ? "success" : "warning"}>
                    {domainVerified ? "DNS Verified" : "DNS Pending"}
                  </Tag>
                  <Tag color={sslStatus === "active" ? "success" : sslStatus === "pending" ? "processing" : "default"}>
                    SSL: {sslStatus}
                  </Tag>
                </div>
                {!domainVerified && (
                  <Link href={`/apps/${id}/settings`}>
                    <Button type="primary" size="small" block>Verify Domain</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <GlobalOutlined className="text-3xl text-slate-300 mb-3" />
                <Text className="text-slate-400 block mb-3 text-sm">
                  No custom domain. Connect your domain to go live.
                </Text>
                <Link href={`/apps/${id}/settings`}>
                  <Button type="primary" size="small" icon={<SettingOutlined />}>
                    Connect Domain
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
