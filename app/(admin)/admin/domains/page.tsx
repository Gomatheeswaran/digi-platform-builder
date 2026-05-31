"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Card, Table, Typography, Tag, Button, Space,
  Popconfirm, App, Select,
} from "antd";
import { GlobalOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface DomainRow {
  _id: string;
  domain: string;
  verified: boolean;
  sslStatus: string;
  createdAt: string;
  app: { _id: string; name: string; slug: string } | null;
  owner: { name: string; email: string } | null;
}

const SSL_COLOR: Record<string, string> = {
  active: "success", pending: "processing", failed: "error", none: "default",
};

export default function AdminDomainsPage() {
  const { message } = App.useApp();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  const fetchDomains = useCallback((p = 1, v = filter) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), ...(v && { verified: v }) });
    fetch(`/api/admin/domains?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setDomains(data.domains || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchDomains(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function manualVerify(domainId: string) {
    const res = await fetch("/api/admin/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domainId }),
    });
    const data = await res.json();
    if (!res.ok) { message.error(data.error); return; }
    message.success("Domain manually verified and marked live.");
    fetchDomains(page);
  }

  const columns: ColumnsType<DomainRow> = [
    {
      title: "Domain",
      dataIndex: "domain",
      key: "domain",
      render: (d: string) => (
        <a href={`https://${d}`} target="_blank" rel="noreferrer" className="font-medium text-blue-600">
          {d}
        </a>
      ),
    },
    {
      title: "App",
      key: "app",
      render: (_, row) =>
        row.app ? (
          <div>
            <div className="font-medium text-sm">{row.app.name}</div>
            <div className="text-xs text-slate-400">/{row.app.slug}</div>
          </div>
        ) : <Text type="secondary">—</Text>,
    },
    {
      title: "Owner",
      key: "owner",
      render: (_, row) =>
        row.owner ? (
          <div>
            <div className="text-sm font-medium">{row.owner.name}</div>
            <div className="text-xs text-slate-400">{row.owner.email}</div>
          </div>
        ) : <Text type="secondary">—</Text>,
    },
    {
      title: "DNS",
      dataIndex: "verified",
      key: "verified",
      render: (v: boolean) =>
        v ? <Tag color="success">✓ DNS Verified</Tag> : <Tag color="warning">⏳ Pending</Tag>,
    },
    {
      title: "SSL",
      dataIndex: "sslStatus",
      key: "sslStatus",
      render: (s: string) => <Tag color={SSL_COLOR[s] || "default"}>{s}</Tag>,
    },
    {
      title: "Added",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d: string) => dayjs(d).format("DD MMM YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space>
          {!row.verified && (
            <Popconfirm
              title="Manually verify this domain?"
              description="This bypasses DNS check and marks SSL as active."
              onConfirm={() => manualVerify(row._id)}
              okText="Verify"
            >
              <Button size="small" type="primary" icon={<SafetyCertificateOutlined />}>
                Force Verify
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <Title level={3} className="!mb-1">
          <GlobalOutlined className="mr-2 text-purple-500" />
          Domain Management
        </Title>
        <Text className="text-slate-400">{total} custom domains registered</Text>
      </div>

      <Card className="!rounded-xl !border-slate-100">
        <Space className="mb-4">
          <Select
            placeholder="All Domains"
            value={filter || undefined}
            onChange={(v) => { setFilter(v || ""); fetchDomains(1, v || ""); }}
            allowClear
            style={{ width: 180 }}
            options={[
              { value: "true", label: "Verified only" },
              { value: "false", label: "Pending only" },
            ]}
          />
        </Space>

        <Table
          dataSource={domains}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: (p) => { setPage(p); fetchDomains(p); },
            showTotal: (t) => `${t} domains`,
          }}
          size="small"
          scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  );
}
