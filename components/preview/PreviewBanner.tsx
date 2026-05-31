"use client";
import { EyeOutlined, EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";

interface Props {
  appId: string;
  appName: string;
}

export default function PreviewBanner({ appId, appName }: Props) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-4 h-11"
      style={{ background: "#1a1a2e", borderBottom: "2px solid #1677ff" }}
    >
      <div className="flex items-center gap-3">
        <EyeOutlined className="text-blue-400" />
        <span className="text-white text-sm font-medium">
          Preview Mode
        </span>
        <span className="text-slate-400 text-xs hidden sm:inline">— {appName}</span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/apps/${appId}/builder`}
          className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md no-underline transition-colors"
        >
          <EditOutlined />
          Edit in Builder
        </Link>
        <Link
          href={`/apps/${appId}`}
          className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md no-underline transition-colors"
        >
          <ArrowLeftOutlined />
          Back
        </Link>
      </div>
    </div>
  );
}
