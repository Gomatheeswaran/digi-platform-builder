"use client";
import { useEffect, useState } from "react";
import { Card, Form, Input, Button, Typography, Alert, Spin, App, Tag } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, SafetyOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function SettingsPage() {
  const { message: appMessage } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingRecovery, setSavingRecovery] = useState(false);
  const [error, setError] = useState("");
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [recoveryForm] = Form.useForm();
  const [currentRecoveryEmail, setCurrentRecoveryEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        profileForm.setFieldsValue({ name: data.name, email: data.email });
        recoveryForm.setFieldsValue({ recoveryEmail: data.recoveryEmail || "" });
        setCurrentRecoveryEmail(data.recoveryEmail || null);
      })
      .finally(() => setLoading(false));
  }, [profileForm, recoveryForm]);

  async function saveProfile(values: { name: string }) {
    setSavingProfile(true); setError("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      appMessage.success("Profile saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally { setSavingProfile(false); }
  }

  async function changePassword(values: { currentPassword: string; newPassword: string }) {
    setSavingPassword(true); setError("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      appMessage.success("Password updated successfully.");
      passwordForm.resetFields();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Password change failed.");
    } finally { setSavingPassword(false); }
  }

  async function saveRecoveryEmail(values: { recoveryEmail: string }) {
    setSavingRecovery(true); setError("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryEmail: values.recoveryEmail || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentRecoveryEmail(values.recoveryEmail || null);
      appMessage.success("Recovery email saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally { setSavingRecovery(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><Spin /></div>;

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <Title level={3} className="!mb-1">Account Settings</Title>
        <Text className="text-slate-400">Manage your profile and security</Text>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable={{ onClose: () => setError("") }}
          className="mb-4"
        />
      )}

      {/* Profile */}
      <Card title="Profile" className="!rounded-xl !border-slate-100 mb-6">
        <Form layout="vertical" form={profileForm} onFinish={saveProfile}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }, { min: 2 }]}>
            <Input prefix={<UserOutlined />} size="large" />
          </Form.Item>
          <Form.Item name="email" label="Email Address">
            <Input prefix={<MailOutlined />} size="large" disabled />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" loading={savingProfile}>
            Save Profile
          </Button>
        </Form>
      </Card>

      {/* Password Recovery Email */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <SafetyOutlined className="text-blue-500" />
            Password Recovery Email
          </div>
        }
        extra={
          currentRecoveryEmail
            ? <Tag color="green">Set</Tag>
            : <Tag color="orange">Not set</Tag>
        }
        className="!rounded-xl !border-slate-100 mb-6"
      >
        <Text className="text-slate-500 text-sm block mb-4">
          OTPs for password reset will be sent to this address. If not set, your account email is used.
          {" "}<strong>Required if your account email cannot receive emails</strong> (e.g. admin@digiplatform.com).
        </Text>
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
              Save Recovery Email
            </Button>
            {currentRecoveryEmail && (
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
      <Card title="Change Password" className="!rounded-xl !border-slate-100">
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
    </div>
  );
}
