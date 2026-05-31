"use client";
import { useEffect, useState, use } from "react";
import { Tabs, Typography, Button, Spin, Alert, App, Tag, Space } from "antd";
import { ArrowLeftOutlined, SaveOutlined, EyeOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { AppConfig } from "@/types";
import ThemeTab from "@/components/builder/ThemeTab";
import PagesTab from "@/components/builder/PagesTab";
import DataModelsTab from "@/components/builder/DataModelsTab";
import NavigationTab from "@/components/builder/NavigationTab";
import IntegrationsTab from "@/components/builder/IntegrationsTab";
import SEOTab from "@/components/builder/SEOTab";

const { Title, Text } = Typography;

const TEMPLATE_ICONS: Record<string, string> = {
  ecommerce: "🛍️", notepad: "📓", calculator: "🧮",
  directory: "📋", form_collector: "📝", blank: "⬜",
};

export default function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { message } = App.useApp();
  const [app, setApp] = useState<Record<string, unknown> | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`/api/apps/${id}`).then((r) => r.json()),
      fetch(`/api/apps/${id}/config`).then((r) => r.json()),
    ]).then(([appData, configData]) => {
      setApp(appData);
      setConfig(configData);
    }).finally(() => setLoading(false));
  }, [id]);

  function updateConfig(patch: Partial<AppConfig>) {
    setConfig((prev) => prev ? { ...prev, ...patch } : prev);
    setDirty(true);
  }

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/apps/${id}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      message.success("Changes saved!");
      setDirty(false);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spin size="large" /></div>;
  if (!app || !config) return <Alert type="error" description="App not found" />;

  const template = app.template as string;

  const tabItems = [
    {
      key: "theme",
      label: "🎨 Theme",
      children: <ThemeTab theme={config.theme} onChange={(theme) => updateConfig({ theme })} />,
    },
    {
      key: "navigation",
      label: "🔗 Navigation",
      children: <NavigationTab nav={config.navigation} onChange={(navigation) => updateConfig({ navigation })} />,
    },
    {
      key: "pages",
      label: "📄 Pages",
      children: <PagesTab pages={config.pages} onChange={(pages) => updateConfig({ pages })} template={template} />,
    },
    {
      key: "data",
      label: "🗄️ Data Models",
      children: <DataModelsTab models={config.dataModels} onChange={(dataModels) => updateConfig({ dataModels })} />,
    },
    {
      key: "integrations",
      label: "🔌 Integrations",
      children: <IntegrationsTab integrations={config.integrations} onChange={(integrations) => updateConfig({ integrations })} />,
    },
    {
      key: "seo",
      label: "🔍 SEO",
      children: <SEOTab seo={config.seo} onChange={(seo) => updateConfig({ seo })} />,
    },
  ];

  return (
    <div>
      {/* Builder Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/apps/${id}`}><Button icon={<ArrowLeftOutlined />} type="text" /></Link>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{TEMPLATE_ICONS[template] || "📦"}</span>
          <Title level={4} className="!mb-0">{app.name as string}</Title>
          <Tag color={(app.status as string) === "live" ? "success" : "default"} className="capitalize">
            {app.status as string}
          </Tag>
          {dirty && <Tag color="warning">Unsaved changes</Tag>}
        </div>
        <Space>
          <Link href={`/preview/${id}`} target="_blank">
            <Button icon={<EyeOutlined />}>Preview</Button>
          </Link>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={!dirty}
            onClick={saveConfig}
          >
            Save Changes
          </Button>
        </Space>
      </div>

      {/* Tip banner */}
      <Alert
        type="info"
        showIcon
        className="mb-6"
        description={
          <Text className="text-sm">
            Use the tabs below to configure your app. Click{" "}
            <strong>Preview</strong> to see it live.
            To connect a custom domain, go to{" "}
            <Link href={`/apps/${id}/settings`} className="font-medium">Settings</Link>.
          </Text>
        }
        closable
      />

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <Tabs
          items={tabItems}
          tabPosition={isMobile ? "top" : "left"}
          size="small"
          className="builder-tabs"
          tabBarStyle={{ width: 160, paddingTop: 8, paddingBottom: 8, background: "#fafafa", borderRight: "1px solid #f0f0f0" }}
        />
      </div>
    </div>
  );
}
