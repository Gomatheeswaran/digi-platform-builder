"use client";
import { Form, Input, Switch, Typography, Card } from "antd";
import type { IntegrationsConfig } from "@/types";

const { Title, Text } = Typography;

interface Props {
  integrations: IntegrationsConfig;
  onChange: (integrations: IntegrationsConfig) => void;
}

export default function IntegrationsTab({ integrations, onChange }: Props) {
  const rzp = integrations.razorpay || { enabled: false, keyId: "", keySecret: "" };
  const wa = integrations.whatsapp || { enabled: false, phone: "" };
  const ga = integrations.googleAnalytics || { enabled: false, measurementId: "" };

  return (
    <div className="p-4 sm:p-6 max-w-lg">
      <Title level={5} className="!mb-6">Integrations</Title>

      {/* Razorpay */}
      <Card
        title={<div className="flex items-center gap-2"><span>💳</span><span>Razorpay Payments</span></div>}
        extra={
          <Switch
            checked={rzp.enabled}
            onChange={(v) => onChange({ ...integrations, razorpay: { ...rzp, enabled: v } })}
          />
        }
        className="!border-slate-200 mb-4"
      >
        {rzp.enabled && (
          <Form layout="vertical" component="div">
            <Form.Item label="Razorpay Key ID" help="Found in your Razorpay Dashboard > Settings > API Keys">
              <Input
                value={rzp.keyId}
                onChange={(e) => onChange({ ...integrations, razorpay: { ...rzp, keyId: e.target.value } })}
                placeholder="rzp_live_xxxxxxxx"
              />
            </Form.Item>
            <Form.Item label="Razorpay Key Secret">
              <Input.Password
                value={rzp.keySecret}
                onChange={(e) => onChange({ ...integrations, razorpay: { ...rzp, keySecret: e.target.value } })}
                placeholder="xxxxxxxxxxxxxxxx"
              />
            </Form.Item>
          </Form>
        )}
        {!rzp.enabled && (
          <Text className="text-slate-400 text-sm">Enable to accept online payments via Razorpay.</Text>
        )}
      </Card>

      {/* WhatsApp */}
      <Card
        title={<div className="flex items-center gap-2"><span>📱</span><span>WhatsApp Contact</span></div>}
        extra={
          <Switch
            checked={wa.enabled}
            onChange={(v) => onChange({ ...integrations, whatsapp: { ...wa, enabled: v } })}
          />
        }
        className="!border-slate-200 mb-4"
      >
        {wa.enabled && (
          <Form.Item label="WhatsApp Phone Number" help="Include country code, e.g. +91 98765 43210">
            <Input
              value={wa.phone}
              onChange={(e) => onChange({ ...integrations, whatsapp: { ...wa, phone: e.target.value } })}
              placeholder="+919876543210"
            />
          </Form.Item>
        )}
        {!wa.enabled && (
          <Text className="text-slate-400 text-sm">Add a WhatsApp chat button to your app.</Text>
        )}
      </Card>

      {/* Google Analytics */}
      <Card
        title={<div className="flex items-center gap-2"><span>📊</span><span>Google Analytics</span></div>}
        extra={
          <Switch
            checked={ga.enabled}
            onChange={(v) => onChange({ ...integrations, googleAnalytics: { ...ga, enabled: v } })}
          />
        }
        className="!border-slate-200"
      >
        {ga.enabled && (
          <Form.Item label="Measurement ID" help="Found in Google Analytics > Admin > Data Streams">
            <Input
              value={ga.measurementId}
              onChange={(e) => onChange({ ...integrations, googleAnalytics: { ...ga, measurementId: e.target.value } })}
              placeholder="G-XXXXXXXXXX"
            />
          </Form.Item>
        )}
        {!ga.enabled && (
          <Text className="text-slate-400 text-sm">Track visitors and page views with Google Analytics.</Text>
        )}
      </Card>
    </div>
  );
}
