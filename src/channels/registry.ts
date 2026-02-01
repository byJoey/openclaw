import type { ChannelMeta } from "./plugins/types.js";
import type { ChannelId } from "./plugins/types.js";
import { requireActivePluginRegistry } from "../plugins/runtime.js";

// Channel docking: add new core channels here (order + meta + aliases), then
// register the plugin in its extension entrypoint and keep protocol IDs in sync.
export const CHAT_CHANNEL_ORDER = [
  "telegram",
  "whatsapp",
  "discord",
  "googlechat",
  "slack",
  "signal",
  "imessage",
] as const;

export type ChatChannelId = (typeof CHAT_CHANNEL_ORDER)[number];

export const CHANNEL_IDS = [...CHAT_CHANNEL_ORDER] as const;

export const DEFAULT_CHAT_CHANNEL: ChatChannelId = "whatsapp";

export type ChatChannelMeta = ChannelMeta;

const WEBSITE_URL = "https://openclaw.ai";

const CHAT_CHANNEL_META: Record<ChatChannelId, ChannelMeta> = {
  telegram: {
    id: "telegram",
    label: "Telegram",
    selectionLabel: "Telegram（Bot API）",
    detailLabel: "Telegram 机器人",
    docsPath: "/channels/telegram",
    docsLabel: "telegram",
    blurb: "最简单的入门方式 — 使用 @BotFather 注册一个机器人并开始使用。",
    systemImage: "paperplane",
    selectionDocsPrefix: "",
    selectionDocsOmitLabel: true,
    selectionExtras: [WEBSITE_URL],
  },
  whatsapp: {
    id: "whatsapp",
    label: "WhatsApp",
    selectionLabel: "WhatsApp（二维码链接）",
    detailLabel: "WhatsApp Web",
    docsPath: "/channels/whatsapp",
    docsLabel: "whatsapp",
    blurb: "使用您自己的号码；建议使用单独的手机 + eSIM。",
    systemImage: "message",
  },
  discord: {
    id: "discord",
    label: "Discord",
    selectionLabel: "Discord（Bot API）",
    detailLabel: "Discord 机器人",
    docsPath: "/channels/discord",
    docsLabel: "discord",
    blurb: "目前支持非常好。",
    systemImage: "bubble.left.and.bubble.right",
  },
  googlechat: {
    id: "googlechat",
    label: "Google Chat",
    selectionLabel: "Google Chat（Chat API）",
    detailLabel: "Google Chat",
    docsPath: "/channels/googlechat",
    docsLabel: "googlechat",
    blurb: "带有 HTTP webhook 的 Google Workspace Chat 应用。",
    systemImage: "message.badge",
  },
  slack: {
    id: "slack",
    label: "Slack",
    selectionLabel: "Slack（Socket Mode）",
    detailLabel: "Slack 机器人",
    docsPath: "/channels/slack",
    docsLabel: "slack",
    blurb: "支持（Socket Mode）。",
    systemImage: "number",
  },
  signal: {
    id: "signal",
    label: "Signal",
    selectionLabel: "Signal（signal-cli）",
    detailLabel: "Signal REST",
    docsPath: "/channels/signal",
    docsLabel: "signal",
    blurb: "signal-cli 链接设备；需要更多设置。",
    systemImage: "antenna.radiowaves.left.and.right",
  },
  imessage: {
    id: "imessage",
    label: "iMessage",
    selectionLabel: "iMessage（imsg）",
    detailLabel: "iMessage",
    docsPath: "/channels/imessage",
    docsLabel: "imessage",
    blurb: "这仍在开发中。",
    systemImage: "message.fill",
  },
};

export const CHAT_CHANNEL_ALIASES: Record<string, ChatChannelId> = {
  imsg: "imessage",
  "google-chat": "googlechat",
  gchat: "googlechat",
};

const normalizeChannelKey = (raw?: string | null): string | undefined => {
  const normalized = raw?.trim().toLowerCase();
  return normalized || undefined;
};

export function listChatChannels(): ChatChannelMeta[] {
  return CHAT_CHANNEL_ORDER.map((id) => CHAT_CHANNEL_META[id]);
}

export function listChatChannelAliases(): string[] {
  return Object.keys(CHAT_CHANNEL_ALIASES);
}

export function getChatChannelMeta(id: ChatChannelId): ChatChannelMeta {
  return CHAT_CHANNEL_META[id];
}

export function normalizeChatChannelId(raw?: string | null): ChatChannelId | null {
  const normalized = normalizeChannelKey(raw);
  if (!normalized) {
    return null;
  }
  const resolved = CHAT_CHANNEL_ALIASES[normalized] ?? normalized;
  return CHAT_CHANNEL_ORDER.includes(resolved) ? resolved : null;
}

// Channel docking: prefer this helper in shared code. Importing from
// `src/channels/plugins/*` can eagerly load channel implementations.
export function normalizeChannelId(raw?: string | null): ChatChannelId | null {
  return normalizeChatChannelId(raw);
}

// Normalizes registered channel plugins (bundled or external).
//
// Keep this light: we do not import channel plugins here (those are "heavy" and can pull in
// monitors, web login, etc). The plugin registry must be initialized first.
export function normalizeAnyChannelId(raw?: string | null): ChannelId | null {
  const key = normalizeChannelKey(raw);
  if (!key) {
    return null;
  }

  const registry = requireActivePluginRegistry();
  const hit = registry.channels.find((entry) => {
    const id = String(entry.plugin.id ?? "")
      .trim()
      .toLowerCase();
    if (id && id === key) {
      return true;
    }
    return (entry.plugin.meta.aliases ?? []).some((alias) => alias.trim().toLowerCase() === key);
  });
  return hit?.plugin.id ?? null;
}

export function formatChannelPrimerLine(meta: ChatChannelMeta): string {
  return `${meta.label}: ${meta.blurb}`;
}

export function formatChannelSelectionLine(
  meta: ChatChannelMeta,
  docsLink: (path: string, label?: string) => string,
): string {
  const docsPrefix = meta.selectionDocsPrefix ?? "Docs:";
  const docsLabel = meta.docsLabel ?? meta.id;
  const docs = meta.selectionDocsOmitLabel
    ? docsLink(meta.docsPath)
    : docsLink(meta.docsPath, docsLabel);
  const extras = (meta.selectionExtras ?? []).filter(Boolean).join(" ");
  return `${meta.label} — ${meta.blurb} ${docsPrefix ? `${docsPrefix} ` : ""}${docs}${extras ? ` ${extras}` : ""}`;
}
