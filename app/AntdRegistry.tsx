"use client";
import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs";
import { useServerInsertedHTML } from "next/navigation";
import { useRef } from "react";

export default function AntdRegistry({ children }: { children: React.ReactNode }) {
  const cache = useRef(createCache());
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    if (inserted.current) return;
    inserted.current = true;
    return (
      <style
        id="antd-ssr"
        dangerouslySetInnerHTML={{ __html: extractStyle(cache.current, true) }}
      />
    );
  });

  return <StyleProvider cache={cache.current}>{children}</StyleProvider>;
}
