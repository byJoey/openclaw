/**
 * OpenClaw 国际化入口文件
 * Internationalization entry point for OpenClaw
 */

import { zh_CN } from "./zh-CN.js";

export type SupportedLocale = "en" | "zh-CN";

const translations = {
  "zh-CN": zh_CN,
};

// 默认语言设置 - 可通过环境变量 OPENCLAW_LOCALE 覆盖
let currentLocale: SupportedLocale =
  (process.env.OPENCLAW_LOCALE as SupportedLocale) || "zh-CN";

export function setLocale(locale: SupportedLocale) {
  currentLocale = locale;
}

export function getLocale(): SupportedLocale {
  return currentLocale;
}

export function t(key: string): string {
  if (currentLocale === "en") {
    return key; // 英文直接返回原文
  }

  const keys = key.split(".");
  let value: unknown = translations[currentLocale];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key; // 找不到翻译，返回原文
    }
  }

  return typeof value === "string" ? value : key;
}

export { zh_CN };
