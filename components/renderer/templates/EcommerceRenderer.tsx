"use client";
import { useEffect, useState } from "react";
import {
  Card, Row, Col, Button, Typography, Tag, Input, Select,
  Empty, Spin, Badge, Drawer, App as AntApp, Form, Tabs, Dropdown,
} from "antd";
import {
  ShoppingCartOutlined, SearchOutlined,
  MinusOutlined, PlusOutlined, DeleteOutlined, CheckCircleOutlined,
  UserOutlined, LogoutOutlined,
} from "@ant-design/icons";
import type { AppConfig, AppTemplate } from "@/types";
import AppFooter from "../AppFooter";

const { Title, Text, Paragraph } = Typography;

interface Props {
  app: { id: string; name: string; template: AppTemplate; config: AppConfig };
  pathname: string;
  config: AppConfig;
  basePath?: string;
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

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

function formatPrice(amount: number, symbol = "₹") {
  return `${symbol}${amount.toLocaleString("en-IN")}`;
}

function getFirstImage(images: unknown): string | undefined {
  if (!images) return undefined;
  if (Array.isArray(images)) return images[0] as string | undefined;
  if (typeof images === "string" && images) return images;
  return undefined;
}

function customerStorageKey(appId: string) {
  return `ec_${appId}_session`;
}

function loadStoredSession(appId: string): { token: string; customer: Customer } | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(customerStorageKey(appId)) : null;
    return raw ? (JSON.parse(raw) as { token: string; customer: Customer }) : null;
  } catch {
    return null;
  }
}

function saveSession(appId: string, token: string, customer: Customer) {
  localStorage.setItem(customerStorageKey(appId), JSON.stringify({ token, customer }));
}

function clearSession(appId: string) {
  localStorage.removeItem(customerStorageKey(appId));
}

// ── Customer Auth Drawer ─────────────────────────────────────────────────────

function CustomerAuthDrawer({
  open, onClose, appId, primaryColor, onAuth,
}: {
  open: boolean;
  onClose: () => void;
  appId: string;
  primaryColor: string;
  onAuth: (customer: Customer, token: string) => void;
}) {
  const { message } = AntApp.useApp();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loginForm] = Form.useForm();
  const [regForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      const values = await loginForm.validateFields();
      setLoading(true);
      const res = await fetch(`/api/apps/${appId}/customers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      onAuth(data.customer, data.token);
      loginForm.resetFields();
      onClose();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    try {
      const values = await regForm.validateFields();
      setLoading(true);
      const res = await fetch(`/api/apps/${appId}/customers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      message.success("Account created! Please log in.");
      loginForm.setFieldValue("email", values.email);
      regForm.resetFields();
      setTab("login");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer title={tab === "login" ? "Login" : "Create Account"} placement="right" open={open} onClose={onClose} styles={{ wrapper: { width: "min(380px, 100vw)" } }}>
      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as "login" | "register")}
        items={[
          {
            key: "login",
            label: "Login",
            children: (
              <Form form={loginForm} layout="vertical">
                <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
                  <Input type="email" placeholder="you@example.com" />
                </Form.Item>
                <Form.Item name="password" label="Password" rules={[{ required: true, message: "Required" }]}>
                  <Input.Password placeholder="••••••••" />
                </Form.Item>
                <Button type="primary" block size="large" loading={loading} onClick={handleLogin} style={{ background: primaryColor }}>
                  Login
                </Button>
                <div className="text-center mt-4 text-sm text-slate-500">
                  New here?{" "}
                  <Button type="link" className="!p-0" onClick={() => setTab("register")}>Create an account</Button>
                </div>
              </Form>
            ),
          },
          {
            key: "register",
            label: "Register",
            children: (
              <Form form={regForm} layout="vertical">
                <Form.Item name="name" label="Full Name" rules={[{ required: true, message: "Required" }]}>
                  <Input placeholder="John Doe" />
                </Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
                  <Input type="email" placeholder="you@example.com" />
                </Form.Item>
                <Form.Item name="phone" label="Phone">
                  <Input type="tel" placeholder="+91 98765 43210" />
                </Form.Item>
                <Form.Item name="password" label="Password" rules={[{ required: true, min: 6, message: "At least 6 characters" }]}>
                  <Input.Password placeholder="••••••••" />
                </Form.Item>
                <Button type="primary" block size="large" loading={loading} onClick={handleRegister} style={{ background: primaryColor }}>
                  Create Account
                </Button>
                <div className="text-center mt-4 text-sm text-slate-500">
                  Already have an account?{" "}
                  <Button type="link" className="!p-0" onClick={() => setTab("login")}>Login</Button>
                </div>
              </Form>
            ),
          },
        ]}
      />
    </Drawer>
  );
}

// ── Product Grid ─────────────────────────────────────────────────────────────

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
    fetch(`/api/apps/${appId}/storefront?model=${modelSlug}&limit=100`)
      .then((r) => r.json())
      .then((data) => {
        const list: Product[] = (data.records || []).filter((p: Product) => p.isActive !== false);
        setProducts(list);
        const cats = [...new Set(list.map((p) => p.category).filter(Boolean))] as string[];
        setCategories(cats);
      })
      .finally(() => setLoading(false));
  }, [appId, modelSlug]);

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
                  getFirstImage(product.images) ? (
                    <img
                      src={getFirstImage(product.images)}
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

// ── Checkout Drawer ──────────────────────────────────────────────────────────

function CheckoutDrawer({
  open, onClose, items, currencySymbol, appId, appName, razorpayEnabled, customer, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  currencySymbol: string;
  appId: string;
  appName: string;
  razorpayEnabled: boolean;
  customer: Customer | null;
  onSuccess: (orderId: string, amount: number) => void;
}) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm();
  const [paying, setPaying] = useState(false);
  const total = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  // Pre-fill delivery details from logged-in customer
  useEffect(() => {
    if (open && customer) {
      form.setFieldsValue({
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || "",
      });
    }
  }, [open, customer, form]);

  async function handlePay() {
    try {
      const values = await form.validateFields();
      setPaying(true);

      const customerDetails = {
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
        address: values.address,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
      };
      const orderItems = items.map((i) => ({ name: i.product.name, qty: i.qty, price: i.product.price }));

      if (razorpayEnabled) {
        const res = await fetch(`/api/apps/${appId}/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: total, ...customerDetails }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Payment initiation failed");

        const { orderId: rzpOrderId, amount: rzpAmount, currency, keyId, appName: name } = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window as any).Razorpay({
          key: keyId,
          amount: rzpAmount,
          currency,
          order_id: rzpOrderId,
          name: name || appName,
          prefill: { name: values.customerName, email: values.customerEmail, contact: values.customerPhone },
          theme: { color: "#d4380d" },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const verifyRes = await fetch(`/api/apps/${appId}/checkout/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                customerDetails, items: orderItems, amount: total, paymentMethod: "razorpay",
              }),
            });
            if (verifyRes.ok) {
              const data = await verifyRes.json();
              onSuccess(data.orderId, total);
            } else {
              message.error("Payment verification failed. Please contact support.");
            }
            setPaying(false);
          },
          modal: { ondismiss: () => setPaying(false) },
        });
        rzp.open();
      } else {
        const res = await fetch(`/api/apps/${appId}/checkout/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerDetails, items: orderItems, amount: total, paymentMethod: "cod" }),
        });
        if (!res.ok) throw new Error("Failed to place order");
        const data = await res.json();
        onSuccess(data.orderId, total);
        setPaying(false);
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Something went wrong");
      setPaying(false);
    }
  }

  return (
    <Drawer
      title="Checkout"
      placement="right"
      open={open}
      onClose={onClose}
      styles={{ wrapper: { width: "min(480px, 100vw)" } }}
      footer={
        <div>
          <div className="flex justify-between mb-3">
            <Text strong>Total</Text>
            <Text strong className="text-xl">{formatPrice(total, currencySymbol)}</Text>
          </div>
          <Button type="primary" block size="large" loading={paying} onClick={handlePay}>
            {razorpayEnabled ? `Pay ${formatPrice(total, currencySymbol)}` : "Place Order (Cash on Delivery)"}
          </Button>
        </div>
      }
    >
      <div className="bg-slate-50 rounded-lg p-3 mb-5">
        <Text className="text-xs text-slate-500 uppercase tracking-wide block mb-2">Order Summary</Text>
        {items.map((item) => (
          <div key={item.product._id} className="flex justify-between text-sm py-1">
            <span className="text-slate-700">{item.product.name} <span className="text-slate-400">× {item.qty}</span></span>
            <span className="font-medium">{formatPrice(item.product.price * item.qty, currencySymbol)}</span>
          </div>
        ))}
      </div>

      <Text className="text-xs text-slate-500 uppercase tracking-wide block mb-3">Delivery Details</Text>
      <Form form={form} layout="vertical">
        <Form.Item name="customerName" label="Full Name" rules={[{ required: true, message: "Required" }]}>
          <Input placeholder="John Doe" />
        </Form.Item>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
          <Form.Item name="customerEmail" label="Email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
            <Input type="email" placeholder="john@example.com" />
          </Form.Item>
          <Form.Item name="customerPhone" label="Phone" rules={[{ required: true, message: "Required" }]}>
            <Input type="tel" placeholder="+91 98765 43210" />
          </Form.Item>
        </div>
        <Form.Item name="address" label="Street Address" rules={[{ required: true, message: "Required" }]}>
          <Input.TextArea rows={2} placeholder="House no., Street, Landmark" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-3">
          <Form.Item name="city" label="City" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="Chennai" />
          </Form.Item>
          <Form.Item name="state" label="State" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="Tamil Nadu" />
          </Form.Item>
        </div>
        <Form.Item name="pincode" label="Pincode" rules={[{ required: true, message: "Required" }]}>
          <Input maxLength={6} placeholder="600001" className="max-w-[140px]" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

// ── Cart Drawer ──────────────────────────────────────────────────────────────

function CartDrawer({
  open, onClose, items, onUpdateQty, onRemove, currencySymbol, onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  currencySymbol: string;
  onCheckout: () => void;
}) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  return (
    <Drawer
      title={<><ShoppingCartOutlined /> Cart ({items.length} items)</>}
      placement="right"
      onClose={onClose}
      open={open}
      styles={{ wrapper: { width: "min(400px, 100vw)" } }}
      footer={
        items.length > 0 && (
          <div>
            <div className="flex justify-between mb-4">
              <Text strong>Total</Text>
              <Text strong className="text-xl">{formatPrice(total, currencySymbol)}</Text>
            </div>
            <Button type="primary" block size="large" onClick={() => { onClose(); onCheckout(); }}>Proceed to Checkout</Button>
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
              {getFirstImage(item.product.images) ? (
                <img src={getFirstImage(item.product.images)} alt={item.product.name} className="w-16 h-16 object-cover rounded" />
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

// ── Main Renderer ─────────────────────────────────────────────────────────────

export default function EcommerceRenderer({ app, pathname, config, basePath = "" }: Props) {
  const { message } = AntApp.useApp();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderId: string; amount: number } | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const currencySymbol = (config.settings?.currencySymbol as string) || "₹";
  const productsModel = config.dataModels.find((m) => m.slug === "products") ?? config.dataModels[0];
  const productsModelSlug = productsModel?.slug ?? "products";
  const razorpayEnabled = !!(config.integrations?.razorpay?.enabled && config.integrations.razorpay.keyId);

  // Restore customer session from localStorage
  useEffect(() => {
    const stored = loadStoredSession(app.id);
    if (stored) setCustomer(stored.customer);
  }, [app.id]);

  // Load Razorpay checkout script when payment is enabled
  useEffect(() => {
    if (!razorpayEnabled) return;
    if (document.getElementById("rzp-script")) return;
    const s = document.createElement("script");
    s.id = "rzp-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(s);
  }, [razorpayEnabled]);

  function handleAuth(newCustomer: Customer, token: string) {
    saveSession(app.id, token, newCustomer);
    setCustomer(newCustomer);
    message.success(`Welcome, ${newCustomer.name}!`);
  }

  function handleLogout() {
    clearSession(app.id);
    setCustomer(null);
    message.success("Logged out");
  }

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

  const currentPageConfig = config.pages.find((p) =>
    pathname === "/" ? p.isHome : `/${p.slug}` === pathname
  ) || config.pages.find((p) => p.isHome);

  const heroComponent = currentPageConfig?.components.find((c) => c.type === "hero");
  const isProductsPage = pathname === "/products" || (currentPageConfig?.components.some((c) => c.type === "product_grid"));
  const isCartPage = pathname === "/cart";

  return (
    <div>
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{ backgroundColor: config.theme.backgroundColor, borderBottom: `1px solid ${config.theme.primaryColor}22` }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href={basePath || "/"} className="font-bold text-xl no-underline" style={{ color: config.theme.primaryColor }}>
            {config.theme.logoUrl ? (
              <img src={config.theme.logoUrl} alt={app.name} className="h-8 w-auto" />
            ) : app.name}
          </a>

          <nav className="hidden md:flex items-center gap-6">
            {config.navigation.items.map((item) => (
              <a key={item.id} href={basePath + item.href} className="text-sm font-medium no-underline hover:opacity-75" style={{ color: config.theme.textColor }}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Customer auth button */}
            {customer ? (
              <Dropdown
                menu={{
                  items: [
                    { key: "name", label: <span className="text-xs text-slate-400">{customer.email}</span>, disabled: true },
                    { type: "divider" },
                    { key: "logout", label: "Logout", icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
                  ],
                }}
              >
                <Button type="text" icon={<UserOutlined />} style={{ color: config.theme.textColor }}>
                  <span className="hidden sm:inline">{customer.name.split(" ")[0]}</span>
                </Button>
              </Dropdown>
            ) : (
              <Button type="text" icon={<UserOutlined />} onClick={() => setAuthOpen(true)} style={{ color: config.theme.textColor }}>
                <span className="hidden sm:inline">Login</span>
              </Button>
            )}

            <Button type="text" onClick={() => setCartOpen(true)}>
              <Badge count={cartItems.reduce((s, i) => s + i.qty, 0)} showZero={false}>
                <ShoppingCartOutlined className="text-xl" style={{ color: config.theme.textColor }} />
              </Badge>
            </Button>
          </div>
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
              <Button type="primary" size="large" href={basePath + (heroComponent.props.ctaHref as string || "/products")} className="mt-4">
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
              <Empty description={<div><div>Your cart is empty</div><Button type="primary" href={basePath + "/products"} className="mt-4">Browse Products</Button></div>} />
            ) : (
              <div>
                {cartItems.map((item) => (
                  <Card key={item.product._id} className="mb-4 !rounded-xl">
                    <div className="flex items-center gap-4">
                      {getFirstImage(item.product.images) && <img src={getFirstImage(item.product.images)} alt={item.product.name} className="w-20 h-20 object-cover rounded" />}
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
                  <Button type="primary" size="large" onClick={() => setCheckoutOpen(true)}>Proceed to Checkout</Button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <AppFooter config={config} appName={app.name} basePath={basePath} />

      <CustomerAuthDrawer
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        appId={app.id}
        primaryColor={config.theme.primaryColor}
        onAuth={handleAuth}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        currencySymbol={currencySymbol}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
      />

      <CheckoutDrawer
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cartItems}
        currencySymbol={currencySymbol}
        appId={app.id}
        appName={app.name}
        razorpayEnabled={razorpayEnabled}
        customer={customer}
        onSuccess={(orderId, amount) => {
          setCartItems([]);
          setCheckoutOpen(false);
          setOrderSuccess({ orderId, amount });
        }}
      />

      {/* Order success overlay */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6" style={{ backgroundColor: config.theme.backgroundColor }}>
          <div className="text-center max-w-sm w-full">
            <CheckCircleOutlined className="text-7xl text-green-500 mb-4" />
            <Title level={2} style={{ color: config.theme.textColor }}>Order Placed!</Title>
            <p className="text-slate-500 mb-1">Your order has been confirmed.</p>
            <p className="text-slate-400 text-sm mb-6">
              Order ref: <span className="font-mono font-semibold">{orderSuccess.orderId.slice(-8).toUpperCase()}</span>
              &nbsp;·&nbsp;{formatPrice(orderSuccess.amount, currencySymbol)}
            </p>
            <Button type="primary" size="large" onClick={() => setOrderSuccess(null)}>
              Continue Shopping
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
