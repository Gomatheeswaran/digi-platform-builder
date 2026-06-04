"use client";
import { useEffect, useState } from "react";
import { Card, Form, Input, Button, Typography, Alert, Spin, Tag, Descriptions, List, App } from "antd";
import {
  UserOutlined, LockOutlined, MailOutlined, SafetyOutlined,
  DatabaseOutlined, ThunderboltOutlined, SafetyCertificateOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

interface AdminProfile {
  name: string;
  email: string;
  recoveryEmail?: string;
  role: string;
}

export default function AdminSettingsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingRecovery, setSavingRecovery] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexResult, setIndexResult] = useState<string[]>([]);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [passwordForm] = Form.useForm();
  const [recoveryForm] = Form.useForm();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        recoveryForm.setFieldsValue({ recoveryEmail: data.recoveryEmail || "" });
      })
      .finally(() => setLoading(false));
  }, [recoveryForm]);

  async function changePassword(values: { currentPassword: string; newPassword: string }) {
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      message.success("Password updated successfully.");
      passwordForm.resetFields();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Password change failed.");
    } finally { setSavingPassword(false); }
  }

  async function saveRecoveryEmail(values: { recoveryEmail: string }) {
    setSavingRecovery(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryEmail: values.recoveryEmail || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (profile) setProfile({ ...profile, recoveryEmail: values.recoveryEmail || undefined });
      message.success("Recovery email saved.");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Save failed.");
    } finally { setSavingRecovery(false); }
  }

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
    } finally { setIndexing(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><Spin /></div>;

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <Title level={3} className="!mb-1">
          <SafetyCertificateOutlined className="mr-2 text-red-500" />
          Admin Settings
        </Title>
        <Text className="text-slate-400">Super admin account and platform configuration</Text>
      </div>

      {/* Account info */}
      <Card
        title={<><UserOutlined className="mr-2" />Account Info</>}
        className="!rounded-xl !border-slate-100 mb-6"
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Name">{profile?.name}</Descriptions.Item>
          <Descriptions.Item label="Login Email">
            <span className="font-mono text-sm">{profile?.email}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Role"><Tag color="red">super_admin</Tag></Descriptions.Item>
          <Descriptions.Item label="Recovery Email">
            {profile?.recoveryEmail
              ? <span className="text-green-600 font-medium">{profile.recoveryEmail}</span>
              : <Tag color="orange">Not configured</Tag>}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Recovery Email */}
      <Card
        title={<div className="flex items-center gap-2"><SafetyOutlined className="text-blue-500" />Password Recovery Email</div>}
        extra={profile?.recoveryEmail ? <Tag color="green">Set</Tag> : <Tag color="red">Not set</Tag>}
        className="!rounded-xl !border-slate-100 mb-6"
      >
        <Alert
          type="warning"
          showIcon
          message="Action required for super admin"
          description={
            <span>
              Your login email <strong>{profile?.email}</strong> cannot receive emails.
              Add a personal email so you can reset your password via OTP if you forget it.
            </span>
          }
          className="mb-4"
        />
        <Form layout="vertical" form={recoveryForm} onFinish={saveRecoveryEmail}>
          <Form.Item
            name="recoveryEmail"
            label="Recovery Email"
            rules={[{ type: "email", message: "Enter a valid email address" }]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="your-personal@email.com"
              size="large"
              autoComplete="email"
            />
          </Form.Item>
          <div className="flex gap-2">
            <Button type="primary" htmlType="submit" size="large" loading={savingRecovery}>
              Save
            </Button>
            {profile?.recoveryEmail && (
              <Button
                size="large"
                danger
                onClick={() => {
                  recoveryForm.setFieldsValue({ recoveryEmail: "" });
                  saveRecoveryEmail({ recoveryEmail: "" });
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </Form>
      </Card>

      {/* Change Password */}
      <Card
        title={<><LockOutlined className="mr-2" />Change Password</>}
        className="!rounded-xl !border-slate-100 mb-6"
      >
        <Form layout="vertical" form={passwordForm} onFinish={changePassword}>
          <Form.Item name="currentPassword" label="Current Password" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[{ required: true }, { min: 8, message: "At least 8 characters" }]}
          >
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={["newPassword"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                  return Promise.reject(new Error("Passwords do not match."));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" loading={savingPassword}>
            Update Password
          </Button>
        </Form>
      </Card>

      {/* MongoDB Indexes */}
      <Card
        title={<><DatabaseOutlined className="mr-2" />MongoDB Indexes</>}
        className="!rounded-xl !border-slate-100"
      >
        <Paragraph className="text-slate-500 text-sm mb-4">
          Creates all production indexes on platform collections. Idempotent — safe to run multiple times.
          Run once after fresh deployment or major schema changes.
        </Paragraph>
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
