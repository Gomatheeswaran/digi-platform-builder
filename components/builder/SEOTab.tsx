"use client";
import { Form, Input, Typography } from "antd";
import type { AppSEO } from "@/types";

const { Title } = Typography;

interface Props {
  seo: AppSEO;
  onChange: (seo: AppSEO) => void;
}

export default function SEOTab({ seo, onChange }: Props) {
  function update(key: keyof AppSEO, value: string) {
    onChange({ ...seo, [key]: value });
  }

  return (
    <div className="p-4 sm:p-6 max-w-lg">
      <Title level={5} className="!mb-6">SEO & Meta Tags</Title>
      <Form layout="vertical" component="div">
        <Form.Item label="Page Title" help="Shown in browser tab and search results">
          <Input
            value={seo.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="My Awesome App"
            maxLength={70}
            showCount
          />
        </Form.Item>
        <Form.Item label="Meta Description" help="Shown in search engine results (150-160 characters recommended)">
          <Input.TextArea
            value={seo.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe what your app does..."
            rows={3}
            maxLength={160}
            showCount
          />
        </Form.Item>
        <Form.Item label="Keywords" help="Comma-separated keywords (less important for modern SEO)">
          <Input
            value={seo.keywords}
            onChange={(e) => update("keywords", e.target.value)}
            placeholder="shop, crackers, fireworks, buy online"
          />
        </Form.Item>
        <Form.Item label="OG Image URL" help="Image shown when sharing on WhatsApp, Facebook etc.">
          <Input
            value={seo.ogImage}
            onChange={(e) => update("ogImage", e.target.value)}
            placeholder="https://example.com/og-image.png"
          />
        </Form.Item>
      </Form>
    </div>
  );
}
