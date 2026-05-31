"use client";
import { Button, Typography, Tag } from "antd";
import {
  ArrowRightOutlined, CheckCircleFilled,
  ThunderboltFilled, GlobalOutlined, AppstoreOutlined, SafetyCertificateOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const { Title, Text, Paragraph } = Typography;

const FEATURES = [
  {
    icon: <AppstoreOutlined className="text-3xl text-blue-500" />,
    title: "Build Any App",
    desc: "E-commerce stores, notepads, calculators, directories, forms — pick a template and make it yours.",
  },
  {
    icon: <GlobalOutlined className="text-3xl text-green-500" />,
    title: "Host on Your Domain",
    desc: "Connect your own domain (e.g. myshop.com). We handle nginx, SSL, and deployment automatically.",
  },
  {
    icon: <ThunderboltFilled className="text-3xl text-yellow-500" />,
    title: "Full Control Dashboard",
    desc: "Update content, manage users, view orders — all from one central dashboard. No server access needed.",
  },
  {
    icon: <SafetyCertificateOutlined className="text-3xl text-purple-500" />,
    title: "Gmail Registration Only",
    desc: "Secure OTP-verified Gmail signup. No spam accounts. Every user is a real, verified person.",
  },
];

const TEMPLATES = [
  { label: "E-Commerce Store", icon: "🛍️", color: "#fff2e8", border: "#ffbb96" },
  { label: "Smart Notepad", icon: "📓", color: "#e6f4ff", border: "#91caff" },
  { label: "Custom Calculator", icon: "🧮", color: "#f9f0ff", border: "#d3adf7" },
  { label: "Business Directory", icon: "📋", color: "#e6fffb", border: "#87e8de" },
  { label: "Form Collector", icon: "📝", color: "#fff7e6", border: "#ffd591" },
  { label: "Blank App", icon: "⬜", color: "#fafafa", border: "#d9d9d9" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              AP
            </div>
            <span className="font-semibold text-slate-800 hidden sm:inline">App Platform</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button type="text" size="small" className="sm:!text-sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button type="primary" size="small" icon={<ArrowRightOutlined />} className="sm:!text-sm">
                <span className="hidden sm:inline">Get Started Free</span>
                <span className="sm:hidden">Start</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-16 text-center">
        <Tag color="blue" className="mb-4 sm:mb-6 text-xs sm:text-sm px-3 py-1 rounded-full">
          ✨ No code required
        </Tag>
        <Title
          level={1}
          className="!text-3xl sm:!text-4xl md:!text-5xl !font-extrabold !text-slate-900 !mb-4 sm:!mb-6 !leading-tight"
        >
          Build any app.
          <br />
          <span className="text-blue-600">Host on your domain.</span>
        </Title>
        <Paragraph className="!text-base sm:!text-lg md:!text-xl !text-slate-500 max-w-2xl mx-auto !mb-8">
          Register with your Gmail, pick a template, customise it, and go live on your own
          domain — no coding, no server setup, full control from one dashboard.
        </Paragraph>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register" className="w-full sm:w-auto">
            <Button type="primary" size="large" icon={<ArrowRightOutlined />} className="!h-11 sm:!h-12 !px-6 sm:!px-8 !text-sm sm:!text-base w-full sm:w-auto">
              Start Building Free
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="large" className="!h-11 sm:!h-12 !px-6 sm:!px-8 !text-sm sm:!text-base w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-slate-400">
          {["Free to start", "No credit card required", "Gmail login only"].map((t) => (
            <span key={t} className="flex items-center gap-1">
              <CheckCircleFilled className="text-green-500" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-8">
          <Title level={2} className="!text-2xl sm:!text-3xl !font-bold !text-slate-800">
            Start with a template
          </Title>
          <Text className="text-slate-400 text-sm sm:text-base">
            Pick one and make it yours in minutes
          </Text>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {TEMPLATES.map((t) => (
            <div
              key={t.label}
              className="rounded-xl border-2 p-4 sm:p-6 text-center cursor-pointer hover:shadow-md transition-all"
              style={{ background: t.color, borderColor: t.border }}
            >
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{t.icon}</div>
              <Text strong className="text-slate-700 text-sm sm:text-base">
                {t.label}
              </Text>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <Title level={2} className="!text-2xl sm:!text-3xl !font-bold !text-slate-800">
              Everything you need
            </Title>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 p-5 sm:p-6 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="flex-shrink-0">{f.icon}</div>
                <div>
                  <Title level={4} className="!mb-1 !text-slate-800 !text-base sm:!text-lg">
                    {f.title}
                  </Title>
                  <Text className="text-slate-500 text-sm">{f.desc}</Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center mb-10">
          <Title level={2} className="!text-2xl sm:!text-3xl !font-bold !text-slate-800">
            How it works
          </Title>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { step: "1", title: "Register", desc: "Sign up with your Gmail. Verify via OTP. 30 seconds." },
            { step: "2", title: "Pick a template", desc: "Choose from e-commerce, notepad, calculator, and more." },
            { step: "3", title: "Customise", desc: "Add your content, brand colours, fields, and data." },
            { step: "4", title: "Go live", desc: "Connect your domain and launch. We handle SSL & hosting." },
          ].map((s) => (
            <div key={s.step} className="text-center p-4 sm:p-6 rounded-xl bg-white border border-slate-100">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-3 text-sm">
                {s.step}
              </div>
              <Title level={5} className="!mb-1 sm:!mb-2 !text-slate-800 !text-sm sm:!text-base">
                {s.title}
              </Title>
              <Text className="text-slate-400 text-xs sm:text-sm">{s.desc}</Text>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto text-center px-4 sm:px-6">
          <Title level={2} className="!text-white !text-2xl sm:!text-3xl !font-bold !mb-3 sm:!mb-4">
            Ready to build your app?
          </Title>
          <Paragraph className="!text-blue-100 !text-base sm:!text-lg !mb-6 sm:!mb-8">
            Join builders worldwide. Start for free, upgrade when you need your own domain.
          </Paragraph>
          <Link href="/register">
            <Button
              size="large"
              className="!h-11 sm:!h-12 !px-8 sm:!px-10 !text-sm sm:!text-base bg-white !text-blue-600 border-white hover:!bg-blue-50 font-semibold"
            >
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} App Platform. Built for builders.</p>
      </footer>
    </div>
  );
}
