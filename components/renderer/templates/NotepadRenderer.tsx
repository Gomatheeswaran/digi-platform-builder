"use client";
import React, { useEffect, useState } from "react";
import {
  Card, Button, Input, Select, Tag, Typography, Empty,
  Spin, Modal, Form, DatePicker, Switch, InputNumber, Space,
} from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { AppConfig, AppTemplate, FieldConfig } from "@/types";
import AppHeader from "../AppHeader";
import AppFooter from "../AppFooter";

const { Title, Paragraph } = Typography;

type NoteRecord = Record<string, unknown>;

interface Props {
  app: { id: string; name: string; template: AppTemplate; config: AppConfig };
  pathname: string;
  config: AppConfig;
}

function renderFormField(field: FieldConfig) {
  const placeholder = `Enter ${field.name.toLowerCase()}`;
  switch (field.type) {
    case "textarea":
      return <Input.TextArea rows={4} placeholder={placeholder} />;
    case "number":
    case "currency":
      return <InputNumber className="w-full" placeholder={placeholder} />;
    case "date":
      return <DatePicker className="w-full" />;
    case "datetime":
      return <DatePicker className="w-full" showTime />;
    case "boolean":
      return <Switch />;
    case "select":
      return (
        <Select
          className="w-full"
          placeholder={`Select ${field.name}`}
          options={(field.options || []).map((o) => ({ value: o, label: o }))}
          allowClear
        />
      );
    case "multiselect":
      return (
        <Select
          mode="multiple"
          className="w-full"
          placeholder={`Select ${field.name}`}
          options={(field.options || []).map((o) => ({ value: o, label: o }))}
        />
      );
    case "email":
      return <Input type="email" placeholder={placeholder} />;
    case "phone":
      return <Input type="tel" placeholder={placeholder} />;
    case "url":
      return <Input type="url" placeholder={placeholder} />;
    default:
      return <Input placeholder={placeholder} />;
  }
}

function formatValue(field: FieldConfig, value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") return null;
  switch (field.type) {
    case "boolean":
      return value ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>;
    case "date":
      return dayjs(value as string).format("DD MMM YYYY");
    case "datetime":
      return dayjs(value as string).format("DD MMM YYYY HH:mm");
    case "select":
    case "multiselect":
      return Array.isArray(value)
        ? value.map((v: string) => <Tag key={v}>{v}</Tag>)
        : <Tag>{String(value)}</Tag>;
    case "url":
      return <a href={value as string} target="_blank" rel="noreferrer" className="text-blue-500 underline">{value as string}</a>;
    case "currency":
      return `₹${Number(value).toLocaleString("en-IN")}`;
    default:
      return String(value);
  }
}

export default function NotepadRenderer({ app, pathname, config }: Props) {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editNote, setEditNote] = useState<NoteRecord | null>(null);
  const [form] = Form.useForm();

  const notesModel = config.dataModels.find((m) => m.slug === "notes") ?? config.dataModels[0];
  const modelSlug = notesModel?.slug ?? "notes";
  const fields = notesModel?.fields || [];

  // Identify structural fields by slug/type for smart card rendering
  const titleField = fields.find((f) => f.slug === "title") ?? fields.find((f) => f.type === "text") ?? fields[0];
  const contentField = fields.find((f) => f.slug === "content") ?? fields.find((f) => f.type === "textarea");
  const dateField = fields.find((f) => f.slug === "date" && f.type === "date");
  const pinnedField = fields.find((f) => f.slug === "pinned" && f.type === "boolean");
  const categoryField = fields.find((f) => f.slug === "category" && (f.type === "select" || f.type === "multiselect"));
  const categoryOptions = categoryField?.options || [];

  // Remaining fields shown as key-value rows on the card
  const extraFields = fields.filter(
    (f) => f !== titleField && f !== contentField && f !== dateField && f !== pinnedField && f !== categoryField
  );

  async function loadNotes() {
    const data = await fetch(`/api/apps/${app.id}/data?model=${modelSlug}&limit=100`).then((r) => r.json());
    setNotes(data.records || []);
  }

  useEffect(() => {
    loadNotes().finally(() => setLoading(false));
  }, [app.id]);

  async function saveNote(values: Record<string, unknown>) {
    // Convert dayjs DatePicker values to strings
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const val = values[field.slug];
      if ((field.type === "date" || field.type === "datetime") && val && dayjs.isDayjs(val)) {
        payload[field.slug] = val.format(field.type === "datetime" ? "YYYY-MM-DDTHH:mm:ss" : "YYYY-MM-DD");
      } else {
        payload[field.slug] = val;
      }
    }

    if (editNote) {
      await fetch(`/api/apps/${app.id}/data/${editNote._id as string}?model=${modelSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`/api/apps/${app.id}/data?model=${modelSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    await loadNotes();
    setModalOpen(false);
    form.resetFields();
    setEditNote(null);
  }

  async function deleteNote(note: NoteRecord) {
    await fetch(`/api/apps/${app.id}/data/${note._id as string}?model=${modelSlug}`, { method: "DELETE" });
    await loadNotes();
  }

  function openCreate() {
    setEditNote(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(note: NoteRecord) {
    setEditNote(note);
    const values: Record<string, unknown> = {};
    for (const field of fields) {
      const val = note[field.slug];
      if ((field.type === "date" || field.type === "datetime") && val) {
        values[field.slug] = dayjs(val as string);
      } else {
        values[field.slug] = val;
      }
    }
    form.setFieldsValue(values);
    setModalOpen(true);
  }

  const textFields = fields.filter((f) => f.type === "text" || f.type === "textarea");

  const filtered = notes
    .filter((n) => {
      const matchSearch =
        !search ||
        textFields.some((f) => String(n[f.slug] || "").toLowerCase().includes(search.toLowerCase()));
      const matchCategory =
        !categoryField || !categoryFilter || n[categoryField.slug] === categoryFilter;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      const pinA = pinnedField ? Boolean(a[pinnedField.slug]) : false;
      const pinB = pinnedField ? Boolean(b[pinnedField.slug]) : false;
      if (pinA && !pinB) return -1;
      if (!pinA && pinB) return 1;
      if (dateField) {
        return (
          new Date(b[dateField.slug] as string).getTime() -
          new Date(a[dateField.slug] as string).getTime()
        );
      }
      return 0;
    });

  const grouped: Record<string, NoteRecord[]> = dateField
    ? filtered.reduce<Record<string, NoteRecord[]>>((acc, note) => {
        const key = note[dateField.slug]
          ? dayjs(note[dateField.slug] as string).format("MMMM YYYY")
          : "No Date";
        if (!acc[key]) acc[key] = [];
        acc[key].push(note);
        return acc;
      }, {})
    : { "All Notes": filtered };

  return (
    <div>
      <AppHeader config={config} appName={app.name} pathname={pathname} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Title level={3} className="!mb-0">{app.name}</Title>
          {notesModel?.allowCreate !== false && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New Note
            </Button>
          )}
        </div>

        <div className="flex gap-3 mb-6">
          <Input
            placeholder="Search notes..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          {categoryOptions.length > 0 && (
            <Select
              placeholder="All categories"
              value={categoryFilter || undefined}
              onChange={setCategoryFilter}
              allowClear
              style={{ minWidth: 140 }}
              options={categoryOptions.map((c) => ({ value: c, label: c }))}
            />
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spin /></div>
        ) : filtered.length === 0 ? (
          <Empty description="No notes yet. Create your first one!" />
        ) : (
          Object.entries(grouped).map(([group, groupNotes]) => (
            <div key={group} className="mb-8">
              {dateField && (
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 sticky top-20 bg-white/80 backdrop-blur py-1">
                  {group} · {groupNotes.length} {groupNotes.length === 1 ? "note" : "notes"}
                </div>
              )}
              <div className="space-y-3">
                {groupNotes.map((note) => (
                  <Card
                    key={note._id as string}
                    hoverable
                    className="!rounded-xl !border-slate-100 hover:!border-blue-200"
                    extra={
                      <Space size="small">
                        {notesModel?.allowEdit !== false && (
                          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(note)} />
                        )}
                        {notesModel?.allowDelete !== false && (
                          <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => deleteNote(note)} />
                        )}
                      </Space>
                    }
                  >
                    {/* Title */}
                    {titleField && (
                      <div className="font-semibold text-slate-800 flex items-center gap-2 mb-1">
                        {pinnedField && Boolean(note[pinnedField.slug]) && <span title="Pinned">📌</span>}
                        {String(note[titleField.slug] ?? "")}
                      </div>
                    )}

                    {/* Date + category sub-header */}
                    {(dateField || categoryField) && (
                      <div className="text-xs text-slate-400 mb-2 flex items-center gap-2 flex-wrap">
                        {dateField && Boolean(note[dateField.slug]) && (
                          <span>{dayjs(note[dateField.slug] as string).format("ddd, DD MMM YYYY")}</span>
                        )}
                        {categoryField && Boolean(note[categoryField.slug]) && (
                          <Tag className="text-xs">{String(note[categoryField.slug])}</Tag>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    {contentField && Boolean(note[contentField.slug]) && (
                      <Paragraph className="!text-slate-600 !mb-2 text-sm line-clamp-2">
                        {String(note[contentField.slug])}
                      </Paragraph>
                    )}

                    {/* All other fields */}
                    {extraFields
                      .filter((f) => note[f.slug] !== null && note[f.slug] !== undefined && note[f.slug] !== "")
                      .map((field) => (
                        <div key={field.id} className="text-sm text-slate-500 flex items-center gap-1 mb-1">
                          <span className="text-slate-400 font-medium">{field.name}:</span>
                          <span>{formatValue(field, note[field.slug]) as React.ReactNode}</span>
                        </div>
                      ))}
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      <AppFooter config={config} appName={app.name} />

      <Modal
        title={editNote ? "Edit Note" : "New Note"}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditNote(null); form.resetFields(); }}
        footer={null}
        width={520}
      >
        <Form layout="vertical" form={form} onFinish={saveNote} className="mt-4">
          {fields.map((field) => (
            <Form.Item
              key={field.id}
              name={field.slug}
              label={field.name}
              valuePropName={field.type === "boolean" ? "checked" : "value"}
              rules={[{ required: field.required, message: `${field.name} is required` }]}
            >
              {renderFormField(field)}
            </Form.Item>
          ))}
          <div className="flex gap-3 justify-end pt-2">
            <Button onClick={() => { setModalOpen(false); setEditNote(null); form.resetFields(); }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">Save Note</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
