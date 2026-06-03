"use client";
import {
  Form, Input, Button, Switch, Typography, Card,
  Divider,
} from "antd";
import { PlusOutlined, DeleteOutlined, HolderOutlined } from "@ant-design/icons";
import type { NavigationConfig, NavItem } from "@/types";
import { v4 as uuidv4 } from "uuid";

const { Title } = Typography;

interface Props {
  nav: NavigationConfig;
  onChange: (nav: NavigationConfig) => void;
}

export default function NavigationTab({ nav, onChange }: Props) {
  function updateItems(items: NavItem[]) {
    onChange({ ...nav, items });
  }

  function addItem() {
    updateItems([
      ...nav.items,
      { id: uuidv4(), label: "New Link", href: "/" },
    ]);
  }

  function updateItem(id: string, key: keyof NavItem, value: string) {
    updateItems(nav.items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function removeItem(id: string) {
    updateItems(nav.items.filter((item) => item.id !== id));
  }

  return (
    <div className="p-4 sm:p-6 max-w-lg">
      <Title level={5} className="!mb-6">Navigation</Title>

      <Form layout="vertical" component="div">
        <Form.Item label="Navigation Links">
          <div className="space-y-2 mb-3">
            {nav.items.map((item) => (
              <Card key={item.id} size="small" className="!border-slate-200">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <HolderOutlined className="text-slate-400 cursor-move flex-shrink-0" />
                    <Input
                      value={item.label}
                      onChange={(e) => updateItem(item.id, "label", e.target.value)}
                      placeholder="Label"
                      className="flex-1"
                      size="small"
                    />
                  </div>
                  <div className="flex items-center gap-2 pl-5">
                    <Input
                      value={item.href}
                      onChange={(e) => updateItem(item.id, "href", e.target.value)}
                      placeholder="path"
                      className="flex-1"
                      size="small"
                      prefix="/"
                    />
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeItem(item.id)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addItem}
            block
          >
            Add Nav Link
          </Button>
        </Form.Item>

        <Divider />

        <Form.Item label="Show Login / Register buttons">
          <Switch
            checked={nav.showAuthButtons}
            onChange={(v) => onChange({ ...nav, showAuthButtons: v })}
            checkedChildren="Show"
            unCheckedChildren="Hide"
          />
        </Form.Item>

        <Form.Item label="Show Cart icon in header">
          <Switch
            checked={nav.cartEnabled}
            onChange={(v) => onChange({ ...nav, cartEnabled: v })}
            checkedChildren="Enabled"
            unCheckedChildren="Disabled"
          />
        </Form.Item>
      </Form>
    </div>
  );
}
