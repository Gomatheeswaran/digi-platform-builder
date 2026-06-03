"use client";
import { useEffect, useState } from "react";
import {
  Card, Row, Col, Typography, Button, Tag, Spin, Empty, Alert,
} from "antd";
import {
  GlobalOutlined, CheckCircleOutlined, ClockCircleOutlined,
  SafetyCertificateOutlined, SettingOutlined, PlusOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const { Title, Text } = Typography;

interface AppWithDomain {
  id: string;
  name: string;
  slug: string;
  template: string;
  status: string;
  customDomain: string;
  domainVerified: boolean;
  sslStatus: string;
  plan: string;
}

const SSL_COLOR: Record<string, string> = {
  active: "success", pending: "processing", failed: "error", none: "default",
};

export default function DomainsPage() {
  const [apps, setApps] = useState<AppWithDomain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/apps")
      .then((r) => r.json())
      .then((data: AppWithDomain[]) => {
        const withDomain = Array.isArray(data)
          ? data.filter((a) => a.customDomain)
          : [];
        setApps(withDomain);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="min-w-0">
          <Title level={3} className="!mb-1">Custom Domains</Title>
          <Text className="text-slate-400">Manage domains connected to your apps</Text>
        </div>
        <Link href="/apps" className="flex-shrink-0">
          <Button type="primary" icon={<PlusOutlined />}>Connect Domain</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spin size="large" /></div>
      ) : apps.length === 0 ? (
        <Card className="!rounded-xl !border-slate-100">
          <Empty
            image={<GlobalOutlined className="text-6xl text-slate-200" />}
            description={
              <div className="text-center">
                <Text className="text-slate-400 block mb-2">No custom domains yet.</Text>
                <Text className="text-slate-400 text-sm block mb-4">
                  Connect a domain to your app via App Settings.
                </Text>
                <Link href="/apps">
                  <Button type="primary" icon={<SettingOutlined />}>Go to My Apps</Button>
                </Link>
              </div>
            }
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {apps.map((app) => (
            <Col xs={24} key={app.id}>
              <Card className="!rounded-xl !border-slate-100">
                <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <GlobalOutlined className="text-blue-500 flex-shrink-0" />
                      <Text strong className="text-slate-800 text-base break-all">
                        {app.customDomain}
                      </Text>
                      <Tag
                        color={app.domainVerified ? "success" : "warning"}
                        icon={app.domainVerified ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                      >
                        {app.domainVerified ? "DNS Verified" : "DNS Pending"}
                      </Tag>
                      <Tag
                        color={SSL_COLOR[app.sslStatus] || "default"}
                        icon={<SafetyCertificateOutlined />}
                      >
                        SSL: {app.sslStatus}
                      </Tag>
                    </div>
                    <Text className="text-slate-400 text-sm">
                      App: <span className="font-medium text-slate-600">{app.name}</span>
                      <span className="ml-2 text-slate-300">·</span>
                      <span className="ml-2">/{app.slug}</span>
                    </Text>
                  </div>
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {app.domainVerified && (
                      <a href={`https://${app.customDomain}`} target="_blank" rel="noreferrer">
                        <Button size="small" icon={<GlobalOutlined />}>Visit</Button>
                      </a>
                    )}
                    <Link href={`/apps/${app.id}/settings`}>
                      <Button size="small" icon={<SettingOutlined />}>Settings</Button>
                    </Link>
                  </div>
                </div>

                {!app.domainVerified && (
                  <Alert
                    className="mt-3"
                    type="warning"
                    showIcon
                    message="DNS not yet verified"
                    description={
                      <span>
                        Point your domain&apos;s A record to the server IP, then{" "}
                        <Link href={`/apps/${app.id}/settings`} className="font-medium">
                          verify in App Settings
                        </Link>.
                      </span>
                    }
                  />
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
