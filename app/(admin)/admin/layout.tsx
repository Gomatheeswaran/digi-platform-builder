"use client";
import { useEffect, useState } from "react";
import { Layout, Menu, Typography, Avatar, Dropdown } from "antd";
import {
  DashboardOutlined, TeamOutlined, AppstoreOutlined,
  GlobalOutlined, SettingOutlined, LogoutOutlined,
  UserOutlined, SafetyCertificateOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.role !== "super_admin") {
          router.push("/dashboard");
        } else {
          setUser(d);
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const navItems = [
    { key: "/admin", label: "Overview", icon: <DashboardOutlined /> },
    { key: "/admin/users", label: "Users", icon: <TeamOutlined /> },
    { key: "/admin/apps", label: "All Apps", icon: <AppstoreOutlined /> },
    { key: "/admin/domains", label: "Domains", icon: <GlobalOutlined /> },
    { key: "/admin/settings", label: "Settings", icon: <SettingOutlined /> },
  ];

  const selectedKey = navItems.slice().reverse().find((n) => pathname.startsWith(n.key))?.key || "/admin";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <Layout className="min-h-screen">
      <Sider width={240} className="!bg-slate-950" style={{ boxShadow: "2px 0 8px rgba(0,0,0,.15)" }}>
        <div className="h-16 flex items-center px-5 border-b border-slate-800 gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            <SafetyCertificateOutlined />
          </div>
          <span className="font-semibold text-white text-sm">Super Admin</span>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          className="!bg-slate-950 !border-0 mt-4"
          items={navItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <Link href={item.key}>{item.label}</Link>,
          }))}
        />

        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-xs mb-2">
              ← Back to Dashboard
            </Link>
          </div>
        )}
      </Sider>

      <Layout>
        <Header className="!bg-white !px-6 flex items-center justify-between border-b border-slate-100 h-16">
          <Text className="font-medium text-slate-600">Admin Panel</Text>
          {user && (
            <Dropdown
              menu={{
                items: [
                  { key: "dashboard", label: "User Dashboard", icon: <AppstoreOutlined />, onClick: () => router.push("/dashboard") },
                  { type: "divider" as const },
                  { key: "logout", label: "Sign Out", icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
                ],
              }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-slate-700">{user.name}</div>
                  <div className="text-xs text-red-500">super admin</div>
                </div>
                <Avatar size={32} style={{ backgroundColor: "#dc2626" }} icon={<UserOutlined />} />
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
