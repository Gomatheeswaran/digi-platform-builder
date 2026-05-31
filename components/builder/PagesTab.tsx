"use client";
import {
  Typography, Button, Card, Form, Input, Select, Switch,
  Collapse, Tag, Space, Popconfirm, Empty,
} from "antd";
import { PlusOutlined, DeleteOutlined, HomeOutlined } from "@ant-design/icons";
import type { PageConfig, ComponentConfig, ComponentType } from "@/types";
import { v4 as uuidv4 } from "uuid";

const { Title, Text } = Typography;

const COMPONENT_TYPES: { value: ComponentType; label: string; icon: string; templates?: string[] }[] = [
  { value: "hero", label: "Hero Banner", icon: "🖼️" },
  { value: "product_grid", label: "Product Grid / List", icon: "📦", templates: ["ecommerce", "directory"] },
  { value: "text_block", label: "Text Block", icon: "📝" },
  { value: "image_banner", label: "Image Banner", icon: "🖼️" },
  { value: "form", label: "Form", icon: "📋", templates: ["form_collector", "blank"] },
  { value: "table", label: "Data Table", icon: "📊" },
  { value: "notepad", label: "Notepad", icon: "📓", templates: ["notepad", "blank"] },
  { value: "calculator", label: "Calculator", icon: "🧮", templates: ["calculator", "blank"] },
  { value: "calendar", label: "Calendar", icon: "📅", templates: ["notepad", "blank"] },
  { value: "gallery", label: "Image Gallery", icon: "🖼️" },
  { value: "contact_form", label: "Contact Form", icon: "✉️" },
  { value: "cart", label: "Shopping Cart", icon: "🛒", templates: ["ecommerce"] },
  { value: "checkout", label: "Checkout", icon: "💳", templates: ["ecommerce"] },
  { value: "footer", label: "Footer", icon: "⬇️" },
  { value: "divider", label: "Divider", icon: "—" },
];

interface Props {
  pages: PageConfig[];
  onChange: (pages: PageConfig[]) => void;
  template: string;
}

function ComponentEditor({
  component,
  onChange,
  onDelete,
}: {
  component: ComponentConfig;
  onChange: (c: ComponentConfig) => void;
  onDelete: () => void;
}) {
  const typeDef = COMPONENT_TYPES.find((t) => t.value === component.type);

  return (
    <Card
      size="small"
      className="!border-slate-200 !mb-2"
      extra={
        <Popconfirm title="Remove this component?" onConfirm={onDelete} okButtonProps={{ danger: true }}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      }
      title={
        <div className="flex items-center gap-2">
          <span>{typeDef?.icon}</span>
          <Text className="text-sm">{typeDef?.label || component.type}</Text>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {component.type === "hero" && (
          <>
            <Form.Item label="Heading" className="!mb-1 col-span-2">
              <Input size="small" value={component.props.heading as string || ""} onChange={(e) => onChange({ ...component, props: { ...component.props, heading: e.target.value } })} />
            </Form.Item>
            <Form.Item label="Subtext" className="!mb-1 col-span-2">
              <Input size="small" value={component.props.subtext as string || ""} onChange={(e) => onChange({ ...component, props: { ...component.props, subtext: e.target.value } })} />
            </Form.Item>
            <Form.Item label="CTA Button Text" className="!mb-1">
              <Input size="small" value={component.props.ctaText as string || ""} onChange={(e) => onChange({ ...component, props: { ...component.props, ctaText: e.target.value } })} />
            </Form.Item>
            <Form.Item label="CTA Button Link" className="!mb-1">
              <Input size="small" value={component.props.ctaHref as string || ""} onChange={(e) => onChange({ ...component, props: { ...component.props, ctaHref: e.target.value } })} />
            </Form.Item>
          </>
        )}
        {(component.type === "product_grid" || component.type === "table") && (
          <>
            <Form.Item label="Title" className="!mb-1 col-span-2">
              <Input size="small" value={component.props.title as string || ""} onChange={(e) => onChange({ ...component, props: { ...component.props, title: e.target.value } })} />
            </Form.Item>
            <Form.Item label="Data Source (model slug)" className="!mb-1">
              <Input size="small" value={component.dataSource || ""} onChange={(e) => onChange({ ...component, dataSource: e.target.value })} placeholder="products" />
            </Form.Item>
            {component.type === "product_grid" && (
              <Form.Item label="Show Filters" className="!mb-1">
                <Switch size="small" checked={component.props.showFilters as boolean || false} onChange={(v) => onChange({ ...component, props: { ...component.props, showFilters: v } })} />
              </Form.Item>
            )}
          </>
        )}
        {component.type === "text_block" && (
          <Form.Item label="Content" className="!mb-1 col-span-2">
            <Input.TextArea size="small" value={component.props.content as string || ""} rows={3} onChange={(e) => onChange({ ...component, props: { ...component.props, content: e.target.value } })} />
          </Form.Item>
        )}
        {component.type === "notepad" && (
          <>
            <Form.Item label="Title" className="!mb-1">
              <Input size="small" value={component.props.title as string || ""} onChange={(e) => onChange({ ...component, props: { ...component.props, title: e.target.value } })} />
            </Form.Item>
            <Form.Item label="Data Source" className="!mb-1">
              <Input size="small" value={component.dataSource || ""} onChange={(e) => onChange({ ...component, dataSource: e.target.value })} placeholder="notes" />
            </Form.Item>
          </>
        )}
        {component.type === "calculator" && (
          <>
            <Form.Item label="Title" className="!mb-1">
              <Input size="small" value={component.props.title as string || ""} onChange={(e) => onChange({ ...component, props: { ...component.props, title: e.target.value } })} />
            </Form.Item>
            <Form.Item label="Description" className="!mb-1">
              <Input size="small" value={component.props.description as string || ""} onChange={(e) => onChange({ ...component, props: { ...component.props, description: e.target.value } })} />
            </Form.Item>
            <Form.Item label="Data Source (model)" className="!mb-1">
              <Input size="small" value={component.dataSource || ""} onChange={(e) => onChange({ ...component, dataSource: e.target.value })} placeholder="calculations" />
            </Form.Item>
          </>
        )}
        {component.type === "form" && (
          <>
            <Form.Item label="Form Title" className="!mb-1">
              <Input size="small" value={component.props.title as string || ""} onChange={(e) => onChange({ ...component, props: { ...component.props, title: e.target.value } })} />
            </Form.Item>
            <Form.Item label="Data Source (model)" className="!mb-1">
              <Input size="small" value={component.dataSource || ""} onChange={(e) => onChange({ ...component, dataSource: e.target.value })} placeholder="responses" />
            </Form.Item>
            <Form.Item label="Submit Button Label" className="!mb-1">
              <Input size="small" value={component.props.submitLabel as string || "Submit"} onChange={(e) => onChange({ ...component, props: { ...component.props, submitLabel: e.target.value } })} />
            </Form.Item>
            <Form.Item label="Success Message" className="!mb-1">
              <Input size="small" value={component.props.successMessage as string || ""} onChange={(e) => onChange({ ...component, props: { ...component.props, successMessage: e.target.value } })} />
            </Form.Item>
          </>
        )}
        {(component.type === "image_banner" || component.type === "gallery") && (
          <Form.Item label="Image URL" className="!mb-1 col-span-2">
            <Input size="small" value={component.props.imageUrl as string || ""} onChange={(e) => onChange({ ...component, props: { ...component.props, imageUrl: e.target.value } })} placeholder="https://..." />
          </Form.Item>
        )}
      </div>
    </Card>
  );
}

function PageEditor({
  page,
  onChange,
  onDelete,
  template,
}: {
  page: PageConfig;
  onChange: (p: PageConfig) => void;
  onDelete: () => void;
  template: string;
}) {
  function addComponent(type: ComponentType) {
    onChange({
      ...page,
      components: [
        ...page.components,
        { id: uuidv4(), type, props: {}, order: page.components.length },
      ],
    });
  }

  function updateComponent(idx: number, c: ComponentConfig) {
    const components = [...page.components];
    components[idx] = c;
    onChange({ ...page, components });
  }

  function deleteComponent(idx: number) {
    onChange({ ...page, components: page.components.filter((_, i) => i !== idx) });
  }

  const availableComponents = COMPONENT_TYPES.filter(
    (t) => !t.templates || t.templates.includes(template) || template === "blank"
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Form.Item label="Page Name" className="!mb-0">
          <Input value={page.name} onChange={(e) => onChange({ ...page, name: e.target.value })} />
        </Form.Item>
        <Form.Item label="URL Slug" className="!mb-0">
          <Input
            value={page.slug}
            onChange={(e) => onChange({ ...page, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
            addonBefore="/"
            disabled={page.isHome}
          />
        </Form.Item>
      </div>

      <div className="mb-3">
        <Text className="text-xs text-slate-500 uppercase tracking-wide block mb-2">
          Components ({page.components.length})
        </Text>
        {page.components.length === 0 && (
          <div className="text-center py-4 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg mb-2">
            No components. Add one below.
          </div>
        )}
        {page.components.map((comp, idx) => (
          <ComponentEditor
            key={comp.id}
            component={comp}
            onChange={(c) => updateComponent(idx, c)}
            onDelete={() => deleteComponent(idx)}
          />
        ))}
      </div>

      <div>
        <Text className="text-xs text-slate-500 block mb-2">Add Component:</Text>
        <div className="flex flex-wrap gap-1">
          {availableComponents.map((t) => (
            <Button
              key={t.value}
              size="small"
              onClick={() => addComponent(t.value)}
              className="text-xs"
            >
              {t.icon} {t.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PagesTab({ pages, onChange, template }: Props) {
  function addPage() {
    onChange([
      ...pages,
      {
        id: uuidv4(),
        name: "New Page",
        slug: `page-${pages.length + 1}`,
        isHome: false,
        components: [],
      },
    ]);
  }

  function updatePage(idx: number, p: PageConfig) {
    const updated = [...pages];
    updated[idx] = p;
    onChange(updated);
  }

  function deletePage(idx: number) {
    onChange(pages.filter((_, i) => i !== idx));
  }

  const items = pages.map((page, idx) => ({
    key: page.id,
    label: (
      <div className="flex items-center justify-between w-full">
        <span className="flex items-center gap-2 font-medium">
          {page.isHome && <HomeOutlined className="text-blue-500" />}
          {page.name}
          <span className="text-xs text-slate-400 font-normal">/{page.slug || ""}</span>
        </span>
        <div className="flex items-center gap-2">
          <Tag className="text-xs">{page.components.length} components</Tag>
          {!page.isHome && (
            <Popconfirm
              title="Delete this page?"
              onConfirm={(e) => { e?.stopPropagation(); deletePage(idx); }}
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          )}
        </div>
      </div>
    ),
    children: (
      <PageEditor
        page={page}
        onChange={(p) => updatePage(idx, p)}
        onDelete={() => deletePage(idx)}
        template={template}
      />
    ),
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Title level={5} className="!mb-0">Pages</Title>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addPage}>
          Add Page
        </Button>
      </div>

      <Collapse items={items} accordion className="!border-slate-200" />
    </div>
  );
}
