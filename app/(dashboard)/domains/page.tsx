"use client";
import { useEffect, useState } from "react";
import { Typography, Button, Tag, Spin } from "antd";
import {
  GlobalOutlined, CheckCircleOutlined, ClockCircleOutlined,
  SafetyCertificateOutlined, SettingOutlined, PlusOutlined, ExportOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const { Title, Text } = Typography;

interface AppWithDomain {
  id: string;
  name: string;
  slug: string;
  customDomain: string;
  domainVerified: boolean;
  sslStatus: string;
}

const SSL_LABEL: Record<string, string> = {
  active: "SSL Active", pending: "SSL Pending", failed: "SSL Failed", none: "No SSL",
};
const SSL_COLOR: Record<string, string> = {
  active: "success", pending: "processing", failed: "error", none: "default",
};

export default function DomainsPage() {
  const [apps, setApps] = useState<AppWithDomain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/apps")
      .then((r) => r.json())
      .then((data) => {
        setApps(
          Array.isArray(data) ? data.filter((a: AppWithDomain) => a.customDomain) : []
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Title level={3} className="!mb-0.5">Custom Domains</Title>
        <Text className="text-slate-400 text-sm">Domains connected to your apps</Text>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spin size="large" /></div>
      ) : apps.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 px-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <GlobalOutlined className="text-2xl text-slate-300" />
          </div>
          <Title level={5} className="!mb-1 !text-slate-600">No domains yet</Title>
          <Text className="text-slate-400 text-sm block mb-6 max-w-xs">
            Connect a custom domain to any app from its Settings page.
          </Text>
          <Link href="/apps">
            <Button type="primary" size="large" icon={<PlusOutlined />}>
              Go to My Apps
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const verified = app.domainVerified;
            const borderColor = verified ? "#4ade80" : "#fbbf24";
            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl overflow-hidden"
                style={{ border: "1px solid #f0f0f0", borderLeft: `4px solid ${borderColor}` }}
              >
                <div className="p-4">
                  {/* Domain + status dot */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: borderColor }}
                    />
                    <span className="font-semibold text-slate-800 text-base leading-tight break-all">
                      {app.customDomain}
                    </span>
                  </div>

                  {/* App name */}
                  <Text className="text-slate-400 text-xs block pl-[18px] mb-3">
                    {app.name} · /{app.slug}
                  </Text>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Tag
                      color={verified ? "success" : "warning"}
                      icon={verified ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                      className="!rounded-full !px-3"
                    >
                      {verified ? "DNS Verified" : "DNS Pending"}
                    </Tag>
                    <Tag
                      color={SSL_COLOR[app.sslStatus] || "default"}
                      icon={<SafetyCertificateOutlined />}
                      className="!rounded-full !px-3"
                    >
                      {SSL_LABEL[app.sslStatus] || app.sslStatus}
                    </Tag>
                  </div>

                  {/* DNS pending hint */}
                  {!verified && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mb-4 text-xs text-amber-700 leading-relaxed">
                      Add an <strong>A record</strong> pointing to the server IP at your
                      domain registrar, then verify below.
                    </div>
                  )}

                  {/* Actions */}
                  {verified ? (
                    <div className="grid grid-cols-2 gap-2">
                      <a href={`https://${app.customDomain}`} target="_blank" rel="noreferrer">
                        <Button block icon={<ExportOutlined />}>Visit Live</Button>
                      </a>
                      <Link href={`/apps/${app.id}/settings`}>
                        <Button block icon={<SettingOutlined />}>Settings</Button>
                      </Link>
                    </div>
                  ) : (
                    <Link href={`/apps/${app.id}/settings`}>
                      <Button type="primary" block icon={<SettingOutlined />}>
                        Verify in Settings
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          <Link href="/apps">
            <Button
              block
              type="dashed"
              icon={<PlusOutlined />}
              className="!rounded-2xl !h-11 !mt-1"
            >
              Connect another domain
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
