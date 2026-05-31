"use client";
import { useEffect, useState } from "react";
import {
  Card, Button, Input, Select, Tag, Typography, Empty,
  Spin, Modal, Form, DatePicker, Switch, Space,
} from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { AppConfig, AppTemplate } from "@/types";
import AppHeader from "../AppHeader";
import AppFooter from "../AppFooter";

const { Title, Text, Paragraph } = Typography;

interface Note {
  _id: string;
  title: string;
  content?: string;
  category?: string;
  date: string;
  pinned?: boolean;
  tags?: string[];
}

interface Props {
  app: { id: string; name: string; template: AppTemplate; config: AppConfig };
  pathname: string;
  config: AppConfig;
}

export default function NotepadRenderer({ app, pathname, config }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [form] = Form.useForm();

  const notesModel = config.dataModels.find((m) => m.slug === "notes");
  const categoryOptions = notesModel?.fields
    .find((f) => f.slug === "category")?.options || [];

  useEffect(() => {
    fetch(`/api/apps/${app.id}/data?model=notes&limit=100`)
      .then((r) => r.json())
      .then((data) => setNotes(data.records || []))
      .finally(() => setLoading(false));
  }, [app.id]);

  async function saveNote(values: Record<string, unknown>) {
    const payload = {
      ...values,
      date: values.date ? dayjs(values.date as string).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
    };

    if (editNote) {
      // Update existing
      await fetch(`/api/apps/${app.id}/data?model=notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      // Create new
      await fetch(`/api/apps/${app.id}/data?model=notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    // Refresh
    const data = await fetch(`/api/apps/${app.id}/data?model=notes&limit=100`).then((r) => r.json());
    setNotes(data.records || []);
    setModalOpen(false);
    form.resetFields();
    setEditNote(null);
  }

  const filtered = notes
    .filter((n) => {
      const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content || "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || n.category === categoryFilter;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Group by date
  const grouped = filtered.reduce((acc, note) => {
    const key = dayjs(note.date).format("MMMM YYYY");
    if (!acc[key]) acc[key] = [];
    acc[key].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  return (
    <div>
      <AppHeader config={config} appName={app.name} pathname={pathname} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Title level={3} className="!mb-0">{app.name}</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditNote(null); form.resetFields(); setModalOpen(true); }}>
            New Note
          </Button>
        </div>

        <div className="flex gap-3 mb-6">
          <Input placeholder="Search notes..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear />
          {categoryOptions.length > 0 && (
            <Select placeholder="All categories" value={categoryFilter || undefined} onChange={setCategoryFilter} allowClear style={{ minWidth: 140 }}
              options={categoryOptions.map((c) => ({ value: c, label: c }))} />
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spin /></div>
        ) : filtered.length === 0 ? (
          <Empty description="No notes yet. Create your first one!" />
        ) : (
          Object.entries(grouped).map(([month, monthNotes]) => (
            <div key={month} className="mb-8">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 sticky top-20 bg-white/80 backdrop-blur py-1">
                {month} · {monthNotes.length} {monthNotes.length === 1 ? "note" : "notes"}
              </div>
              <div className="space-y-3">
                {monthNotes.map((note) => (
                  <Card
                    key={note._id}
                    hoverable
                    className="!rounded-xl !border-slate-100 hover:!border-blue-200"
                    extra={
                      <Space size="small">
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditNote(note); form.setFieldsValue({ ...note, date: dayjs(note.date) }); setModalOpen(true); }} />
                        <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                      </Space>
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          {note.pinned && <span title="Pinned">📌</span>}
                          {note.title}
                        </div>
                        <div className="text-xs text-slate-400 mb-2">
                          {dayjs(note.date).format("ddd, DD MMM YYYY")}
                          {note.category && <> · <Tag className="text-xs">{note.category}</Tag></>}
                        </div>
                        {note.content && (
                          <Paragraph className="!text-slate-600 !mb-0 text-sm line-clamp-2">
                            {note.content}
                          </Paragraph>
                        )}
                      </div>
                    </div>
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
      >
        <Form layout="vertical" form={form} onFinish={saveNote} className="mt-4">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Note title" />
          </Form.Item>
          <Form.Item name="content" label="Content">
            <Input.TextArea rows={5} placeholder="Write your note..." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
              <DatePicker className="w-full" />
            </Form.Item>
            {categoryOptions.length > 0 && (
              <Form.Item name="category" label="Category">
                <Select options={categoryOptions.map((c) => ({ value: c, label: c }))} placeholder="Select..." allowClear />
              </Form.Item>
            )}
          </div>
          <Form.Item name="pinned" valuePropName="checked" label="Pin this note">
            <Switch />
          </Form.Item>
          <div className="flex gap-3 justify-end">
            <Button onClick={() => { setModalOpen(false); setEditNote(null); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Save Note</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
