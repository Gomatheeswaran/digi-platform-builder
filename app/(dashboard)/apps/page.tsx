"use client";
import { useEffect, useState } from "react";
import {
  Card, Row, Col, Typography, Button, Empty, Spin, Tag, Space,
  Input, Select, Dropdown, Modal, message,
} from "antd";
import {
  PlusOutlined, SearchOutlined, GlobalOutlined,
  EditOutlined, DeleteOutlined, EllipsisOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface App {
  id: string;
  name: string;
  slug: string;
  description: string;
  template: string;
  status: "draft" | "live" | "paused";
  customDomain: string | null;
  domainVerified: boolean;
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

export default function AppsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);
  const [filtered, setFiltered] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/apps")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setApps(list);
        setFiltered(list);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = apps;
    if (search) {
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.slug.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, apps]);

  async function deleteApp(id: string) {
    try {
      const res = await fetch(`/api/apps/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setApps((prev) => prev.filter((a) => a.id !== id));
      message.success("App deleted.");
    } catch {
      message.error("Failed to delete app.");
    } finally {
      setDeleteId(null);
    }
  }

  function getMenuItems(app: App) {
    return [
      {
        key: "edit",
        label: "Open Builder",
        icon: <EditOutlined />,
        onClick: () => router.push(`/apps/${app.id}/builder`),
      },
      {
        key: "settings",
        label: "Settings & Domain",
        icon: <GlobalOutlined />,
        onClick: () => router.push(`/apps/${app.id}/settings`),
      },
      ...(app.status === "live" && app.customDomain
        ? [
            {
              key: "visit",
              label: "Visit Live App",
              icon: <ExportOutlined />,
              onClick: () => window.open(`https://${app.customDomain}`, "_blank"),
            },
          ]
        : []),
      { type: "divider" as const },
      {
        key: "delete",
        label: "Delete App",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => setDeleteId(app.id),
      },
    ];
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Title level={3} className="!mb-1">My Apps</Title>
          <Text className="text-slate-400">{apps.length} app{apps.length !== 1 ? "s" : ""} total</Text>
        </div>
        <Link href="/apps/new">
          <Button type="primary" icon={<PlusOutlined />} size="large">New App</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Input
          placeholder="Search apps..."
          prefix={<SearchOutlined className="text-slate-400" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          allowClear
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 140 }}
          options={[
            { value: "all", label: "All Status" },
            { value: "live", label: "Live" },
            { value: "draft", label: "Draft" },
            { value: "paused", label: "Paused" },
          ]}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spin size="large" /></div>
      ) : filtered.length === 0 ? (
        <Card className="!rounded-xl !border-slate-100">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              apps.length === 0 ? (
                <div className="text-center">
                  <Text className="text-slate-400 block mb-4">No apps yet.</Text>
                  <Link href="/apps/new">
                    <Button type="primary" icon={<PlusOutlined />}>Create Your First App</Button>
                  </Link>
                </div>
              ) : (
                <Text className="text-slate-400">No apps match your filters.</Text>
              )
            }
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((app) => (
            <Col xs={24} md={12} lg={8} key={app.id}>
              <Card
                hoverable
                className="!rounded-xl !border-slate-100 hover:!border-blue-200 transition-all"
                actions={[
                  <Link key="builder" href={`/apps/${app.id}/builder`}>
                    <Button type="text" icon={<EditOutlined />} size="small">Builder</Button>
                  </Link>,
                  <Link key="settings" href={`/apps/${app.id}/settings`}>
                    <Button type="text" icon={<GlobalOutlined />} size="small">Domain</Button>
                  </Link>,
                  <Dropdown key="more" menu={{ items: getMenuItems(app) }} trigger={["click"]}>
                    <Button type="text" icon={<EllipsisOutlined />} size="small" />
                  </Dropdown>,
                ]}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl flex-shrink-0">
                    {TEMPLATE_ICONS[app.template] || "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/apps/${app.id}`}>
                      <div className="font-semibold text-slate-800 hover:text-blue-600 truncate cursor-pointer">
                        {app.name}
                      </div>
                    </Link>
                    <div className="text-xs text-slate-400 mb-2 truncate">/{app.slug}</div>
                    {app.description && (
                      <Text className="text-slate-500 text-sm line-clamp-2 block mb-2">
                        {app.description}
                      </Text>
                    )}
                    <Space size="small" wrap>
                      <Tag color={STATUS_COLORS[app.status]} className="capitalize">
                        {app.status}
                      </Tag>
                      {app.customDomain ? (
                        <Tag
                          icon={<GlobalOutlined />}
                          color={app.domainVerified ? "purple" : "orange"}
                        >
                          {app.domainVerified ? app.customDomain : "Domain pending"}
                        </Tag>
                      ) : (
                        <Tag color="default">No domain</Tag>
                      )}
                    </Space>
                    <div className="text-xs text-slate-400 mt-2">
                      {dayjs(app.updatedAt).fromNow()}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="Delete App"
        open={!!deleteId}
        onOk={() => deleteId && deleteApp(deleteId)}
        onCancel={() => setDeleteId(null)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>This will permanently delete the app and all its data. This cannot be undone.</p>
      </Modal>
    </div>
  );
}
