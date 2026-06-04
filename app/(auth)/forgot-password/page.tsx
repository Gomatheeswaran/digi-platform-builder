"use client";
import { useState } from "react";
import { Form, Input, Button, Typography, Alert, Steps } from "antd";
import { MailOutlined, LockOutlined, SafetyOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState("");

  // Step 1 — send OTP
  async function sendOtp(values: { email: string }) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmail(values.email.trim().toLowerCase());
      setMaskedEmail(data.maskedEmail || values.email);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP.");
    } finally { setLoading(false); }
  }

  // Step 2 — verify OTP (just move to next step; actual verify happens with reset)
  function confirmOtp(values: { otp: string }) {
    setOtp(values.otp.trim());
    setError("");
    setStep("password");
  }

  // Step 3 — reset password
  async function resetPassword(values: { newPassword: string }) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: values.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Bad OTP — take user back to OTP entry
        if (res.status === 400 && data.error?.toLowerCase().includes("otp")) {
          setStep("otp");
        }
        throw new Error(data.error);
      }
      setSuccess("Password reset successfully! Redirecting to login…");
      setTimeout(() => router.push("/login"), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed.");
    } finally { setLoading(false); }
  }

  const stepIndex = step === "email" ? 0 : step === "otp" ? 1 : 2;

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <LockOutlined className="text-blue-600 text-xl" />
          </div>
          <Title level={3} className="!mb-1">Reset Password</Title>
          <Text className="text-slate-400 text-sm">We&apos;ll send an OTP to your recovery email</Text>
        </div>

        <Steps
          current={stepIndex}
          size="small"
          className="mb-6"
          items={[
            { title: "Email" },
            { title: "OTP" },
            { title: "New Password" },
          ]}
        />

        {error && (
          <Alert
            type="error" showIcon description={error}
            closable={{ onClose: () => setError("") }}
            className="mb-4"
          />
        )}
        {success && (
          <Alert type="success" showIcon description={success} className="mb-4" />
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <Form layout="vertical" onFinish={sendOtp}>
            <Form.Item
              name="email"
              label="Account Email"
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-slate-400" />}
                placeholder="Your login email"
                size="large"
                autoComplete="email"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Send OTP
            </Button>
          </Form>
        )}

        {/* Step 2: OTP */}
        {step === "otp" && (
          <Form layout="vertical" onFinish={confirmOtp}>
            <p className="text-sm text-slate-500 mb-4">
              OTP sent to <strong>{maskedEmail}</strong>. Check your inbox.
            </p>
            <Form.Item
              name="otp"
              label="One-Time Password"
              rules={[
                { required: true, message: "OTP is required" },
                { len: 6, message: "OTP must be 6 digits" },
              ]}
            >
              <Input
                prefix={<SafetyOutlined className="text-slate-400" />}
                placeholder="6-digit OTP"
                size="large"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </Form.Item>
            <div className="flex gap-2">
              <Button size="large" onClick={() => setStep("email")} className="flex-1">
                Back
              </Button>
              <Button type="primary" htmlType="submit" size="large" className="flex-1">
                Verify OTP
              </Button>
            </div>
            <div className="text-center mt-3">
              <button
                type="button"
                className="text-sm text-blue-500 hover:text-blue-700"
                onClick={() => sendOtp({ email })}
              >
                Resend OTP
              </button>
            </div>
          </Form>
        )}

        {/* Step 3: New Password */}
        {step === "password" && (
          <Form layout="vertical" onFinish={resetPassword}>
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: "Password is required" },
                { min: 8, message: "At least 8 characters" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="Minimum 8 characters"
                size="large"
                autoComplete="new-password"
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
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
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="Repeat new password"
                size="large"
                autoComplete="new-password"
              />
            </Form.Item>
            <div className="flex gap-2">
              <Button size="large" onClick={() => setStep("otp")} className="flex-1">
                Back
              </Button>
              <Button type="primary" htmlType="submit" size="large" loading={loading} className="flex-1">
                Reset Password
              </Button>
            </div>
          </Form>
        )}

        <div className="text-center mt-5 text-sm text-slate-500">
          Remembered it?{" "}
          <Link href="/login" className="text-blue-600 font-medium">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
