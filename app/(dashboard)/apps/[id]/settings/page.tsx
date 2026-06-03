"use client";
import { useEffect, useState, use } from "react";
import {
  Card, Form, Input, Button, Typography, Alert, Tag,
  Spin, Select, Popconfirm, App,
} from "antd";
import {
  ArrowLeftOutlined, GlobalOutlined, SafetyCertificateOutlined,
  CheckCircleOutlined, InfoCircleOutlined, CopyOutlined, DeleteOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";

const { Title, Text, Paragraph } = Typography;

export default function AppSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { message } = App.useApp();
  const [app, setApp] = useState<Record<string, unknown> | null>(null);
  const [domain, setDomain] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [appForm] = Form.useForm();

  useEffect(() => {
    Promise.all([
      fetch(`/api/apps/${id}`).then((r) => r.json()),
      fetch(`/api/apps/${id}/domain`).then((r) => r.json()),
    ]).then(([appData, domainData]) => {
      setApp(appData);
      setDomain(domainData.domain ? domainData : null);
      appForm.setFieldsValue({ name: appData.name, description: appData.description, status: appData.status });
    }).finally(() => setLoading(false));
  }, [id, appForm]);

  async function saveAppSettings(values: Record<string, string>) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/apps/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSuccess("Settings saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function connectDomain(values: { domain: string }) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/apps/${id}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: values.domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDomain(data);
      message.success("Domain saved! Follow the DNS instructions below.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Domain save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function verifyDomain() {
    setVerifying(true);
    setError("");
    try {
      const res = await fetch(`/api/apps/${id}/deploy`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);
      message.success(data.message);
      const appData = await fetch(`/api/apps/${id}`).then((r) => r.json());
      setApp(appData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  async function removeDomain() {
    try {
      await fetch(`/api/apps/${id}/domain`, { method: "DELETE" });
      setDomain(null);
      message.success("Domain removed.");
    } catch {
      message.error("Failed to remove domain.");
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spin size="large" /></div>;
  if (!app) return <Alert message="App not found" type="error" />;

  const domainConnected = !!(domain && domain.domain);
  const domainVerified = domain?.verified as boolean | undefined;
  const domainName = domain?.domain as string;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/apps/${id}`}><Button icon={<ArrowLeftOutlined />} type="text" className="flex-shrink-0" /></Link>
        <div className="min-w-0">
          <Title level={4} className="!mb-0 truncate">{app.name as string} — Settings</Title>
          <Text className="text-slate-400">Configure your app and domain</Text>
        </div>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable={{ onClose: () => setError("") }}
          className="mb-4"
        />
      )}
      {success && <Alert message={success} type="success" showIcon className="mb-4" />}

      {/* App Settings */}
      <Card title="App Settings" className="!rounded-xl !border-slate-100 mb-6">
        <Form layout="vertical" form={appForm} onFinish={saveAppSettings}>
          <Form.Item name="name" label="App Name" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              size="large"
              options={[
                { value: "draft", label: "Draft (not public)" },
                { value: "live", label: "Live (public)" },
                { value: "paused", label: "Paused (temporarily offline)" },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>Save Settings</Button>
        </Form>
      </Card>

      {/* Domain Settings */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <GlobalOutlined className="text-blue-500" />
            <span>Custom Domain</span>
            {domainConnected && (
              <Tag color={domainVerified ? "success" : "warning"} className="ml-2">
                {domainVerified ? "✓ Verified" : "DNS Pending"}
              </Tag>
            )}
          </div>
        }
        className="!rounded-xl !border-slate-100 mb-6"
      >
        {!domainConnected ? (
          <>
            <Paragraph className="text-slate-500 text-sm">
              Connect your own domain (e.g. <code>myshop.com</code>) to host this app.
              Requires a paid plan.
            </Paragraph>
            <Form layout="vertical" onFinish={connectDomain}>
              <Form.Item
                name="domain"
                label="Your Domain"
                rules={[
                  { required: true },
                  { pattern: /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/, message: "Enter a valid domain (e.g. myshop.com)" },
                ]}
              >
                <Input placeholder="myshop.com" size="large" prefix="https://" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={saving} icon={<GlobalOutlined />}>
                Connect Domain
              </Button>
            </Form>
          </>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <Text strong className="text-lg break-all">{domainName}</Text>
              <Popconfirm title="Remove this domain?" onConfirm={removeDomain} okButtonProps={{ danger: true }}>
                <Button danger size="small" icon={<DeleteOutlined />}>Remove</Button>
              </Popconfirm>
            </div>

            {!domainVerified && (
              <>
                <Alert
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  message="Point your DNS to this server"
                  description={
                    <div className="mt-2 space-y-3">
                      <div className="text-sm">Add these DNS records at your domain registrar (GoDaddy, Namecheap, etc.):</div>
                      {[
                        { type: "A", name: "@", value: process.env.NEXT_PUBLIC_SERVER_IP || "YOUR_SERVER_IP", desc: "Root domain" },
                        { type: "A", name: "www", value: process.env.NEXT_PUBLIC_SERVER_IP || "YOUR_SERVER_IP", desc: "www subdomain" },
                      ].map((r) => (
                        <div key={r.name} className="bg-slate-50 rounded p-3 font-mono text-xs flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-2 break-all">
                          <span>
                            <strong>{r.type}</strong> &nbsp; <strong>{r.name}</strong> &nbsp;→&nbsp; <strong>{r.value}</strong>
                            <span className="text-slate-400 ml-2 font-sans">({r.desc})</span>
                          </span>
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            className="flex-shrink-0"
                            onClick={() => navigator.clipboard.writeText(r.value)}
                          />
                        </div>
                      ))}
                      <div className="text-slate-400 text-xs">DNS changes can take up to 48 hours to propagate.</div>
                    </div>
                  }
                  className="mb-4"
                />
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={verifying}
                  onClick={verifyDomain}
                  block
                >
                  I&apos;ve Updated My DNS — Verify Now
                </Button>
              </>
            )}

            {domainVerified && (
              <Alert
                type="success"
                showIcon
                icon={<SafetyCertificateOutlined />}
                message="Domain verified and SSL certificate issued!"
                description={
                  <div className="mt-1">
                    Your app is live at{" "}
                    <a href={`https://${domainName}`} target="_blank" rel="noreferrer" className="font-medium">
                      https://{domainName}
                    </a>
                  </div>
                }
              />
            )}
          </div>
        )}
      </Card>

      {/* Danger Zone */}
      <Card
        title={<span className="text-red-500">Danger Zone</span>}
        className="!rounded-xl !border-red-100"
      >
        <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
          <div>
            <div className="font-medium text-slate-800">Delete App</div>
            <div className="text-sm text-slate-400">Permanently delete this app and all its data.</div>
          </div>
          <Popconfirm
            title="Delete this app permanently?"
            description="All data will be lost. This cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              await fetch(`/api/apps/${id}`, { method: "DELETE" });
              router.push("/apps");
            }}
          >
            <Button danger icon={<DeleteOutlined />}>Delete App</Button>
          </Popconfirm>
        </div>
      </Card>
    </div>
  );
}
