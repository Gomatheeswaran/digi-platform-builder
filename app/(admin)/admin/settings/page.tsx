"use client";
import { useState } from "react";
import { Card, Button, Typography, Alert, List, App } from "antd";
import { DatabaseOutlined, ThunderboltOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function AdminSettingsPage() {
  const { message } = App.useApp();
  const [indexing, setIndexing] = useState(false);
  const [indexResult, setIndexResult] = useState<string[]>([]);

  async function runSetupIndexes() {
    setIndexing(true);
    setIndexResult([]);
    try {
      const res = await fetch("/api/admin/setup-indexes", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIndexResult(data.indexes || []);
      message.success(`${data.indexes?.length || 0} indexes created/ensured.`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Index setup failed.");
    } finally {
      setIndexing(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Title level={3} className="!mb-1">Platform Settings</Title>
        <Text className="text-slate-400">Infrastructure and maintenance operations</Text>
      </div>

      <Card
        title={<span><DatabaseOutlined className="mr-2" />MongoDB Indexes</span>}
        className="!rounded-xl !border-slate-100 mb-6"
      >
        <Paragraph className="text-slate-500 text-sm mb-4">
          Creates all production indexes on platform collections. This is idempotent — safe to run
          multiple times. Run this once after fresh deployment and after major schema changes.
        </Paragraph>

        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Indexes created"
          description={
            <div className="text-xs text-slate-500">
              platform_users (email unique, role, createdAt) · otps (TTL expiry, email+type) ·
              apps (userId, slug unique, customDomain sparse unique, status, plan, createdAt) ·
              domains (domain unique, appId, userId, verified) · payments (orderId unique, userId, appId)
            </div>
          }
        />

        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          loading={indexing}
          onClick={runSetupIndexes}
        >
          Run Index Setup
        </Button>

        {indexResult.length > 0 && (
          <List
            className="mt-4"
            size="small"
            header={<Text className="text-xs font-medium text-slate-500">Indexes ensured:</Text>}
            dataSource={indexResult}
            renderItem={(item) => (
              <List.Item className="!py-1 !px-0 text-xs text-slate-500 font-mono">{item}</List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
