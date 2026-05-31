"use client";
import { useEffect, useState } from "react";
import { Card, Row, Col, Input, Select, Typography, Empty, Spin, Tag } from "antd";
import { SearchOutlined, MailOutlined, PhoneOutlined, GlobalOutlined } from "@ant-design/icons";
import type { AppConfig, AppTemplate } from "@/types";
import AppHeader from "../AppHeader";
import AppFooter from "../AppFooter";

const { Title, Text } = Typography;

interface Listing {
  _id: string;
  name: string;
  category?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  image?: string;
}

interface Props {
  app: { id: string; name: string; template: AppTemplate; config: AppConfig };
  pathname: string;
  config: AppConfig;
}

export default function DirectoryRenderer({ app, pathname, config }: Props) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");

  const listingsModel = config.dataModels.find((m) => m.slug === "listings");
  const categoryOptions = listingsModel?.fields.find((f) => f.slug === "category")?.options || [];

  useEffect(() => {
    fetch(`/api/apps/${app.id}/data?model=listings&limit=200`)
      .then((r) => r.json())
      .then((data) => setListings(data.records || []))
      .finally(() => setLoading(false));
  }, [app.id]);

  const filtered = listings.filter((l) => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.description || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || l.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      <AppHeader config={config} appName={app.name} pathname={pathname} />

      <main>
        <section className="py-16 px-6 text-center" style={{ background: `linear-gradient(135deg, ${config.theme.primaryColor}15 0%, ${config.theme.secondaryColor}10 100%)` }}>
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
                <Col xs={24} md={12} lg={8} key={listing._id}>
                  <Card hoverable className="!rounded-xl !border-slate-100 hover:!border-blue-200 h-full">
                    {listing.image && <img src={listing.image} alt={listing.name} className="w-full h-40 object-cover rounded-t-xl -mt-6 -mx-6 mb-4" style={{ width: "calc(100% + 48px)" }} />}
                    <div className="font-semibold text-slate-800 text-lg mb-1">{listing.name}</div>
                    {listing.category && <Tag className="mb-2">{listing.category}</Tag>}
                    {listing.description && <Text className="text-slate-500 text-sm block mb-3">{listing.description}</Text>}
                    <div className="space-y-1 text-sm text-slate-500">
                      {listing.phone && <div className="flex items-center gap-2"><PhoneOutlined /><a href={`tel:${listing.phone}`}>{listing.phone}</a></div>}
                      {listing.email && <div className="flex items-center gap-2"><MailOutlined /><a href={`mailto:${listing.email}`}>{listing.email}</a></div>}
                      {listing.website && <div className="flex items-center gap-2"><GlobalOutlined /><a href={listing.website} target="_blank" rel="noreferrer">Visit Website</a></div>}
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
