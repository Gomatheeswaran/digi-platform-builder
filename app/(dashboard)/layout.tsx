"use client";
import { useState, useEffect } from "react";
import { Layout, Menu, Avatar, Dropdown, Typography, Badge } from "antd";
import {
  AppstoreOutlined,
  GlobalOutlined,
  CreditCardOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.id) setUser(d);
        else router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const navItems = [
    { key: "/dashboard", label: "Dashboard", icon: <DashboardOutlined /> },
    { key: "/apps", label: "My Apps", icon: <AppstoreOutlined /> },
    { key: "/domains", label: "Domains", icon: <GlobalOutlined /> },
    { key: "/billing", label: "Billing", icon: <CreditCardOutlined /> },
    { key: "/settings", label: "Settings", icon: <SettingOutlined /> },
  ];

  const selectedKey = navItems.find((n) => pathname.startsWith(n.key))?.key || "/dashboard";

  const userMenuItems = [
    { key: "profile", label: "Account Settings", icon: <SettingOutlined />, onClick: () => router.push("/settings") },
    { type: "divider" as const },
    { key: "logout", label: "Sign Out", icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        className="!bg-slate-900"
        style={{ boxShadow: "2px 0 8px rgba(0,0,0,.1)" }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-slate-700">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            AP
          </div>
          {!collapsed && (
            <span className="ml-3 font-semibold text-white text-sm">App Platform</span>
          )}
        </div>

        {/* New App button */}
        {!collapsed && (
          <div className="p-4">
            <Link href="/apps/new">
              <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors">
                <PlusOutlined />
                New App
              </button>
            </Link>
          </div>
        )}

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          className="!bg-slate-900 !border-0 mt-2"
          items={navItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <Link href={item.key}>{item.label}</Link>,
          }))}
        />

        {/* Plan badge */}
        {!collapsed && user && (
          <div className="absolute bottom-16 left-0 right-0 px-4">
            <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
              <div className="font-medium text-slate-200 capitalize">{user.plan} Plan</div>
              {user.plan === "free" && (
                <Link href="/billing" className="text-blue-400 hover:text-blue-300">
                  Upgrade for custom domain →
                </Link>
              )}
            </div>
          </div>
        )}
      </Sider>

      <Layout>
        <Header className="!bg-white !px-6 flex items-center justify-between border-b border-slate-100 h-16">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-500 hover:text-slate-800 transition-colors"
          >
            {collapsed ? <MenuUnfoldOutlined className="text-lg" /> : <MenuFoldOutlined className="text-lg" />}
          </button>

          {user && (
            <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="bottomRight">
              <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg px-3 py-2 transition-colors">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-slate-700">{user.name}</div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                </div>
                <Avatar
                  size={36}
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
        </Header>

        <Content className="p-6 bg-slate-50 min-h-[calc(100vh-64px)]">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
