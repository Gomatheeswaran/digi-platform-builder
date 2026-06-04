"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Card, Table, Typography, Tag, Input, Button, Row, Col, Statistic, Space,
} from "antd";
import { SearchOutlined, ReloadOutlined, CreditCardOutlined, TeamOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  createdAt: string;
  user?: { _id: string; name: string; email: string };
  app?: { _id: string; name: string; plan: string };
}

interface PageData {
  records: Payment[];
  total: number;
  page: number;
  limit: number;
  summary: { totalPaise: number; count: number };
}

export default function AdminPaymentsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/payments?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  function handleSearch() {
    setPage(1);
    setSearch(searchInput);
  }

  const columns: ColumnsType<Payment> = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (d: string) => (
        <div>
          <div className="font-medium text-sm">{dayjs(d).format("DD MMM YYYY")}</div>
          <div className="text-xs text-slate-400">{dayjs(d).format("hh:mm A")}</div>
        </div>
      ),
    },
    {
      title: "Tenant",
      key: "tenant",
      render: (_: unknown, row: Payment) => (
        <div>
          <div className="font-medium">{row.user?.name || "—"}</div>
          <div className="text-xs text-slate-400">{row.user?.email || "—"}</div>
        </div>
      ),
    },
    {
      title: "App",
      key: "app",
      render: (_: unknown, row: Payment) => (
        <div>
          <div className="font-medium">{row.app?.name || "—"}</div>
          {row.app?.plan && <Tag color="blue" className="text-xs">{row.app.plan}</Tag>}
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 110,
      render: (amount: number, row: Payment) => (
        <Text strong className="text-green-600">
          {row.currency === "INR" ? "₹" : row.currency}{(amount / 100).toLocaleString("en-IN")}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => (
        <Tag color={status === "captured" ? "green" : status === "failed" ? "red" : "orange"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Payment ID",
      key: "paymentId",
      render: (_: unknown, row: Payment) => (
        <div>
          <div className="font-mono text-xs text-slate-600">{row.razorpayPaymentId || "—"}</div>
          <div className="font-mono text-xs text-slate-400">{row.razorpayOrderId}</div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <Title level={3} className="!mb-1">Transactions</Title>
        <Text className="text-slate-400">All platform subscription payments</Text>
      </div>

      {/* Summary cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={8}>
          <Card className="!rounded-xl !border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white">
                <CreditCardOutlined className="text-lg" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Total Revenue</div>
                <div className="text-2xl font-bold text-slate-800">
                  ₹{((data?.summary.totalPaise || 0) / 100).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="!rounded-xl !border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                <TeamOutlined className="text-lg" />
              </div>
              <Statistic
                title={<span className="text-xs text-slate-400">Total Transactions</span>}
                value={data?.summary.count || 0}
                valueStyle={{ fontSize: 24 }}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="!rounded-xl !border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white">
                <CreditCardOutlined className="text-lg" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Avg. per Transaction</div>
                <div className="text-2xl font-bold text-slate-800">
                  ₹{data?.summary.count
                    ? ((data.summary.totalPaise / data.summary.count) / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                    : 0}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="!rounded-xl !border-slate-100 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Search by tenant, email, app or payment ID..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={handleSearch}
            className="max-w-sm"
            allowClear
            onClear={() => { setSearchInput(""); setSearch(""); setPage(1); }}
          />
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>Search</Button>
            <Button icon={<ReloadOutlined />} onClick={() => { setSearchInput(""); setSearch(""); setPage(1); load(); }}>Reset</Button>
          </Space>
        </div>
      </Card>

      {/* Table */}
      <Card className="!rounded-xl !border-slate-100">
        <Table
          columns={columns}
          dataSource={data?.records || []}
          rowKey="_id"
          loading={loading}
          scroll={{ x: "max-content" }}
          pagination={{
            current: page,
            pageSize: limit,
            total: data?.total || 0,
            showTotal: (t) => `${t} transactions`,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
}
