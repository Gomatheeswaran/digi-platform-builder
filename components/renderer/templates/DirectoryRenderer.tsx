"use client";
import { useEffect, useState } from "react";
import { Card, Row, Col, Input, Select, Typography, Empty, Spin, Tag } from "antd";
import { SearchOutlined, MailOutlined, PhoneOutlined, GlobalOutlined, EnvironmentOutlined } from "@ant-design/icons";
import type { AppConfig, AppTemplate, FieldConfig } from "@/types";
import AppHeader from "../AppHeader";
import AppFooter from "../AppFooter";

const { Title, Text } = Typography;

type ListingRecord = Record<string, unknown>;

interface Props {
  app: { id: string; name: string; template: AppTemplate; config: AppConfig };
  pathname: string;
  config: AppConfig;
}

// Render a field value inline with an optional icon
function FieldValue({ field, value }: { field: FieldConfig; value: unknown }) {
  if (value === null || value === undefined || value === "") return null;
  const str = String(value);

  const iconMap: Record<string, React.ReactNode> = {
    phone: <PhoneOutlined className="text-slate-400" />,
    email: <MailOutlined className="text-slate-400" />,
    website: <GlobalOutlined className="text-slate-400" />,
    url: <GlobalOutlined className="text-slate-400" />,
    address: <EnvironmentOutlined className="text-slate-400" />,
  };
  const icon = iconMap[field.slug] || iconMap[field.type] || null;

  switch (field.type) {
    case "phone":
      return (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {icon}<a href={`tel:${str}`}>{str}</a>
        </div>
      );
    case "email":
      return (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {icon}<a href={`mailto:${str}`}>{str}</a>
        </div>
      );
    case "url":
      return (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {icon}<a href={str} target="_blank" rel="noreferrer">Visit Website</a>
        </div>
      );
    case "boolean":
      return value ? <Tag color="green">{field.name}</Tag> : null;
    case "select":
    case "multiselect":
      return (
        <div className="flex gap-1 flex-wrap">
          {Array.isArray(value)
            ? value.map((v: string) => <Tag key={v}>{v}</Tag>)
            : <Tag>{str}</Tag>}
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {icon}<span>{str}</span>
        </div>
      );
  }
}

export default function DirectoryRenderer({ app, pathname, config }: Props) {
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");

  const listingsModel = config.dataModels.find((m) => m.slug === "listings") ?? config.dataModels[0];
  const modelSlug = listingsModel?.slug ?? "listings";
  const fields = listingsModel?.fields || [];

  // Identify structural fields by slug/type for smart card layout
  const nameField = fields.find((f) => f.slug === "name") ?? fields.find((f) => f.type === "text") ?? fields[0];
  const categoryField = fields.find((f) => f.slug === "category" && (f.type === "select" || f.type === "multiselect"));
  const descField = fields.find((f) => f.slug === "description" || f.type === "textarea");
  const imageField = fields.find((f) => f.type === "image" || f.slug === "image");
  const categoryOptions = categoryField?.options || [];

  // All remaining fields shown as detail rows
  const detailFields = fields.filter(
    (f) => f !== nameField && f !== categoryField && f !== descField && f !== imageField
  );

  useEffect(() => {
    fetch(`/api/apps/${app.id}/data?model=${modelSlug}&limit=200`)
      .then((r) => r.json())
      .then((data) => setListings(data.records || []))
      .finally(() => setLoading(false));
  }, [app.id]);

  const textFields = fields.filter((f) => f.type === "text" || f.type === "textarea");

  const filtered = listings.filter((l) => {
    const matchSearch =
      !search ||
      textFields.some((f) => String(l[f.slug] || "").toLowerCase().includes(search.toLowerCase()));
    const matchCategory =
      !categoryField || !category || l[categoryField.slug] === category;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      <AppHeader config={config} appName={app.name} pathname={pathname} />

      <main>
        <section
          className="py-16 px-6 text-center"
          style={{
            background: `linear-gradient(135deg, ${config.theme.primaryColor}15 0%, ${config.theme.secondaryColor}10 100%)`,
          }}
        >
          <Title level={2} style={{ color: config.theme.textColor }}>{app.name}</Title>
          <div className="max-w-lg mx-auto mt-6 flex gap-3">
            <Input
              size="large"
              placeholder="Search listings..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              className="flex-1"
            />
            {categoryOptions.length > 0 && (
              <Select
                size="large"
                placeholder="Category"
                value={category || undefined}
                onChange={setCategory}
                allowClear
                style={{ minWidth: 140 }}
                options={categoryOptions.map((c) => ({ value: c, label: c }))}
              />
            )}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center py-12"><Spin /></div>
          ) : filtered.length === 0 ? (
            <Empty description="No listings found" />
          ) : (
            <Row gutter={[16, 16]}>
              {filtered.map((listing) => (
                <Col xs={24} md={12} lg={8} key={listing._id as string}>
                  <Card hoverable className="!rounded-xl !border-slate-100 hover:!border-blue-200 h-full">
                    {/* Cover image */}
                    {imageField && Boolean(listing[imageField.slug]) && (
                      <img
                        src={listing[imageField.slug] as string}
                        alt={nameField ? String(listing[nameField.slug] ?? "") : ""}
                        className="w-full h-40 object-cover rounded-t-xl -mt-6 -mx-6 mb-4"
                        style={{ width: "calc(100% + 48px)" }}
                      />
                    )}

                    {/* Name */}
                    {nameField && (
                      <div className="font-semibold text-slate-800 text-lg mb-1">
                        {String(listing[nameField.slug] ?? "")}
                      </div>
                    )}

                    {/* Category badge */}
                    {categoryField && Boolean(listing[categoryField.slug]) && (
                      <Tag className="mb-2">{String(listing[categoryField.slug])}</Tag>
                    )}

                    {/* Description */}
                    {descField && Boolean(listing[descField.slug]) && (
                      <Text className="text-slate-500 text-sm block mb-3">
                        {String(listing[descField.slug])}
                      </Text>
                    )}

                    {/* All other fields */}
                    <div className="space-y-1">
                      {detailFields
                        .filter((f) => listing[f.slug] !== null && listing[f.slug] !== undefined && listing[f.slug] !== "")
                        .map((field) => (
                          <FieldValue key={field.id} field={field} value={listing[field.slug]} />
                        ))}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </section>
      </main>

      <AppFooter config={config} appName={app.name} />
    </div>
  );
}
