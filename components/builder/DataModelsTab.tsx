"use client";
import React from "react";
import {
  Typography, Button, Card, Form, Input, Select, Switch,
  Collapse, Tag, Popconfirm,
} from "antd";
import {
  PlusOutlined, DeleteOutlined, PlusCircleOutlined, HolderOutlined,
} from "@ant-design/icons";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DataModelConfig, FieldConfig, FieldType } from "@/types";
import { v4 as uuidv4 } from "uuid";

const { Title, Text } = Typography;

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency (₹)" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "Date & Time" },
  { value: "boolean", label: "Yes/No (Toggle)" },
  { value: "select", label: "Dropdown (Single)" },
  { value: "multiselect", label: "Dropdown (Multi)" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "url", label: "URL" },
  { value: "image", label: "Image Upload" },
  { value: "file", label: "File Upload" },
  { value: "formula", label: "Formula (Calculated)" },
];

interface Props {
  models: DataModelConfig[];
  onChange: (models: DataModelConfig[]) => void;
}

function SortableFieldItem({
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

function FieldEditor({
  field,
  onChange,
  onDelete,
  dragHandle,
}: {
  field: FieldConfig;
  onChange: (f: FieldConfig) => void;
  onDelete: () => void;
  dragHandle?: React.ReactNode;
}) {
  return (
    <Card
      size="small"
      className="!border-slate-200 !mb-2"
      extra={
        <Popconfirm title="Delete this field?" onConfirm={onDelete} okButtonProps={{ danger: true }}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      }
      title={
        <div className="flex items-center gap-2">
          {dragHandle}
          <Text className="text-xs font-mono text-slate-500">{field.slug}</Text>
          <Tag className="text-xs">{field.type}</Tag>
          {field.required && <Tag color="red" className="text-xs">Required</Tag>}
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Form.Item label="Field Name" className="!mb-1">
          <Input
            size="small"
            value={field.name}
            onChange={(e) => {
              const name = e.target.value;
              const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
              onChange({ ...field, name, slug });
            }}
          />
        </Form.Item>
        <Form.Item label="Field Type" className="!mb-1">
          <Select
            size="small"
            value={field.type}
            onChange={(v) => onChange({ ...field, type: v as FieldType })}
            options={FIELD_TYPES}
          />
        </Form.Item>
        {(field.type === "select" || field.type === "multiselect") && (
          <Form.Item label="Options (comma-separated)" className="!mb-1 sm:col-span-2">
            <Input
              size="small"
              value={field.options?.join(", ") || ""}
              onChange={(e) =>
                onChange({ ...field, options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
              }
              placeholder="Option A, Option B, Option C"
            />
          </Form.Item>
        )}
        {field.type === "formula" && (
          <Form.Item label="Formula" className="!mb-1 sm:col-span-2" help="Use field slugs. E.g: price * quantity">
            <Input
              size="small"
              value={field.formula || ""}
              onChange={(e) => onChange({ ...field, formula: e.target.value })}
              placeholder="price * quantity"
              className="font-mono"
            />
          </Form.Item>
        )}
        <Form.Item label="Required" className="!mb-1">
          <Switch
            size="small"
            checked={field.required}
            onChange={(v) => onChange({ ...field, required: v })}
          />
        </Form.Item>
        <Form.Item label="Default Value" className="!mb-1">
          <Input
            size="small"
            value={String(field.defaultValue ?? "")}
            onChange={(e) => onChange({ ...field, defaultValue: e.target.value })}
            placeholder="(optional)"
          />
        </Form.Item>
      </div>
    </Card>
  );
}

function ModelEditor({
  model,
  onChange,
}: {
  model: DataModelConfig;
  onChange: (m: DataModelConfig) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function addField() {
    onChange({
      ...model,
      fields: [
        ...model.fields,
        { id: uuidv4(), name: "New Field", slug: "new_field", type: "text", required: false },
      ],
    });
  }

  function updateField(idx: number, f: FieldConfig) {
    const fields = [...model.fields];
    fields[idx] = f;
    onChange({ ...model, fields });
  }

  function deleteField(idx: number) {
    onChange({ ...model, fields: model.fields.filter((_, i) => i !== idx) });
  }

  function handleFieldDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = model.fields.findIndex((f) => f.id === active.id);
      const newIdx = model.fields.findIndex((f) => f.id === over.id);
      onChange({ ...model, fields: arrayMove(model.fields, oldIdx, newIdx) });
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Form.Item label="Model Name" className="!mb-0">
          <Input
            value={model.name}
            onChange={(e) => {
              const name = e.target.value;
              const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
              onChange({ ...model, name, slug });
            }}
            placeholder="e.g. Products"
          />
        </Form.Item>
        <div className="flex gap-2 items-end">
          <Form.Item label="Allow" className="!mb-0 flex-1">
            <div className="flex gap-3 text-xs">
              {(["Create", "Edit", "Delete"] as const).map((action) => {
                const key = `allow${action}` as keyof DataModelConfig;
                return (
                  <label key={action} className="flex items-center gap-1 cursor-pointer">
                    <Switch
                      size="small"
                      checked={model[key] as boolean}
                      onChange={(v) => onChange({ ...model, [key]: v })}
                    />
                    {action}
                  </label>
                );
              })}
            </div>
          </Form.Item>
        </div>
      </div>

      <div className="mb-2">
        <Text className="text-xs text-slate-500 uppercase tracking-wide">Fields ({model.fields.length})</Text>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFieldDragEnd}>
        <SortableContext items={model.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {model.fields.map((field, idx) => (
            <SortableFieldItem key={field.id} id={field.id}>
              {(handle) => (
                <FieldEditor
                  field={field}
                  onChange={(f) => updateField(idx, f)}
                  onDelete={() => deleteField(idx)}
                  dragHandle={handle}
                />
              )}
            </SortableFieldItem>
          ))}
        </SortableContext>
      </DndContext>

      <Button
        type="dashed"
        size="small"
        icon={<PlusCircleOutlined />}
        onClick={addField}
        block
        className="mt-2"
      >
        Add Field
      </Button>
    </div>
  );
}

export default function DataModelsTab({ models, onChange }: Props) {
  function addModel() {
    onChange([
      ...models,
      {
        id: uuidv4(),
        name: "New Model",
        slug: "new_model",
        fields: [
          { id: uuidv4(), name: "Name", slug: "name", type: "text", required: true },
        ],
        allowCreate: true,
        allowEdit: true,
        allowDelete: true,
      },
    ]);
  }

  function updateModel(idx: number, m: DataModelConfig) {
    const updated = [...models];
    updated[idx] = m;
    onChange(updated);
  }

  function deleteModel(idx: number) {
    onChange(models.filter((_, i) => i !== idx));
  }

  const items = models.map((model, idx) => ({
    key: model.id,
    label: (
      <div className="flex items-center justify-between w-full">
        <span className="font-medium">{model.name}</span>
        <div className="flex items-center gap-2">
          <Tag className="text-xs">{model.fields.length} fields</Tag>
          <Popconfirm
            title="Delete this data model?"
            onConfirm={(e) => { e?.stopPropagation(); deleteModel(idx); }}
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
        </div>
      </div>
    ),
    children: (
      <ModelEditor
        model={model}
        onChange={(m) => updateModel(idx, m)}
      />
    ),
  }));

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <Title level={5} className="!mb-0">Data Models</Title>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addModel}>
          Add Model
        </Button>
      </div>

      {models.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-3">🗄️</div>
          <div>No data models yet.</div>
          <div className="text-sm mb-4">Add models to store and manage your app&apos;s data.</div>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addModel}>Add First Model</Button>
        </div>
      ) : (
        <Collapse items={items} accordion className="!border-slate-200" />
      )}
    </div>
  );
}
