"use client";
import { useState, Suspense } from "react";
import { Typography, Card, Input, Button, Form, Alert, Row, Col, Tag } from "antd";
import { ArrowLeftOutlined, CheckCircleFilled } from "@ant-design/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const { Title, Text, Paragraph } = Typography;

const TEMPLATES = [
  {
    id: "ecommerce",
    name: "E-Commerce Store",
    description: "Full online store with products, cart, Razorpay payments, and invoices.",
    icon: "🛍️",
    color: "#fff2e8",
    border: "#ffbb96",
    features: ["Products & categories", "Shopping cart", "Razorpay checkout", "Invoices & orders"],
    popular: true,
  },
  {
    id: "notepad",
    name: "Smart Notepad",
    description: "Date-based note taking with categories, tags, and search.",
    icon: "📓",
    color: "#e6f4ff",
    border: "#91caff",
    features: ["Date-grouped notes", "Categories & tags", "Search", "Calendar view"],
    popular: false,
  },
  {
    id: "calculator",
    name: "Custom Calculator",
    description: "Build calculators with custom input fields and formula-driven outputs.",
    icon: "🧮",
    color: "#f9f0ff",
    border: "#d3adf7",
    features: ["Custom fields", "Formula engine", "Save results", "History view"],
    popular: false,
  },
  {
    id: "directory",
    name: "Business Directory",
    description: "Searchable directory of listings, businesses, or services.",
    icon: "📋",
    color: "#e6fffb",
    border: "#87e8de",
    features: ["Searchable listings", "Category filters", "Contact info", "Submission form"],
    popular: false,
  },
  {
    id: "form_collector",
    name: "Form Collector",
    description: "Collect responses via custom forms. Great for surveys, registrations, feedback.",
    icon: "📝",
    color: "#fff7e6",
    border: "#ffd591",
    features: ["Custom form fields", "Email notifications", "Response dashboard", "CSV export"],
    popular: false,
  },
  {
    id: "blank",
    name: "Blank App",
    description: "Start from scratch — add any pages, components, and data models.",
    icon: "⬜",
    color: "#fafafa",
    border: "#d9d9d9",
    features: ["All component types", "Custom data models", "Any integration"],
    popular: false,
  },
];

function NewAppForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("template");

  const [selectedTemplate, setSelectedTemplate] = useState<string>(preselected || "");
  const [step, setStep] = useState<"template" | "details">(preselected ? "details" : "template");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form] = Form.useForm();

  function handleTemplateSelect(id: string) {
    setSelectedTemplate(id);
    setStep("details");
  }

  async function handleCreate(values: { name: string; slug: string; description: string }) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, template: selectedTemplate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/apps/${data.id}/builder`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create app.");
    } finally {
      setLoading(false);
    }
  }

  function slugifyName(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
      .substring(0, 40);
  }

  const selected = TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/apps">
          <Button icon={<ArrowLeftOutlined />} type="text" />
        </Link>
        <div>
          <Title level={3} className="!mb-0">Create New App</Title>
          <Text className="text-slate-400">
            {step === "template" ? "Choose a template to start with" : "Configure your app"}
          </Text>
        </div>
      </div>

      {/* Step: Template Selection */}
      {step === "template" && (
        <Row gutter={[16, 16]}>
          {TEMPLATES.map((tmpl) => (
            <Col xs={24} md={12} lg={8} key={tmpl.id}>
              <Card
                hoverable
                onClick={() => handleTemplateSelect(tmpl.id)}
                className="!rounded-xl !border-2 cursor-pointer h-full transition-all hover:!border-blue-400 hover:shadow-md"
                style={{ borderColor: tmpl.border, background: tmpl.color }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{tmpl.icon}</div>
                  {tmpl.popular && <Tag color="blue">Popular</Tag>}
                </div>
                <div className="font-semibold text-slate-800 mb-1">{tmpl.name}</div>
                <Paragraph className="!text-slate-500 !text-sm !mb-3 line-clamp-2">
                  {tmpl.description}
                </Paragraph>
                <div className="space-y-1">
                  {tmpl.features.map((f) => (
                    <div key={f} className="flex items-center gap-1 text-xs text-slate-500">
                      <CheckCircleFilled className="text-green-500 text-xs" />
                      {f}
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Step: App Details */}
      {step === "details" && selected && (
        <div className="max-w-lg">
          <Card className="!rounded-xl !border-slate-100 !mb-6" style={{ background: selected.color, borderColor: selected.border }}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{selected.icon}</div>
              <div>
                <div className="font-semibold text-slate-800">{selected.name}</div>
                <div className="text-sm text-slate-500">{selected.description}</div>
              </div>
              <Button
                type="link"
                size="small"
                className="ml-auto"
                onClick={() => setStep("template")}
              >
                Change
              </Button>
            </div>
          </Card>

          {error && (
            <Alert message={error} type="error" showIcon className="mb-4" closable onClose={() => setError("")} />
          )}

          <Card className="!rounded-xl !border-slate-100">
            <Form
              layout="vertical"
              form={form}
              onFinish={handleCreate}
              onValuesChange={(changed) => {
                if (changed.name) {
                  form.setFieldValue("slug", slugifyName(changed.name));
                }
              }}
            >
              <Form.Item
                name="name"
                label="App Name"
                rules={[{ required: true, message: "App name is required" }]}
              >
                <Input placeholder="e.g. My Cracker Store" size="large" />
              </Form.Item>

              <Form.Item
                name="slug"
                label="App Slug (URL identifier)"
                help="Used in the URL. Letters, numbers, and hyphens only."
                rules={[
                  { required: true, message: "Slug is required" },
                  { pattern: /^[a-z0-9-]{3,40}$/, message: "3-40 lowercase letters, numbers, or hyphens" },
                ]}
              >
                <Input
                  placeholder="my-cracker-store"
                  size="large"
                  addonBefore="/"
                />
              </Form.Item>

              <Form.Item name="description" label="Description (optional)">
                <Input.TextArea
                  placeholder="What does this app do?"
                  rows={3}
                />
              </Form.Item>

              <div className="flex gap-3">
                <Button size="large" onClick={() => setStep("template")}>Back</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  className="flex-1"
                  loading={loading}
                >
                  Create App & Open Builder
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function NewAppPage() {
  return (
    <Suspense>
      <NewAppForm />
    </Suspense>
  );
}
