"use client";
import { useEffect, useState } from "react";
import { Layout, Menu, Typography, Avatar, Dropdown, Drawer, Badge } from "antd";
import {
  DashboardOutlined, TeamOutlined, AppstoreOutlined,
  GlobalOutlined, SettingOutlined, LogoutOutlined,
  UserOutlined, SafetyCertificateOutlined, MenuOutlined, CreditCardOutlined,
  CustomerServiceOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const { Header, Content } = Layout;
const { Text } = Typography;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadSupport, setUnreadSupport] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.role !== "super_admin") router.push("/dashboard");
        else setUser(d);
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

  const navItems = [
    { key: "/admin", label: "Overview", icon: <DashboardOutlined /> },
    { key: "/admin/tenants", label: "Tenants", icon: <TeamOutlined /> },
    { key: "/admin/users", label: "All Users", icon: <UserOutlined /> },
    { key: "/admin/apps", label: "All Apps", icon: <AppstoreOutlined /> },
    { key: "/admin/domains", label: "Domains", icon: <GlobalOutlined /> },
    { key: "/admin/payments", label: "Transactions", icon: <CreditCardOutlined /> },
    { key: "/admin/support", label: "Support", icon: <CustomerServiceOutlined /> },
    { key: "/admin/settings", label: "Settings", icon: <SettingOutlined /> },
  ];

  const selectedKey = navItems.slice().reverse().find((n) => pathname.startsWith(n.key))?.key || "/admin";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const menuItems = navItems.map((item) => ({
    key: item.key,
    icon: item.key === "/admin/support" && unreadSupport > 0
      ? <Badge count={unreadSupport} size="small" offset={[4, -2]}>{item.icon}</Badge>
      : item.icon,
    label: (
      <Link href={item.key} onClick={() => setMobileOpen(false)}>
        {item.label}
      </Link>
    ),
  }));

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center px-5 border-b border-slate-800 gap-3 flex-shrink-0">
        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          <SafetyCertificateOutlined />
        </div>
        <span className="font-semibold text-white text-sm">Super Admin</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          className="!bg-slate-950 !border-0 mt-4"
          items={menuItems}
        />
      </div>

      {user && (
        <div className="p-4 border-t border-slate-800 flex-shrink-0">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-xs"
          >
            ← Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <Layout className="min-h-screen">
      {/* Desktop sidebar */}
      {!isMobile && (
        <Layout.Sider width={240} className="!bg-slate-950" style={{ boxShadow: "2px 0 8px rgba(0,0,0,.15)" }}>
          {sidebarContent}
        </Layout.Sider>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          placement="left"
          styles={{
            wrapper: { width: 240 },
            body: { padding: 0, background: "#030712", display: "flex", flexDirection: "column", height: "100%" },
            header: { display: "none" },
            mask: { background: "rgba(0,0,0,0.6)" },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      <Layout>
        <Header className="!bg-white !px-4 flex items-center justify-between border-b border-slate-100 h-14">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                className="text-slate-500 hover:text-slate-800 transition-colors p-1"
              >
                <MenuOutlined className="text-lg" />
              </button>
            )}
            <Text className="font-medium text-slate-600 text-sm">Admin Panel</Text>
          </div>

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
              <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-slate-700">{user.name}</div>
                  <div className="text-xs text-red-500">super admin</div>
                </div>
                <Avatar size={32} style={{ backgroundColor: "#dc2626" }} icon={<UserOutlined />} />
              </div>
            </Dropdown>
          )}
        </Header>

        <Content className="p-3 sm:p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-56px)]">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
