"use client";
import { useState } from "react";
import { Card, Form, Input, Button, Typography, Result, Select, DatePicker, Switch, InputNumber } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { AppConfig, AppTemplate, FieldConfig } from "@/types";
import AppHeader from "../AppHeader";
import AppFooter from "../AppFooter";

const { Title } = Typography;

interface Props {
  app: { id: string; name: string; template: AppTemplate; config: AppConfig };
  pathname: string;
  config: AppConfig;
  basePath?: string;
}

function renderField(field: FieldConfig) {
  const placeholder = `Enter ${field.name.toLowerCase()}`;

  switch (field.type) {
    case "textarea":
      return <Input.TextArea placeholder={placeholder} rows={4} />;
    case "number":
      return <Input type="number" placeholder={placeholder} />;
    case "currency":
      return <InputNumber className="w-full" placeholder={placeholder} prefix="₹" />;
    case "date":
      return <DatePicker className="w-full" />;
    case "datetime":
      return <DatePicker className="w-full" showTime />;
    case "boolean":
      return <Switch />;
    case "select":
      return (
        <Select
          placeholder={`Select ${field.name}`}
          options={(field.options || []).map((o) => ({ value: o, label: o }))}
          className="w-full"
          allowClear
        />
      );
    case "multiselect":
      return (
        <Select
          mode="multiple"
          placeholder={`Select ${field.name}`}
          options={(field.options || []).map((o) => ({ value: o, label: o }))}
          className="w-full"
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

export default function FormCollectorRenderer({ app, pathname, config, basePath = "" }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const formPage = config.pages.find((p) => p.isHome);
  const formComponent = formPage?.components.find((c) => c.type === "form");
  const modelSlug = formComponent?.dataSource || "responses";
  const formTitle = formComponent?.props.title as string || app.name;
  const submitLabel = formComponent?.props.submitLabel as string || "Submit";
  const successMessage = formComponent?.props.successMessage as string || "Thank you! Your response has been recorded.";

  const responseModel = config.dataModels.find((m) => m.slug === modelSlug) ?? config.dataModels[0];
  const effectiveSlug = responseModel?.slug ?? modelSlug;
  const formFields = responseModel?.fields.filter((f) => f.slug !== "submittedAt") || [];

  async function handleSubmit(values: Record<string, unknown>) {
    setLoading(true);
    try {
      // Convert dayjs DatePicker values to ISO strings
      const payload: Record<string, unknown> = {};
      for (const field of formFields) {
        const val = values[field.slug];
        if ((field.type === "date" || field.type === "datetime") && val && dayjs.isDayjs(val)) {
          payload[field.slug] = val.format(field.type === "datetime" ? "YYYY-MM-DDTHH:mm:ss" : "YYYY-MM-DD");
        } else {
          payload[field.slug] = val;
        }
      }

      await fetch(`/api/apps/${app.id}/data?model=${effectiveSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, submittedAt: new Date().toISOString() }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <AppHeader config={config} appName={app.name} pathname={pathname} basePath={basePath} />

      <main className="max-w-lg mx-auto px-4 py-12">
        {submitted ? (
          <Result
            icon={<CheckCircleOutlined style={{ color: config.theme.primaryColor }} />}
            title="Done!"
            subTitle={successMessage}
            extra={
              <Button type="primary" onClick={() => { setSubmitted(false); form.resetFields(); }}>
                Submit Another
              </Button>
            }
          />
        ) : (
          <Card className="!rounded-2xl !border-slate-100 shadow-sm">
            <Title level={3} className="!mb-2">{formTitle}</Title>
            <Form layout="vertical" form={form} onFinish={handleSubmit}>
              {formFields.map((field) => (
                <Form.Item
                  key={field.id}
                  name={field.slug}
                  label={field.name}
                  valuePropName={field.type === "boolean" ? "checked" : "value"}
                  rules={[{ required: field.required, message: `${field.name} is required` }]}
                >
                  {renderField(field)}
                </Form.Item>
              ))}
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                {submitLabel}
              </Button>
            </Form>
          </Card>
        )}
      </main>

      <AppFooter config={config} appName={app.name} basePath={basePath} />
    </div>
  );
}
