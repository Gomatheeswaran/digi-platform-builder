"use client";
import { useEffect, useState } from "react";
import { Card, Form, Input, Button, Typography, Table, Empty, Spin, Tag, message } from "antd";
import { SaveOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { AppConfig, AppTemplate, FieldConfig } from "@/types";
import AppHeader from "../AppHeader";
import AppFooter from "../AppFooter";

const { Title, Text } = Typography;

interface Props {
  app: { id: string; name: string; template: AppTemplate; config: AppConfig };
  pathname: string;
  config: AppConfig;
}

function evaluateFormula(formula: string, values: Record<string, number>): number {
  try {
    // Replace field slugs with their values
    let expr = formula;
    for (const [key, val] of Object.entries(values)) {
      expr = expr.replace(new RegExp(`\\b${key}\\b`, "g"), String(val));
    }
    // Safe eval — only allow numbers and operators
    if (!/^[\d\s\+\-\*\/\(\)\.]+$/.test(expr)) return NaN;
    return Function(`"use strict"; return (${expr})`)();
  } catch {
    return NaN;
  }
}

export default function CalculatorRenderer({ app, pathname, config }: Props) {
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [results, setResults] = useState<Record<string, number>>({});

  const calcModel = config.dataModels.find((m) => m.slug === "calculations");
  const inputFields = calcModel?.fields.filter((f) => f.type !== "formula" && f.type !== "date" && f.slug !== "label") || [];
  const formulaFields = calcModel?.fields.filter((f) => f.type === "formula") || [];

  const calcTitle = config.pages.find((p) => p.isHome)?.components.find((c) => c.type === "calculator")?.props.title as string || app.name;
  const calcDesc = config.pages.find((p) => p.isHome)?.components.find((c) => c.type === "calculator")?.props.description as string || "";

  useEffect(() => {
    fetch(`/api/apps/${app.id}/data?model=calculations&limit=50`)
      .then((r) => r.json())
      .then((data) => setHistory(data.records || []))
      .finally(() => setLoading(false));
  }, [app.id]);

  function handleValuesChange(values: Record<string, string>) {
    const numValues: Record<string, number> = {};
    for (const f of inputFields) {
      numValues[f.slug] = parseFloat(values[f.slug] || "0") || 0;
    }
    const newResults: Record<string, number> = {};
    for (const f of formulaFields) {
      if (f.formula) {
        newResults[f.slug] = evaluateFormula(f.formula, numValues);
      }
    }
    setResults(newResults);
  }

  async function saveCalculation(values: Record<string, string>) {
    const numValues: Record<string, number> = {};
    for (const f of inputFields) {
      numValues[f.slug] = parseFloat(values[f.slug] || "0") || 0;
    }
    const formulaResults: Record<string, number> = {};
    for (const f of formulaFields) {
      if (f.formula) formulaResults[f.slug] = evaluateFormula(f.formula, numValues);
    }

    await fetch(`/api/apps/${app.id}/data?model=calculations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, ...formulaResults, date: dayjs().format("YYYY-MM-DD") }),
    });

    message.success("Saved!");
    const data = await fetch(`/api/apps/${app.id}/data?model=calculations&limit=50`).then((r) => r.json());
    setHistory(data.records || []);
  }

  const columns = [
    ...(inputFields.map((f) => ({ title: f.name, dataIndex: f.slug, key: f.slug }))),
    ...(formulaFields.map((f) => ({
      title: f.name,
      dataIndex: f.slug,
      key: f.slug,
      render: (v: number) => <Text strong>{isNaN(v) ? "—" : v.toFixed((config.settings?.decimalPlaces as number) || 2)}</Text>,
    }))),
    { title: "Date", dataIndex: "date", key: "date", render: (v: string) => dayjs(v).format("DD MMM YYYY") },
  ];

  return (
    <div>
      <AppHeader config={config} appName={app.name} pathname={pathname} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card className="!rounded-2xl !border-slate-100 shadow-sm mb-8">
          <Title level={3} className="!mb-1">{calcTitle}</Title>
          {calcDesc && <Text className="text-slate-400 text-sm block mb-6">{calcDesc}</Text>}

          <Form layout="vertical" form={form} onFinish={saveCalculation} onValuesChange={(_, all) => handleValuesChange(all)}>
            {inputFields.map((field) => (
              <Form.Item key={field.id} name={field.slug} label={field.name} rules={[{ required: field.required }]}>
                <Input type="number" placeholder={`Enter ${field.name.toLowerCase()}`} size="large" />
              </Form.Item>
            ))}

            {formulaFields.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <Text className="text-xs text-slate-400 uppercase tracking-wide block mb-3">Results</Text>
                {formulaFields.map((f) => {
                  const val = results[f.slug];
                  return (
                    <div key={f.id} className="flex items-center justify-between">
                      <Text className="text-slate-600">{f.name}</Text>
                      <Text strong className="text-2xl" style={{ color: config.theme.primaryColor }}>
                        {val !== undefined && !isNaN(val)
                          ? val.toFixed((config.settings?.decimalPlaces as number) || 2)
                          : "—"}
                      </Text>
                    </div>
                  );
                })}
              </div>
            )}

            <Form.Item name="label" label="Label (optional)">
              <Input placeholder="e.g. Quote for Client A" />
            </Form.Item>

            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block size="large">
              Save Result
            </Button>
          </Form>
        </Card>

        {/* History */}
        {(config.settings?.saveHistory !== false) && (
          <div>
            <Title level={4} className="!mb-4">Calculation History</Title>
            {loading ? (
              <div className="flex justify-center py-8"><Spin /></div>
            ) : history.length === 0 ? (
              <Empty description="No saved calculations yet" />
            ) : (
              <Table
                dataSource={history.map((h, i) => ({ ...h, key: i }))}
                columns={columns}
                size="small"
                pagination={{ pageSize: 10 }}
                scroll={{ x: true }}
              />
            )}
          </div>
        )}
      </main>

      <AppFooter config={config} appName={app.name} />
    </div>
  );
}
