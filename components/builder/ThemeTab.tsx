"use client";
import { Form, Input, Select, Switch, ColorPicker, Typography } from "antd";
import type { AppTheme } from "@/types";
import type { Color } from "antd/es/color-picker";

const { Title } = Typography;

interface Props {
  theme: AppTheme;
  onChange: (theme: AppTheme) => void;
}

const FONT_OPTIONS = [
  "Inter, sans-serif",
  "Roboto, sans-serif",
  "Open Sans, sans-serif",
  "Poppins, sans-serif",
  "Montserrat, sans-serif",
  "Lato, sans-serif",
  "Georgia, serif",
  "Merriweather, serif",
].map((f) => ({ value: f, label: f.split(",")[0] }));

const RADIUS_OPTIONS = [
  { value: "none", label: "None (0px)" },
  { value: "small", label: "Small (4px)" },
  { value: "medium", label: "Medium (8px)" },
  { value: "large", label: "Large (16px)" },
  { value: "full", label: "Full (rounded)" },
];

const HEADER_STYLE_OPTIONS = [
  { value: "static", label: "Static" },
  { value: "sticky", label: "Sticky (follows on scroll)" },
  { value: "fixed", label: "Fixed (always visible)" },
];

function colorToHex(color: string | Color): string {
  if (typeof color === "string") return color;
  return color.toHexString();
}

export default function ThemeTab({ theme, onChange }: Props) {
  function update(key: keyof AppTheme, value: unknown) {
    onChange({ ...theme, [key]: value });
  }

  return (
    <div className="p-4 sm:p-6 max-w-lg">
      <Title level={5} className="!mb-6">Theme & Branding</Title>

      <Form layout="vertical" component="div">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-2 mb-3 border-b pb-1">Colors</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Form.Item label="Primary Color" className="!mb-0">
            <div className="flex items-center gap-2">
              <ColorPicker
                value={theme.primaryColor}
                onChange={(c) => update("primaryColor", colorToHex(c))}
                showText
              />
            </div>
          </Form.Item>
          <Form.Item label="Secondary Color" className="!mb-0">
            <ColorPicker
              value={theme.secondaryColor}
              onChange={(c) => update("secondaryColor", colorToHex(c))}
              showText
            />
          </Form.Item>
          <Form.Item label="Background" className="!mb-0">
            <ColorPicker
              value={theme.backgroundColor}
              onChange={(c) => update("backgroundColor", colorToHex(c))}
              showText
            />
          </Form.Item>
          <Form.Item label="Text Color" className="!mb-0">
            <ColorPicker
              value={theme.textColor}
              onChange={(c) => update("textColor", colorToHex(c))}
              showText
            />
          </Form.Item>
        </div>

        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-4 mb-3 border-b pb-1">Typography &amp; Layout</div>

        <Form.Item label="Font Family">
          <Select
            value={theme.fontFamily}
            onChange={(v) => update("fontFamily", v)}
            options={FONT_OPTIONS}
          />
        </Form.Item>

        <Form.Item label="Border Radius">
          <Select
            value={theme.borderRadius}
            onChange={(v) => update("borderRadius", v)}
            options={RADIUS_OPTIONS}
          />
        </Form.Item>

        <Form.Item label="Header Style">
          <Select
            value={theme.headerStyle}
            onChange={(v) => update("headerStyle", v)}
            options={HEADER_STYLE_OPTIONS}
          />
        </Form.Item>

        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-4 mb-3 border-b pb-1">Branding</div>

        <Form.Item label="Logo URL" help="Direct URL to your logo image">
          <Input
            value={theme.logoUrl}
            onChange={(e) => update("logoUrl", e.target.value)}
            placeholder="https://example.com/logo.png"
          />
        </Form.Item>

        <Form.Item label="Favicon URL" help="16×16 or 32×32 .ico or .png">
          <Input
            value={theme.faviconUrl}
            onChange={(e) => update("faviconUrl", e.target.value)}
            placeholder="https://example.com/favicon.ico"
          />
        </Form.Item>

        <Form.Item label="Dark Mode">
          <Switch
            checked={theme.darkMode}
            onChange={(v) => update("darkMode", v)}
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </Form.Item>
      </Form>
    </div>
  );
}
