"use client";
import React from "react";
import {
  Typography, Button, Card, Form, Input, Switch,
  Collapse, Tag, Popconfirm, Empty, Tooltip,
} from "antd";
import { PlusOutlined, DeleteOutlined, HomeOutlined, HolderOutlined } from "@ant-design/icons";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

function SortableComponentItem({
  id,
  children,
}: {
  id: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: "relative",
        zIndex: isDragging ? 1 : undefined,
      }}
    >
      {children(
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-slate-300 hover:text-slate-500 pr-1"
        >
          <HolderOutlined />
        </span>
      )}
    </div>
  );
}

interface Props {
  pages: PageConfig[];
  onChange: (pages: PageConfig[]) => void;
  template: string;
}

function ComponentEditor({
  component,
  onChange,
  onDelete,
  dragHandle,
}: {
  component: ComponentConfig;
  onChange: (c: ComponentConfig) => void;
  onDelete: () => void;
  dragHandle?: React.ReactNode;
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
          {dragHandle}
          <span>{typeDef?.icon}</span>
          <Text className="text-sm">{typeDef?.label || component.type}</Text>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {component.type === "hero" && (
          <>
            <Form.Item label="Heading" className="!mb-1 sm:col-span-2">
              <Input size="small" value={component.props.heading as string || ""} onChange={(e) => onChange({ ...component, props: { ...component.props, heading: e.target.value } })} />
            </Form.Item>
            <Form.Item label="Subtext" className="!mb-1 sm:col-span-2">
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
            <Form.Item label="Title" className="!mb-1 sm:col-span-2">
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
          <Form.Item label="Content" className="!mb-1 sm:col-span-2">
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
          <Form.Item label="Image URL" className="!mb-1 sm:col-span-2">
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
  template,
}: {
  page: PageConfig;
  onChange: (p: PageConfig) => void;
  template: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

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

  function handleComponentDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = page.components.findIndex((c) => c.id === active.id);
      const newIdx = page.components.findIndex((c) => c.id === over.id);
      onChange({ ...page, components: arrayMove(page.components, oldIdx, newIdx) });
    }
  }

  const availableComponents = COMPONENT_TYPES.filter(
    (t) => !t.templates || t.templates.includes(template) || template === "blank"
  );

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Form.Item label="Page Name" className="!mb-0">
          <Input value={page.name} onChange={(e) => onChange({ ...page, name: e.target.value })} />
        </Form.Item>
        <Form.Item label="URL Slug" className="!mb-0">
          <Input
            value={page.slug}
            onChange={(e) => onChange({ ...page, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
            prefix="/"
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleComponentDragEnd}>
          <SortableContext items={page.components.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {page.components.map((comp, idx) => (
              <SortableComponentItem key={comp.id} id={comp.id}>
                {(handle) => (
                  <ComponentEditor
                    component={comp}
                    onChange={(c) => updateComponent(idx, c)}
                    onDelete={() => deleteComponent(idx)}
                    dragHandle={handle}
                  />
                )}
              </SortableComponentItem>
            ))}
          </SortableContext>
        </DndContext>
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

function SortablePagePanel({
  page,
  onUpdate,
  onDelete,
  onSetHome,
  template,
}: {
  page: PageConfig;
  onUpdate: (p: PageConfig) => void;
  onDelete: () => void;
  onSetHome: () => void;
  template: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: "relative",
        zIndex: isDragging ? 10 : undefined,
      }}
      className="mb-1"
    >
      <Collapse
        className="!border-slate-200"
        items={[{
          key: page.id,
          label: (
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-2 font-medium">
                <span
                  {...attributes}
                  {...listeners}
                  className="cursor-grab text-slate-300 hover:text-slate-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  <HolderOutlined />
                </span>
                {page.isHome && <HomeOutlined className="text-blue-500" />}
                {page.name}
                <span className="text-xs text-slate-400 font-normal">/{page.slug || ""}</span>
              </span>
              <div className="flex items-center gap-2">
                <Tag className="text-xs">{page.components.length} components</Tag>
                {!page.isHome && (
                  <>
                    <Tooltip title="Set as landing page">
                      <Button
                        type="text"
                        size="small"
                        icon={<HomeOutlined />}
                        onClick={(e) => { e.stopPropagation(); onSetHome(); }}
                        className="text-slate-400 hover:text-blue-500"
                      />
                    </Tooltip>
                    <Popconfirm
                      title="Delete this page?"
                      onConfirm={(e) => { e?.stopPropagation(); onDelete(); }}
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
                  </>
                )}
              </div>
            </div>
          ),
          children: (
            <PageEditor
              page={page}
              onChange={onUpdate}
              template={template}
            />
          ),
        }]}
      />
    </div>
  );
}

export default function PagesTab({ pages, onChange, template }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

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

  function setHomePage(idx: number) {
    onChange(
      pages.map((p, i) => ({
        ...p,
        isHome: i === idx,
        slug: i === idx ? "" : (p.isHome ? `page-${i + 1}` : p.slug),
      }))
    );
  }

  function handlePageDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = pages.findIndex((p) => p.id === active.id);
      const newIdx = pages.findIndex((p) => p.id === over.id);
      onChange(arrayMove(pages, oldIdx, newIdx));
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <Title level={5} className="!mb-0">Pages</Title>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addPage}>
          Add Page
        </Button>
      </div>

      {pages.length === 0 ? (
        <Empty description="No pages yet." />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePageDragEnd}>
          <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            {pages.map((page, idx) => (
              <SortablePagePanel
                key={page.id}
                page={page}
                onUpdate={(p) => updatePage(idx, p)}
                onDelete={() => deletePage(idx)}
                onSetHome={() => setHomePage(idx)}
                template={template}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
