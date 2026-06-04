"use client";
import { useState, useEffect } from "react";
import { Layout, Menu, Avatar, Dropdown, Badge, Drawer } from "antd";
import {
  AppstoreOutlined, GlobalOutlined, CreditCardOutlined, SettingOutlined,
  LogoutOutlined, UserOutlined, DashboardOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, PlusOutlined, MenuOutlined,
  CustomerServiceOutlined, BellOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const { Sider, Header, Content } = Layout;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
}

const NAV_ITEMS = [
  { key: "/dashboard", label: "Dashboard", icon: <DashboardOutlined /> },
  { key: "/apps", label: "My Apps", icon: <AppstoreOutlined /> },
  { key: "/domains", label: "Domains", icon: <GlobalOutlined /> },
  { key: "/billing", label: "Billing", icon: <CreditCardOutlined /> },
  { key: "/support", label: "Support", icon: <CustomerServiceOutlined /> },
  { key: "/settings", label: "Settings", icon: <SettingOutlined /> },
];

function SidebarContent({
  user, selectedKey, collapsed, onClose, unreadSupport,
}: {
  user: User | null;
  selectedKey: string;
  collapsed: boolean;
  onClose?: () => void;
  unreadSupport: number;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-700 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          AP
        </div>
        {!collapsed && (
          <span className="ml-3 font-semibold text-white text-sm">App Platform</span>
        )}
      </div>

      {/* New App button */}
      {!collapsed && (
        <div className="p-4 flex-shrink-0">
          <Link href="/apps/new" onClick={onClose}>
            <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors">
              <PlusOutlined />
              New App
            </button>
          </Link>
        </div>
      )}

      {/* Nav */}
      <div className="flex-1 overflow-y-auto">
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          className="!bg-slate-900 !border-0 mt-2"
          items={NAV_ITEMS.map((item) => ({
            key: item.key,
            icon: item.key === "/support" && unreadSupport > 0
              ? <Badge count={unreadSupport} size="small" offset={[4, -2]}>{item.icon}</Badge>
              : item.icon,
            label: (
              <Link href={item.key} onClick={onClose}>
                {item.label}
                {item.key === "/support" && unreadSupport > 0 && collapsed && null}
              </Link>
            ),
          }))}
        />
      </div>

      {/* Plan badge */}
      {!collapsed && user && (
        <div className="px-4 pb-20 flex-shrink-0">
          <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
            <div className="font-medium text-slate-200 capitalize">{user.plan} Plan</div>
            {user.plan === "free" && (
              <Link href="/billing" onClick={onClose} className="text-blue-400 hover:text-blue-300">
                Upgrade for custom domain →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Super admin link */}
      {!collapsed && user?.role === "super_admin" && (
        <div className="px-4 pb-4 flex-shrink-0">
          <Link href="/admin" onClick={onClose}>
            <div className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              ⚡ Admin Panel
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [unreadSupport, setUnreadSupport] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.id) setUser(d);
        else router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    const poll = () =>
      fetch("/api/support/unread")
        .then((r) => r.json())
        .then((d) => setUnreadSupport(d.unread ?? 0))
        .catch(() => {});
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const selectedKey = NAV_ITEMS.find((n) => pathname.startsWith(n.key))?.key || "/dashboard";

  const userMenuItems = [
    { key: "profile", label: "Account Settings", icon: <SettingOutlined />, onClick: () => router.push("/settings") },
    { type: "divider" as const },
    { key: "logout", label: "Sign Out", icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
  ];

  return (
    <Layout className="min-h-screen">
      {/* ── Desktop sidebar ──────────────────────────────── */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={240}
          className="!bg-slate-900"
          style={{ boxShadow: "2px 0 8px rgba(0,0,0,.1)" }}
        >
          <SidebarContent user={user} selectedKey={selectedKey} collapsed={collapsed} unreadSupport={unreadSupport} />
        </Sider>
      )}

      {/* ── Mobile drawer ────────────────────────────────── */}
      {isMobile && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          placement="left"
          styles={{
            wrapper: { width: 260 },
            body: { padding: 0, background: "#0f172a", display: "flex", flexDirection: "column", height: "100%" },
            header: { display: "none" },
            mask: { background: "rgba(0,0,0,0.5)" },
          }}
        >
          <SidebarContent
            user={user}
            selectedKey={selectedKey}
            collapsed={false}
            onClose={() => setMobileOpen(false)}
            unreadSupport={unreadSupport}
          />
        </Drawer>
      )}

      <Layout>
        <Header className="!bg-white !px-4 flex items-center justify-between border-b border-slate-100 h-14 md:h-16">
          <button
            onClick={() => isMobile ? setMobileOpen(true) : setCollapsed(!collapsed)}
            className="text-slate-500 hover:text-slate-800 transition-colors p-1"
          >
            {isMobile
              ? <MenuOutlined className="text-lg" />
              : (collapsed ? <MenuUnfoldOutlined className="text-lg" /> : <MenuFoldOutlined className="text-lg" />)
            }
          </button>

          <div className="flex items-center gap-2">
            <Link href="/support">
              <Badge count={unreadSupport} size="small">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                  <BellOutlined className="text-base" />
                </button>
              </Badge>
            </Link>

            {user && (
              <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="bottomRight">
                <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-slate-700 leading-tight">{user.name}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[140px]">{user.email}</div>
                  </div>
                  <Avatar
                    size={32}
                    style={{ backgroundColor: "#1677ff" }}
                    icon={<UserOutlined />}
                  />
                  <Badge
                    count={user.plan === "free" ? "Free" : "Pro"}
                    style={{
                      backgroundColor: user.plan === "free" ? "#f0f0f0" : "#1677ff",
                      color: user.plan === "free" ? "#666" : "#fff",
                      fontSize: 10,
                    }}
                  />
                </div>
              </Dropdown>
            )}
          </div>
        </Header>

        <Content className="p-3 sm:p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-64px)]">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
