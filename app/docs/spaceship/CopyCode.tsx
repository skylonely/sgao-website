"use client";

import { useState } from "react";
import styles from "./spaceship.module.css";

type CopyCodeProps = {
  value: string;
  label?: string;
};

export default function CopyCode({ value, label }: CopyCodeProps) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <div className={styles.codeBlock}>
      {label ? <span className={styles.codeLabel}>{label}</span> : null}
      <code>{value}</code>
      <button type="button" onClick={copyValue} aria-label={`复制 ${value}`}>
        {copied ? "已复制 ✓" : "复制"}
      </button>
    </div>
  );
}
