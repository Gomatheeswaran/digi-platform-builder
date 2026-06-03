"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Card, Table, Typography, Tag, Button, Input,
  Popconfirm, App, Select, Tooltip,
} from "antd";
import {
  SearchOutlined, UserDeleteOutlined, SafetyCertificateOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: "super_admin" | "tenant_admin";
  plan: string;
  isEmailVerified: boolean;
  appCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { message } = App.useApp();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback((p = 1, q = search) => {
    setLoading(true);
    fetch(`/api/admin/users?page=${p}&search=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchUsers(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateUser(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) { message.error(data.error); return; }
    message.success("User updated.");
    fetchUsers(page);
  }

  async function deleteUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { message.error(data.error); return; }
    message.success("User deleted.");
    fetchUsers(page);
  }

  const columns: ColumnsType<UserRow> = [
    {
      title: "User",
      key: "user",
      render: (_, u) => (
        <div>
          <div className="font-medium text-slate-800">{u.name}</div>
          <div className="text-xs text-slate-400">{u.email}</div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string, u) => (
        <Select
          size="small"
          value={role}
          onChange={(v) => updateUser(u._id, { role: v })}
          options={[
            { value: "tenant_admin", label: "Tenant" },
            { value: "super_admin", label: "Super Admin" },
          ]}
          style={{ minWidth: 120 }}
        />
      ),
    },
    {
      title: "Verified",
      dataIndex: "isEmailVerified",
      key: "isEmailVerified",
      render: (v: boolean, u) => (
        <Tooltip title={v ? "Click to unverify" : "Click to verify"}>
          <Tag
            color={v ? "success" : "warning"}
            className="cursor-pointer"
            onClick={() => updateUser(u._id, { isEmailVerified: !v })}
          >
            {v ? "✓ Verified" : "Unverified"}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "Apps",
      dataIndex: "appCount",
      key: "appCount",
      render: (n: number) => <Text>{n}</Text>,
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d: string) => dayjs(d).format("DD MMM YYYY"),
    },
    {
      title: "",
      key: "actions",
      render: (_, u) => (
        <Popconfirm
          title="Delete this user?"
          description="All their apps and data will be deleted."
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => deleteUser(u._id)}
        >
          <Button danger size="small" icon={<UserDeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <Title level={3} className="!mb-1">
          <SafetyCertificateOutlined className="mr-2 text-red-500" />
          User Management
        </Title>
        <Text className="text-slate-400">{total} registered users</Text>
      </div>

      <Card className="!rounded-xl !border-slate-100">
        <div className="flex flex-wrap gap-2 mb-4">
          <Input
            placeholder="Search by name or email..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => fetchUsers(1, search)}
            allowClear
            className="flex-1 min-w-[200px] max-w-sm"
          />
          <Button type="primary" onClick={() => fetchUsers(1, search)}>Search</Button>
        </div>

        <Table
          dataSource={users}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: (p) => { setPage(p); fetchUsers(p); },
            showTotal: (t) => `${t} users`,
          }}
          size="small"
          scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  );
}
