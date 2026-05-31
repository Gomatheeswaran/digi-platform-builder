"use client";
import { useState } from "react";
import { Form, Input, Button, Typography, Steps, Alert, App } from "antd";
import { MailOutlined, LockOutlined, UserOutlined, SafetyOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;
type Step = "email" | "otp" | "details";

export default function RegisterPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form] = Form.useForm();

  const currentStep = step === "email" ? 0 : step === "otp" ? 1 : 2;

  async function handleSendOtp(values: { email: string }) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, type: "register" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmail(values.email);
      setStep("otp");
      message.success("OTP sent to your Gmail!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP.");
    } finally { setLoading(false); }
  }

  async function handleRegister(values: { otp: string; name: string; password: string }) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: values.otp, name: values.name, password: values.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      message.success("Account created! Redirecting...");
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed.");
    } finally { setLoading(false); }
  }

  async function resendOtp() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "register" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      message.success("OTP resent!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resend.");
    } finally { setLoading(false); }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 border border-slate-100">
        <div className="text-center mb-6 sm:mb-8">
          <Title level={2} className="!mb-1 !text-slate-800 !text-2xl sm:!text-3xl">
            Create account
          </Title>
          <Text className="text-slate-400 text-sm">Gmail accounts only — verified with OTP</Text>
        </div>

        <Steps
          current={currentStep}
          size="small"
          className="mb-6 sm:mb-8"
          items={[{ title: "Gmail" }, { title: "Verify OTP" }, { title: "Details" }]}
        />

        {error && (
          <Alert
            type="error" showIcon
            description={error}
            closable={{ onClose: () => setError("") }}
            className="mb-4"
          />
        )}

        {step === "email" && (
          <Form layout="vertical" onFinish={handleSendOtp}>
            <Form.Item
              name="email" label="Gmail Address"
              rules={[
                { required: true, message: "Email is required" },
                { pattern: /^[a-zA-Z0-9._%+-]+@gmail\.com$/, message: "Must be a @gmail.com address" },
              ]}
            >
              <Input prefix={<MailOutlined className="text-slate-400" />} placeholder="yourname@gmail.com" size="large" autoComplete="email" />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} className="mt-2">
              Send OTP to Gmail
            </Button>
          </Form>
        )}

        {(step === "otp" || step === "details") && (
          <Form layout="vertical" form={form} onFinish={handleRegister}>
            <Alert
              type="info" showIcon
              description={`OTP sent to ${email}`}
              className="mb-4"
              action={<Button size="small" type="link" onClick={resendOtp} loading={loading}>Resend</Button>}
            />
            <Form.Item
              name="otp" label="6-digit OTP"
              rules={[
                { required: true, message: "OTP is required" },
                { len: 6, message: "OTP must be 6 digits" },
                { pattern: /^\d{6}$/, message: "Digits only" },
              ]}
            >
              <Input prefix={<SafetyOutlined className="text-slate-400" />} placeholder="123456" size="large" maxLength={6} />
            </Form.Item>
            <Form.Item name="name" label="Full Name" rules={[{ required: true, message: "Name is required" }]}>
              <Input prefix={<UserOutlined className="text-slate-400" />} placeholder="Your full name" size="large" />
            </Form.Item>
            <Form.Item
              name="password" label="Password"
              rules={[{ required: true }, { min: 8, message: "Minimum 8 characters" }]}
            >
              <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="Minimum 8 characters" size="large" />
            </Form.Item>
            <Form.Item
              name="confirmPassword" label="Confirm Password"
              dependencies={["password"]}
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) return Promise.resolve();
                    return Promise.reject(new Error("Passwords do not match."));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="Repeat your password" size="large" />
            </Form.Item>
            <div className="flex gap-3 mt-2">
              <Button size="large" className="flex-1" onClick={() => { setStep("email"); setError(""); }}>Back</Button>
              <Button type="primary" htmlType="submit" size="large" style={{ flex: 2 }} loading={loading}>Create Account</Button>
            </div>
          </Form>
        )}

        <div className="text-center mt-5 text-slate-500 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 font-medium">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
