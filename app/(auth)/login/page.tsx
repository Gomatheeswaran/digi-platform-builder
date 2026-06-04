"use client";
import { useState, Suspense } from "react";
import { Form, Input, Button, Typography, Alert, Divider } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const { Title, Text } = Typography;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(values: { email: string; password: string }) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(redirect);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
    } finally { setLoading(false); }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 border border-slate-100">
        <div className="text-center mb-6 sm:mb-8">
          <Title level={2} className="!mb-1 !text-slate-800 !text-2xl sm:!text-3xl">
            Welcome back
          </Title>
          <Text className="text-slate-400 text-sm">Sign in to your account</Text>
        </div>

        {error && (
          <Alert
            type="error" showIcon
            description={error}
            closable={{ onClose: () => setError("") }}
            className="mb-4"
          />
        )}

        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email address" },
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-slate-400" />}
              placeholder="you@example.com"
              size="large"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={
              <div className="flex justify-between w-full">
                <span>Password</span>
                <Link href="/forgot-password" className="text-blue-500 text-xs font-normal">
                  Forgot password?
                </Link>
              </div>
            }
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-slate-400" />}
              placeholder="Your password"
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" size="large" block loading={loading} className="mt-2">
            Sign In
          </Button>
        </Form>

        <Divider className="my-5 sm:my-6" />

        <div className="text-center text-slate-500 text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-600 font-medium">Create one free</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
