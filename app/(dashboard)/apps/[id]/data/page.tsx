"use client";
import { useEffect, useState, use } from "react";
import {
  Card, Table, Button, Typography, Tag, Space, Spin, Alert,
  Drawer, Form, Input, InputNumber, Select, Switch, DatePicker,
  Popconfirm, Empty, Tabs, App, Upload, Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ArrowLeftOutlined, DatabaseOutlined, CloudUploadOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";
import type { DataModelConfig, FieldConfig, AppConfig } from "@/types";

const { Title, Text } = Typography;

interface AppData {
  _id: string;
  name: string;
  config: AppConfig;
}

interface RecordRow {
  _id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

// Render a form field based on its FieldConfig type
function FieldFormItem({ field }: { field: FieldConfig }) {
  const rules = field.required ? [{ required: true, message: `${field.name} is required` }] : [];

  let input: React.ReactNode;
  switch (field.type) {
    case "textarea":
      input = <Input.TextArea rows={3} />;
      break;
    case "number":
    case "currency":
      input = <InputNumber className="w-full" />;
      break;
    case "boolean":
      input = <Switch />;
      break;
    case "select":
      input = (
        <Select options={(field.options || []).map((o) => ({ value: o, label: o }))} />
      );
      break;
    case "multiselect":
      input = (
        <Select
          mode="multiple"
          options={(field.options || []).map((o) => ({ value: o, label: o }))}
        />
      );
      break;
    case "date":
    case "datetime":
      input = <DatePicker className="w-full" showTime={field.type === "datetime"} />;
      break;
    case "email":
      input = <Input type="email" />;
      break;
    case "url":
      input = <Input type="url" />;
      break;
    case "phone":
      input = <Input type="tel" />;
      break;
    case "image":
      return (
        <Form.Item label={field.name}>
          <div className="space-y-2">
            <Tooltip title="File upload coming soon">
              <Upload.Dragger
                disabled
                showUploadList={false}
                style={{ opacity: 0.5, cursor: "not-allowed" }}
              >
                <p className="ant-upload-drag-icon">
                  <CloudUploadOutlined />
                </p>
                <p className="ant-upload-text text-sm">Click or drag to upload</p>
                <p className="ant-upload-hint text-xs">Upload feature coming soon</p>
              </Upload.Dragger>
            </Tooltip>
            <Form.Item name={field.slug} noStyle rules={rules}>
              <Input placeholder="Or paste image URL: https://example.com/image.jpg" />
            </Form.Item>
          </div>
        </Form.Item>
      );
    case "relation":
      input = <Input />;
      break;
    case "formula":
      return null; // computed, not editable
    default:
      input = <Input />;
  }

  return (
    <Form.Item
      name={field.slug}
      label={field.name}
      rules={rules}
      valuePropName={field.type === "boolean" ? "checked" : undefined}
    >
      {input}
    </Form.Item>
  );
}

// Build table columns from field config
function buildColumns(
  fields: FieldConfig[],
  model: DataModelConfig,
  onEdit: (record: RecordRow) => void,
  onDelete: (id: string) => void
): ColumnsType<RecordRow> {
  const cols: ColumnsType<RecordRow> = fields
    .filter((f) => f.type !== "formula" && f.type !== "textarea")
    .slice(0, 5)
    .map((f) => ({
      title: f.name,
      dataIndex: f.slug,
      key: f.slug,
      ellipsis: true,
      render: (val: unknown) => {
        if (val === null || val === undefined || val === "") return <Text type="secondary">—</Text>;
        if (typeof val === "boolean") return <Tag color={val ? "success" : "default"}>{val ? "Yes" : "No"}</Tag>;
        if (f.type === "currency") return `₹${Number(val).toLocaleString("en-IN")}`;
        return String(val).slice(0, 60);
      },
    }));

  cols.push({
    title: "Created",
    dataIndex: "createdAt",
    key: "createdAt",
    ellipsis: true,
    render: (val: unknown) => val ? dayjs(val as string).format("DD MMM, h:mm A") : "—",
  });

  if (model.allowEdit || model.allowDelete) {
    cols.push({
      title: "",
      dataIndex: "_id",
      key: "actions",
      ellipsis: false,
      render: (_: unknown, record: unknown) => {
        const row = record as RecordRow;
        return (
          <Space>
            {model.allowEdit && (
              <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(row)} />
            )}
            {model.allowDelete && (
              <Popconfirm
                title="Delete this record?"
                okText="Delete"
                okButtonProps={{ danger: true }}
                onConfirm={() => onDelete(row._id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        );
      },
    });
  }

  return cols;
}

function ModelDataTab({
  appId,
  model,
}: {
  appId: string;
  model: DataModelConfig;
}) {
  const { message: appMessage } = App.useApp();
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<RecordRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  function fetchRecords(p = page) {
    setLoading(true);
    fetch(`/api/apps/${appId}/data?model=${model.slug}&page=${p}&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        setRecords(data.records || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchRecords(1); }, [model.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setDrawerOpen(true);
  }

  function openEdit(record: RecordRow) {
    setEditing(record);
    // Convert date fields to dayjs
    const vals: Record<string, unknown> = {};
    for (const field of model.fields) {
      const v = record[field.slug];
      if ((field.type === "date" || field.type === "datetime") && v) {
        vals[field.slug] = dayjs(v as string);
      } else {
        vals[field.slug] = v;
      }
    }
    form.setFieldsValue(vals);
    setDrawerOpen(true);
  }

  async function saveRecord(values: Record<string, unknown>) {
    setSaving(true);
    try {
      // Convert dayjs back to ISO string
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v && typeof v === "object" && "toISOString" in v) {
          payload[k] = (v as Date).toISOString();
        } else {
          payload[k] = v;
        }
      }

      if (editing) {
        const res = await fetch(
          `/api/apps/${appId}/data/${editing._id}?model=${model.slug}`,
          { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
        );
        if (!res.ok) throw new Error((await res.json()).error);
        appMessage.success("Record updated.");
      } else {
        const res = await fetch(
          `/api/apps/${appId}/data?model=${model.slug}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
        );
        if (!res.ok) throw new Error((await res.json()).error);
        appMessage.success("Record created.");
      }
      setDrawerOpen(false);
      fetchRecords(editing ? page : 1);
    } catch (e) {
      appMessage.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(id: string) {
    try {
      const res = await fetch(`/api/apps/${appId}/data/${id}?model=${model.slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      appMessage.success("Record deleted.");
      fetchRecords(page);
    } catch (e) {
      appMessage.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const editableFields = model.fields.filter((f) => f.type !== "formula");
  const columns = buildColumns(model.fields, model, openEdit, deleteRecord);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Text className="text-slate-500 text-sm">{total} records total</Text>
        </div>
        {model.allowCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Record
          </Button>
        )}
      </div>

      <Table
        dataSource={records}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          showSizeChanger: false,
          onChange: (p) => { setPage(p); fetchRecords(p); },
          showTotal: (t) => `${t} records`,
        }}
        locale={{ emptyText: <Empty description="No records yet" /> }}
        scroll={{ x: "max-content" }}
        size="small"
      />

      <Drawer
        title={editing ? `Edit ${model.name}` : `Add ${model.name}`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ wrapper: { width: "min(480px, 100vw)" } }}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              {editing ? "Update" : "Create"}
            </Button>
          </div>
        }
      >
        <Form layout="vertical" form={form} onFinish={saveRecord}>
          {editableFields.map((field) => (
            <FieldFormItem key={field.id} field={field} />
          ))}
        </Form>
      </Drawer>
    </div>
  );
}

export default function AppDataPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/apps/${id}`)
      .then((r) => r.json())
      .then(setAppData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-16"><Spin size="large" /></div>;
  if (!appData) return <Alert message="App not found" type="error" />;

  const models = appData.config.dataModels;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/apps/${id}`}><Button icon={<ArrowLeftOutlined />} type="text" className="flex-shrink-0" /></Link>
        <div className="min-w-0">
          <Title level={4} className="!mb-0 truncate">
            <DatabaseOutlined className="mr-2 text-blue-500" />
            {appData.name} — Data Manager
          </Title>
          <Text className="text-slate-400 text-sm">View and manage all data in your app</Text>
        </div>
      </div>

      {models.length === 0 ? (
        <Card className="!rounded-xl !border-slate-100">
          <Empty
            description={
              <div className="text-center">
                <div className="font-medium text-slate-600 mb-2">No data models configured</div>
                <Text className="text-slate-400 text-sm">
                  Go to the App Builder → Data Models tab to define your data structure.
                </Text>
              </div>
            }
          >
            <Link href={`/apps/${id}/builder`}>
              <Button type="primary">Open Builder</Button>
            </Link>
          </Empty>
        </Card>
      ) : (
        <Card className="!rounded-xl !border-slate-100">
          <Tabs
            defaultActiveKey={models[0]?.slug}
            items={models.map((model) => ({
              key: model.slug,
              label: (
                <span>
                  {model.name}
                  <Tag className="ml-2 text-xs" color="blue">{model.slug}</Tag>
                </span>
              ),
              children: <ModelDataTab appId={id} model={model} />,
            }))}
          />
        </Card>
      )}
    </div>
  );
}
