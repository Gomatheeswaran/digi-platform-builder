"use client";
import { useEffect, useState } from "react";
import {
  Card, Row, Col, Button, Typography, Tag, Input, Select,
  Empty, Spin, Badge, Drawer, App as AntApp,
} from "antd";
import {
  ShoppingCartOutlined, SearchOutlined,
  MinusOutlined, PlusOutlined, DeleteOutlined,
} from "@ant-design/icons";
import type { AppConfig, AppTemplate } from "@/types";
import AppFooter from "../AppFooter";

const { Title, Text, Paragraph } = Typography;

interface Props {
  app: { id: string; name: string; template: AppTemplate; config: AppConfig };
  pathname: string;
  config: AppConfig;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category?: string;
  brand?: string;
  description?: string;
  images?: string[];
  isActive?: boolean;
}

interface CartItem {
  product: Product;
  qty: number;
}

function formatPrice(amount: number, symbol = "₹") {
  return `${symbol}${amount.toLocaleString("en-IN")}`;
}

function ProductGrid({
  appId,
  modelSlug,
  currencySymbol,
  onAddToCart,
}: {
  appId: string;
  modelSlug: string;
  currencySymbol: string;
  onAddToCart: (product: Product) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/apps/${appId}/data?model=${modelSlug}&limit=100`)
      .then((r) => r.json())
      .then((data) => {
        const list: Product[] = (data.records || []).filter((p: Product) => p.isActive !== false);
        setProducts(list);
        const cats = [...new Set(list.map((p) => p.category).filter(Boolean))] as string[];
        setCategories(cats);
      })
      .finally(() => setLoading(false));
  }, [appId]);

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || p.category === category;
    return matchSearch && matchCategory;
  });

  if (loading) return <div className="flex justify-center py-12"><Spin /></div>;

  return (
    <div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <Input
          placeholder="Search products..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          allowClear
        />
        {categories.length > 0 && (
          <Select
            placeholder="All Categories"
            value={category || undefined}
            onChange={setCategory}
            allowClear
            style={{ minWidth: 160 }}
            options={categories.map((c) => ({ value: c, label: c }))}
          />
        )}
      </div>

      {filtered.length === 0 ? (
        <Empty description="No products found" />
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((product) => (
            <Col xs={12} md={8} lg={6} key={product._id}>
              <Card
                hoverable
                cover={
                  product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-48 object-cover w-full"
                    />
                  ) : (
                    <div className="h-48 bg-slate-100 flex items-center justify-center text-4xl">
                      🛍️
                    </div>
                  )
                }
                className="!rounded-xl"
                actions={[
                  <Button
                    key="add"
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    size="small"
                    block
                    onClick={() => onAddToCart(product)}
                  >
                    Add to Cart
                  </Button>,
                ]}
              >
                <div className="font-semibold text-slate-800 truncate">{product.name}</div>
                {product.category && (
                  <Tag className="mt-1 text-xs">{product.category}</Tag>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-bold text-lg" style={{ color: "#d4380d" }}>
                    {formatPrice(product.price, currencySymbol)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-slate-400 line-through text-sm">
                      {formatPrice(product.originalPrice, currencySymbol)}
                    </span>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

function CartDrawer({
  open,
  onClose,
  items,
  onUpdateQty,
  onRemove,
  currencySymbol,
}: {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  currencySymbol: string;
}) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  return (
    <Drawer
      title={<><ShoppingCartOutlined /> Cart ({items.length} items)</>}
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      footer={
        items.length > 0 && (
          <div>
            <div className="flex justify-between mb-4">
              <Text strong>Total</Text>
              <Text strong className="text-xl">{formatPrice(total, currencySymbol)}</Text>
            </div>
            <Button type="primary" block size="large">Proceed to Checkout</Button>
          </div>
        )
      }
    >
      {items.length === 0 ? (
        <Empty description="Your cart is empty" />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.product._id} className="flex items-center gap-3 border-b pb-4">
              {item.product.images?.[0] ? (
                <img src={item.product.images[0]} alt={item.product.name} className="w-16 h-16 object-cover rounded" />
              ) : (
                <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center text-2xl">🛍️</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.product.name}</div>
                <div className="text-sm text-slate-500">{formatPrice(item.product.price, currencySymbol)} each</div>
                <div className="flex items-center gap-2 mt-1">
                  <Button size="small" icon={<MinusOutlined />} onClick={() => onUpdateQty(item.product._id, item.qty - 1)} disabled={item.qty <= 1} />
                  <span className="w-8 text-center">{item.qty}</span>
                  <Button size="small" icon={<PlusOutlined />} onClick={() => onUpdateQty(item.product._id, item.qty + 1)} />
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatPrice(item.product.price * item.qty, currencySymbol)}</div>
                <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => onRemove(item.product._id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}

export default function EcommerceRenderer({ app, pathname, config }: Props) {
  const { message } = AntApp.useApp();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const currencySymbol = (config.settings?.currencySymbol as string) || "₹";
  const productsModel = config.dataModels.find((m) => m.slug === "products") ?? config.dataModels[0];
  const productsModelSlug = productsModel?.slug ?? "products";

  function addToCart(product: Product) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product._id === product._id);
      if (existing) return prev.map((i) => i.product._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
    message.success(`${product.name} added to cart!`);
  }

  function updateQty(productId: string, qty: number) {
    setCartItems((prev) => prev.map((i) => i.product._id === productId ? { ...i, qty } : i));
  }

  function removeFromCart(productId: string) {
    setCartItems((prev) => prev.filter((i) => i.product._id !== productId));
  }

  // Find current page config
  const currentPageConfig = config.pages.find((p) =>
    pathname === "/" ? p.isHome : `/${p.slug}` === pathname
  ) || config.pages.find((p) => p.isHome);

  const heroComponent = currentPageConfig?.components.find((c) => c.type === "hero");
  const isProductsPage = pathname === "/products" || (currentPageConfig?.components.some((c) => c.type === "product_grid"));
  const isCartPage = pathname === "/cart";

  return (
    <div>
      {/* Header with cart badge */}
      <header
        className="sticky top-0 z-50"
        style={{ backgroundColor: config.theme.backgroundColor, borderBottom: `1px solid ${config.theme.primaryColor}22` }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="font-bold text-xl no-underline" style={{ color: config.theme.primaryColor }}>
            {config.theme.logoUrl ? (
              <img src={config.theme.logoUrl} alt={app.name} className="h-8 w-auto" />
            ) : app.name}
          </a>

          <nav className="hidden md:flex items-center gap-6">
            {config.navigation.items.map((item) => (
              <a key={item.id} href={item.href} className="text-sm font-medium no-underline hover:opacity-75" style={{ color: config.theme.textColor }}>
                {item.label}
              </a>
            ))}
          </nav>

          <Button
            type="text"
            onClick={() => setCartOpen(true)}
          >
            <Badge count={cartItems.reduce((s, i) => s + i.qty, 0)} showZero={false}>
              <ShoppingCartOutlined className="text-xl" style={{ color: config.theme.textColor }} />
            </Badge>
          </Button>
        </div>
      </header>

      <main>
        {/* Hero */}
        {heroComponent && pathname === "/" && (
          <section
            className="py-20 px-6 text-center"
            style={{ background: `linear-gradient(135deg, ${config.theme.primaryColor}15 0%, ${config.theme.secondaryColor}10 100%)` }}
          >
            <Title level={1} style={{ color: config.theme.textColor }}>
              {heroComponent.props.heading as string || app.name}
            </Title>
            <Paragraph style={{ fontSize: 18, color: config.theme.textColor, opacity: 0.7 }}>
              {heroComponent.props.subtext as string || ""}
            </Paragraph>
            {!!(heroComponent.props.ctaText as string) && (
              <Button type="primary" size="large" href={heroComponent.props.ctaHref as string || "/products"} className="mt-4">
                {heroComponent.props.ctaText as string}
              </Button>
            )}
          </section>
        )}

        {/* Products */}
        {(isProductsPage || pathname === "/") && (
          <section className="max-w-6xl mx-auto px-4 py-12">
            {isProductsPage && pathname !== "/" && <Title level={2} className="!mb-6">All Products</Title>}
            {pathname === "/" && !isProductsPage && currentPageConfig?.components.some((c) => c.type === "product_grid") && (
              <Title level={2} className="!mb-6">Featured Products</Title>
            )}
            <ProductGrid
              appId={app.id}
              modelSlug={productsModelSlug}
              currencySymbol={currencySymbol}
              onAddToCart={addToCart}
            />
          </section>
        )}

        {/* Cart page */}
        {isCartPage && (
          <section className="max-w-4xl mx-auto px-4 py-12">
            <Title level={2}>Shopping Cart</Title>
            {cartItems.length === 0 ? (
              <Empty description={<div><div>Your cart is empty</div><Button type="primary" href="/products" className="mt-4">Browse Products</Button></div>} />
            ) : (
              <div>
                {cartItems.map((item) => (
                  <Card key={item.product._id} className="mb-4 !rounded-xl">
                    <div className="flex items-center gap-4">
                      {item.product.images?.[0] && <img src={item.product.images[0]} alt={item.product.name} className="w-20 h-20 object-cover rounded" />}
                      <div className="flex-1"><div className="font-semibold">{item.product.name}</div><div>{formatPrice(item.product.price, currencySymbol)}</div></div>
                      <div className="flex items-center gap-2">
                        <Button size="small" icon={<MinusOutlined />} onClick={() => updateQty(item.product._id, item.qty - 1)} disabled={item.qty <= 1} />
                        <span>{item.qty}</span>
                        <Button size="small" icon={<PlusOutlined />} onClick={() => updateQty(item.product._id, item.qty + 1)} />
                      </div>
                      <Text strong>{formatPrice(item.product.price * item.qty, currencySymbol)}</Text>
                      <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeFromCart(item.product._id)} />
                    </div>
                  </Card>
                ))}
                <div className="text-right mt-4">
                  <Title level={4}>Total: {formatPrice(cartItems.reduce((s, i) => s + i.product.price * i.qty, 0), currencySymbol)}</Title>
                  <Button type="primary" size="large">Proceed to Checkout</Button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <AppFooter config={config} appName={app.name} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
