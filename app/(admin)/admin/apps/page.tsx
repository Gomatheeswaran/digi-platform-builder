"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Card, Table, Typography, Tag, Button, Input, Space,
  Select, Popconfirm, App,
} from "antd";
import { SearchOutlined, DeleteOutlined, AppstoreOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface AppRow {
  _id: string;
  name: string;
  slug: string;
  template: string;
  status: string;
  plan: string;
  customDomain: string | null;
  domainVerified: boolean;
  createdAt: string;
  owner: { name: string; email: string } | null;
}

const STATUS_COLOR: Record<string, string> = { live: "success", draft: "default", paused: "warning" };
const TEMPLATE_ICON: Record<string, string> = {
  ecommerce: "🛍️", notepad: "📓", calculator: "🧮",
  directory: "📋", form_collector: "📝", blank: "⬜",
};

export default function AdminAppsPage() {
  const { message } = App.useApp();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchApps = useCallback((p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(p),
      ...(search && { search }),
      ...(filterPlan && { plan: filterPlan }),
      ...(filterStatus && { status: filterStatus }),
    });
    fetch(`/api/admin/apps?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setApps(data.apps || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [search, filterPlan, filterStatus]);

  useEffect(() => { fetchApps(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateApp(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/admin/apps/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) { message.error(data.error); return; }
    message.success("App updated.");
    fetchApps(page);
  }

  async function deleteApp(id: string) {
    const res = await fetch(`/api/admin/apps/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { message.error(data.error); return; }
    message.success("App deleted.");
    fetchApps(page);
  }

  const columns: ColumnsType<AppRow> = [
    {
      title: "App",
      key: "app",
      render: (_, a) => (
        <div>
          <div className="font-medium">
            {TEMPLATE_ICON[a.template] || "📦"} {a.name}
          </div>
          <div className="text-xs text-slate-400">/{a.slug}</div>
        </div>
      ),
    },
    {
      title: "Owner",
      key: "owner",
      render: (_, a) => a.owner ? (
        <div>
          <div className="text-sm font-medium">{a.owner.name}</div>
          <div className="text-xs text-slate-400">{a.owner.email}</div>
        </div>
      ) : <Text type="secondary">—</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, a) => (
        <Select
          size="small"
          value={status}
          onChange={(v) => updateApp(a._id, { status: v })}
          options={[
            { value: "draft", label: "Draft" },
            { value: "live", label: "Live" },
            { value: "paused", label: "Paused" },
          ]}
          style={{ minWidth: 100 }}
        />
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      render: (plan: string, a) => (
        <Select
          size="small"
          value={plan}
          onChange={(v) => updateApp(a._id, { plan: v })}
          options={[
            { value: "free", label: "Free" },
            { value: "hosted", label: "Hosted" },
          ]}
          style={{ minWidth: 90 }}
        />
      ),
    },
    {
      title: "Domain",
      dataIndex: "customDomain",
      key: "customDomain",
      render: (d: string | null, a) =>
        d ? (
          <div>
            <Tag color={a.domainVerified ? "success" : "warning"} className="text-xs">
              {a.domainVerified ? "✓" : "⚠"} {d}
            </Tag>
          </div>
        ) : <Text type="secondary" className="text-xs">No domain</Text>,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d: string) => dayjs(d).format("DD MMM YY"),
    },
    {
      title: "",
      key: "actions",
      render: (_, a) => (
        <Popconfirm
          title="Force delete this app?"
          description="All data will be permanently deleted."
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => deleteApp(a._id)}
        >
          <Button danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <Title level={3} className="!mb-1">
          <AppstoreOutlined className="mr-2 text-blue-500" />
          All Apps
        </Title>
        <Text className="text-slate-400">{total} apps across all users</Text>
      </div>

      <Card className="!rounded-xl !border-slate-100">
        <Space className="mb-4 flex-wrap">
          <Input
            placeholder="Search by app name..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => fetchApps(1)}
            allowClear
            style={{ width: 240 }}
          />
          <Select
            placeholder="All Plans"
            value={filterPlan || undefined}
            onChange={(v) => { setFilterPlan(v || ""); }}
            allowClear
            style={{ width: 120 }}
            options={[{ value: "free", label: "Free" }, { value: "hosted", label: "Hosted" }]}
          />
          <Select
            placeholder="All Statuses"
            value={filterStatus || undefined}
            onChange={(v) => { setFilterStatus(v || ""); }}
            allowClear
            style={{ width: 130 }}
            options={[
              { value: "live", label: "Live" },
              { value: "draft", label: "Draft" },
              { value: "paused", label: "Paused" },
            ]}
          />
          <Button type="primary" onClick={() => fetchApps(1)}>Filter</Button>
        </Space>

        <Table
          dataSource={apps}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: (p) => { setPage(p); fetchApps(p); },
            showTotal: (t) => `${t} apps`,
          }}
          size="small"
          scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  );
}
