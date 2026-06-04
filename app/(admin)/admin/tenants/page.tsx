"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Card, Table, Typography, Tag, Button, Input, Select, Space,
  Popconfirm, App, Tooltip, Progress,
} from "antd";
import {
  SearchOutlined, StopOutlined, CheckCircleOutlined,
  EyeOutlined, AppstoreOutlined, TeamOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface TenantRow {
  _id: string;
  name: string;
  email: string;
  plan: string;
  isEmailVerified: boolean;
  suspended?: boolean;
  appCount: number;
  hostedApps: number;
  atLimit: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

const FREE_LIMIT = 3;

export default function AdminTenantsPage() {
  const { message } = App.useApp();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback((p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/admin/tenants?${params}`)
      .then((r) => r.json())
      .then((d) => { setTenants(d.tenants || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { load(1); }, [load]);

  async function toggleSuspend(tenant: TenantRow) {
    const next = !tenant.suspended;
    const res = await fetch(`/api/admin/tenants/${tenant._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: next }),
    });
    const data = await res.json();
    if (!res.ok) { message.error(data.error); return; }
    message.success(data.message);
    load(page);
  }

  const columns: ColumnsType<TenantRow> = [
    {
      title: "Tenant",
      key: "tenant",
      render: (_, t) => (
        <div>
          <div className="font-medium text-slate-800">{t.name}</div>
          <div className="text-xs text-slate-400">{t.email}</div>
          {!t.isEmailVerified && <Tag color="warning" className="text-xs mt-0.5">Unverified</Tag>}
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 110,
      render: (_, t) => t.suspended
        ? <Tag color="error" icon={<StopOutlined />}>Suspended</Tag>
        : <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>,
    },
    {
      title: "Apps",
      key: "apps",
      width: 160,
      render: (_, t) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Text className="text-sm font-medium">{t.appCount}/{FREE_LIMIT}</Text>
            {t.atLimit && <Tag color="orange" className="text-xs">At limit</Tag>}
          </div>
          <Progress
            percent={Math.min(100, (t.appCount / FREE_LIMIT) * 100)}
            size="small"
            showInfo={false}
            strokeColor={t.atLimit ? "#f59e0b" : "#3b82f6"}
          />
          {t.hostedApps > 0 && (
            <div className="text-xs text-slate-400 mt-0.5">{t.hostedApps} hosted</div>
          )}
        </div>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      width: 90,
      render: (plan: string) => (
        <Tag color={plan === "pro" ? "purple" : plan === "starter" ? "blue" : "default"}>
          {plan}
        </Tag>
      ),
    },
    {
      title: "Last Active",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      width: 120,
      render: (d?: string) => d
        ? <Tooltip title={dayjs(d).format("DD MMM YYYY HH:mm")}><span className="text-sm">{dayjs(d).fromNow()}</span></Tooltip>
        : <Text type="secondary" className="text-xs">Never</Text>,
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 110,
      render: (d: string) => dayjs(d).format("DD MMM YYYY"),
    },
    {
      title: "",
      key: "actions",
      width: 100,
      render: (_, t) => (
        <Space>
          <Tooltip title="View details">
            <Link href={`/admin/tenants/${t._id}`}>
              <Button size="small" icon={<EyeOutlined />} />
            </Link>
          </Tooltip>
          <Tooltip title={t.suspended ? "Reactivate account" : "Suspend account"}>
            <Popconfirm
              title={t.suspended ? "Reactivate this account?" : "Suspend this account?"}
              description={
                t.suspended
                  ? "The tenant will regain full access."
                  : "The tenant will be locked out immediately."
              }
              okText={t.suspended ? "Reactivate" : "Suspend"}
              okButtonProps={{ danger: !t.suspended }}
              onConfirm={() => toggleSuspend(t)}
            >
              <Button
                size="small"
                danger={!t.suspended}
                type={t.suspended ? "primary" : "default"}
                icon={t.suspended ? <CheckCircleOutlined /> : <StopOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <Title level={3} className="!mb-1">
          <TeamOutlined className="mr-2 text-blue-500" />
          Tenant Management
        </Title>
        <Text className="text-slate-400">{total} registered tenants</Text>
      </div>

      <Card className="!rounded-xl !border-slate-100">
        <div className="flex flex-wrap gap-3 mb-4">
          <Input
            placeholder="Search by name or email..."
            prefix={<SearchOutlined />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={() => { setSearch(searchInput); setPage(1); }}
            allowClear
            onClear={() => { setSearchInput(""); setSearch(""); setPage(1); }}
            className="max-w-xs"
          />
          <Select
            placeholder="All Statuses"
            value={statusFilter || undefined}
            onChange={(v) => { setStatusFilter(v || ""); setPage(1); }}
            allowClear
            style={{ width: 150 }}
            options={[
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => { setSearch(searchInput); setPage(1); }}
          >
            Search
          </Button>
        </div>

        <Table
          dataSource={tenants}
          columns={columns}
          rowKey="_id"
          loading={loading}
          scroll={{ x: "max-content" }}
          rowClassName={(t) => t.suspended ? "opacity-60" : ""}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            showTotal: (n) => `${n} tenants`,
            onChange: (p) => { setPage(p); load(p); },
          }}
          size="small"
        />
      </Card>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <AppstoreOutlined />
        Free tier limit: {FREE_LIMIT} apps per tenant. Tenants at the limit cannot create new apps.
      </div>
    </div>
  );
}
