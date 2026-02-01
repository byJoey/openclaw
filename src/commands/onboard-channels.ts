import type { ChannelMeta } from "../channels/plugins/types.js";
import type { OpenClawConfig } from "../config/config.js";
import type { DmPolicy } from "../config/types.js";
import type { RuntimeEnv } from "../runtime.js";
import type { WizardPrompter, WizardSelectOption } from "../wizard/prompts.js";
import type { ChannelChoice } from "./onboard-types.js";
import type {
  ChannelOnboardingDmPolicy,
  ChannelOnboardingStatus,
  SetupChannelsOptions,
} from "./onboarding/types.js";
import { resolveAgentWorkspaceDir, resolveDefaultAgentId } from "../agents/agent-scope.js";
import { listChannelPluginCatalogEntries } from "../channels/plugins/catalog.js";
import { resolveChannelDefaultAccountId } from "../channels/plugins/helpers.js";
import { listChannelPlugins, getChannelPlugin } from "../channels/plugins/index.js";
import {
  formatChannelPrimerLine,
  formatChannelSelectionLine,
  listChatChannels,
} from "../channels/registry.js";
import { formatCliCommand } from "../cli/command-format.js";
import { isChannelConfigured } from "../config/plugin-auto-enable.js";
import { enablePluginInConfig } from "../plugins/enable.js";
import { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "../routing/session-key.js";
import { formatDocsLink } from "../terminal/links.js";
import {
  ensureOnboardingPluginInstalled,
  reloadOnboardingPluginRegistry,
} from "./onboarding/plugin-install.js";
import {
  getChannelOnboardingAdapter,
  listChannelOnboardingAdapters,
} from "./onboarding/registry.js";

type ConfiguredChannelAction = "update" | "disable" | "delete" | "skip";

type ChannelStatusSummary = {
  installedPlugins: ReturnType<typeof listChannelPlugins>;
  catalogEntries: ReturnType<typeof listChannelPluginCatalogEntries>;
  statusByChannel: Map<ChannelChoice, ChannelOnboardingStatus>;
  statusLines: string[];
};

function formatAccountLabel(accountId: string): string {
  return accountId === DEFAULT_ACCOUNT_ID ? "default (primary)" : accountId;
}

async function promptConfiguredAction(params: {
  prompter: WizardPrompter;
  label: string;
  supportsDisable: boolean;
  supportsDelete: boolean;
}): Promise<ConfiguredChannelAction> {
  const { prompter, label, supportsDisable, supportsDelete } = params;
  const updateOption: WizardSelectOption<ConfiguredChannelAction> = {
    value: "update",
    label: "修改设置",
  };
  const disableOption: WizardSelectOption<ConfiguredChannelAction> = {
    value: "disable",
    label: "禁用（保留配置）",
  };
  const deleteOption: WizardSelectOption<ConfiguredChannelAction> = {
    value: "delete",
    label: "删除配置",
  };
  const skipOption: WizardSelectOption<ConfiguredChannelAction> = {
    value: "skip",
    label: "跳过（保持原样）",
  };
  const options: Array<WizardSelectOption<ConfiguredChannelAction>> = [
    updateOption,
    ...(supportsDisable ? [disableOption] : []),
    ...(supportsDelete ? [deleteOption] : []),
    skipOption,
  ];
  return await prompter.select({
    message: `${label} 已配置。您想做什么？`,
    options,
    initialValue: "update",
  });
}

async function promptRemovalAccountId(params: {
  cfg: OpenClawConfig;
  prompter: WizardPrompter;
  label: string;
  channel: ChannelChoice;
}): Promise<string> {
  const { cfg, prompter, label, channel } = params;
  const plugin = getChannelPlugin(channel);
  if (!plugin) {
    return DEFAULT_ACCOUNT_ID;
  }
  const accountIds = plugin.config.listAccountIds(cfg).filter(Boolean);
  const defaultAccountId = resolveChannelDefaultAccountId({ plugin, cfg, accountIds });
  if (accountIds.length <= 1) {
    return defaultAccountId;
  }
  const selected = await prompter.select({
    message: `${label} account`,
    options: accountIds.map((accountId) => ({
      value: accountId,
      label: formatAccountLabel(accountId),
    })),
    initialValue: defaultAccountId,
  });
  return normalizeAccountId(selected) ?? defaultAccountId;
}

async function collectChannelStatus(params: {
  cfg: OpenClawConfig;
  options?: SetupChannelsOptions;
  accountOverrides: Partial<Record<ChannelChoice, string>>;
}): Promise<ChannelStatusSummary> {
  const installedPlugins = listChannelPlugins();
  const installedIds = new Set(installedPlugins.map((plugin) => plugin.id));
  const workspaceDir = resolveAgentWorkspaceDir(params.cfg, resolveDefaultAgentId(params.cfg));
  const catalogEntries = listChannelPluginCatalogEntries({ workspaceDir }).filter(
    (entry) => !installedIds.has(entry.id),
  );
  const statusEntries = await Promise.all(
    listChannelOnboardingAdapters().map((adapter) =>
      adapter.getStatus({
        cfg: params.cfg,
        options: params.options,
        accountOverrides: params.accountOverrides,
      }),
    ),
  );
  const statusByChannel = new Map(statusEntries.map((entry) => [entry.channel, entry]));
  const fallbackStatuses = listChatChannels()
    .filter((meta) => !statusByChannel.has(meta.id))
    .map((meta) => {
      const configured = isChannelConfigured(params.cfg, meta.id);
      const statusLabel = configured ? "configured (plugin disabled)" : "not configured";
      return {
        channel: meta.id,
        configured,
        statusLines: [`${meta.label}: ${statusLabel}`],
        selectionHint: configured ? "configured · plugin disabled" : "not configured",
        quickstartScore: 0,
      };
    });
  const catalogStatuses = catalogEntries.map((entry) => ({
    channel: entry.id,
    configured: false,
    statusLines: [`${entry.meta.label}: install plugin to enable`],
    selectionHint: "plugin · install",
    quickstartScore: 0,
  }));
  const combinedStatuses = [...statusEntries, ...fallbackStatuses, ...catalogStatuses];
  const mergedStatusByChannel = new Map(combinedStatuses.map((entry) => [entry.channel, entry]));
  const statusLines = combinedStatuses.flatMap((entry) => entry.statusLines);
  return {
    installedPlugins,
    catalogEntries,
    statusByChannel: mergedStatusByChannel,
    statusLines,
  };
}

export async function noteChannelStatus(params: {
  cfg: OpenClawConfig;
  prompter: WizardPrompter;
  options?: SetupChannelsOptions;
  accountOverrides?: Partial<Record<ChannelChoice, string>>;
}): Promise<void> {
  const { statusLines } = await collectChannelStatus({
    cfg: params.cfg,
    options: params.options,
    accountOverrides: params.accountOverrides ?? {},
  });
  if (statusLines.length > 0) {
    await params.prompter.note(statusLines.join("\n"), "Channel status");
  }
}

async function noteChannelPrimer(
  prompter: WizardPrompter,
  channels: Array<{ id: ChannelChoice; blurb: string; label: string }>,
): Promise<void> {
  const channelLines = channels.map((channel) =>
    formatChannelPrimerLine({
      id: channel.id,
      label: channel.label,
      selectionLabel: channel.label,
      docsPath: "/",
      blurb: channel.blurb,
    }),
  );
  await prompter.note(
    [
      "DM 安全：默认为配对；未知 DM 会收到配对码。",
      `批准命令：${formatCliCommand("openclaw pairing approve <channel> <code>")}`,
      '公开 DM 需要 dmPolicy="open" + allowFrom=["*"]。',
      '多用户 DM：设置 session.dmScope="per-channel-peer"（或多账户频道使用 "per-account-channel-peer"）来隔离会话。',
      `文档：${formatDocsLink("/start/pairing", "start/pairing")}`,
      "",
      ...channelLines,
    ].join("\n"),
    "频道工作原理",
  );
}

function resolveQuickstartDefault(
  statusByChannel: Map<ChannelChoice, { quickstartScore?: number }>,
): ChannelChoice | undefined {
  let best: { channel: ChannelChoice; score: number } | null = null;
  for (const [channel, status] of statusByChannel) {
    if (status.quickstartScore == null) {
      continue;
    }
    if (!best || status.quickstartScore > best.score) {
      best = { channel, score: status.quickstartScore };
    }
  }
  return best?.channel;
}

async function maybeConfigureDmPolicies(params: {
  cfg: OpenClawConfig;
  selection: ChannelChoice[];
  prompter: WizardPrompter;
  accountIdsByChannel?: Map<ChannelChoice, string>;
}): Promise<OpenClawConfig> {
  const { selection, prompter, accountIdsByChannel } = params;
  const dmPolicies = selection
    .map((channel) => getChannelOnboardingAdapter(channel)?.dmPolicy)
    .filter(Boolean) as ChannelOnboardingDmPolicy[];
  if (dmPolicies.length === 0) {
    return params.cfg;
  }

  const wants = await prompter.confirm({
    message: "现在配置 DM 访问策略吗？（默认：配对）",
    initialValue: false,
  });
  if (!wants) {
    return params.cfg;
  }

  let cfg = params.cfg;
  const selectPolicy = async (policy: ChannelOnboardingDmPolicy) => {
    await prompter.note(
      [
        "默认：配对（未知 DM 会收到配对码）。",
        `批准命令：${formatCliCommand(`openclaw pairing approve ${policy.channel} <code>`)}`,
        `允许列表 DM：${policy.policyKey}="allowlist" + ${policy.allowFromKey} 条目。`,
        `公开 DM：${policy.policyKey}="open" + ${policy.allowFromKey} 包含 "*"。`,
        '多用户 DM：设置 session.dmScope="per-channel-peer"（或多账户频道使用 "per-account-channel-peer"）来隔离会话。',
        `文档：${formatDocsLink("/start/pairing", "start/pairing")}`,
      ].join("\n"),
      `${policy.label} DM 访问`,
    );
    return (await prompter.select({
      message: `${policy.label} DM 策略`,
      options: [
        { value: "pairing", label: "配对（推荐）" },
        { value: "allowlist", label: "允许列表（仅特定用户）" },
        { value: "open", label: "开放（公开入站 DM）" },
        { value: "disabled", label: "禁用（忽略 DM）" },
      ],
    })) as DmPolicy;
  };

  for (const policy of dmPolicies) {
    const current = policy.getCurrent(cfg);
    const nextPolicy = await selectPolicy(policy);
    if (nextPolicy !== current) {
      cfg = policy.setPolicy(cfg, nextPolicy);
    }
    if (nextPolicy === "allowlist" && policy.promptAllowFrom) {
      cfg = await policy.promptAllowFrom({
        cfg,
        prompter,
        accountId: accountIdsByChannel?.get(policy.channel),
      });
    }
  }

  return cfg;
}

// Channel-specific prompts moved into onboarding adapters.

export async function setupChannels(
  cfg: OpenClawConfig,
  runtime: RuntimeEnv,
  prompter: WizardPrompter,
  options?: SetupChannelsOptions,
): Promise<OpenClawConfig> {
  let next = cfg;
  const forceAllowFromChannels = new Set(options?.forceAllowFromChannels ?? []);
  const accountOverrides: Partial<Record<ChannelChoice, string>> = {
    ...options?.accountIds,
  };
  if (options?.whatsappAccountId?.trim()) {
    accountOverrides.whatsapp = options.whatsappAccountId.trim();
  }

  const { installedPlugins, catalogEntries, statusByChannel, statusLines } =
    await collectChannelStatus({ cfg: next, options, accountOverrides });
  if (!options?.skipStatusNote && statusLines.length > 0) {
    await prompter.note(statusLines.join("\n"), "频道状态");
  }

  const shouldConfigure = options?.skipConfirm
    ? true
    : await prompter.confirm({
        message: "现在配置聊天频道吗？",
        initialValue: true,
      });
  if (!shouldConfigure) {
    return cfg;
  }

  const corePrimer = listChatChannels().map((meta) => ({
    id: meta.id,
    label: meta.label,
    blurb: meta.blurb,
  }));
  const coreIds = new Set(corePrimer.map((entry) => entry.id));
  const primerChannels = [
    ...corePrimer,
    ...installedPlugins
      .filter((plugin) => !coreIds.has(plugin.id))
      .map((plugin) => ({
        id: plugin.id,
        label: plugin.meta.label,
        blurb: plugin.meta.blurb,
      })),
    ...catalogEntries
      .filter((entry) => !coreIds.has(entry.id as ChannelChoice))
      .map((entry) => ({
        id: entry.id as ChannelChoice,
        label: entry.meta.label,
        blurb: entry.meta.blurb,
      })),
  ];
  await noteChannelPrimer(prompter, primerChannels);

  const quickstartDefault =
    options?.initialSelection?.[0] ?? resolveQuickstartDefault(statusByChannel);

  const shouldPromptAccountIds = options?.promptAccountIds === true;
  const accountIdsByChannel = new Map<ChannelChoice, string>();
  const recordAccount = (channel: ChannelChoice, accountId: string) => {
    options?.onAccountId?.(channel, accountId);
    const adapter = getChannelOnboardingAdapter(channel);
    adapter?.onAccountRecorded?.(accountId, options);
    accountIdsByChannel.set(channel, accountId);
  };

  const selection: ChannelChoice[] = [];
  const addSelection = (channel: ChannelChoice) => {
    if (!selection.includes(channel)) {
      selection.push(channel);
    }
  };

  const resolveDisabledHint = (channel: ChannelChoice): string | undefined => {
    const plugin = getChannelPlugin(channel);
    if (!plugin) {
      if (next.plugins?.entries?.[channel]?.enabled === false) {
        return "plugin disabled";
      }
      if (next.plugins?.enabled === false) {
        return "plugins disabled";
      }
      return undefined;
    }
    const accountId = resolveChannelDefaultAccountId({ plugin, cfg: next });
    const account = plugin.config.resolveAccount(next, accountId);
    let enabled: boolean | undefined;
    if (plugin.config.isEnabled) {
      enabled = plugin.config.isEnabled(account, next);
    } else if (typeof (account as { enabled?: boolean })?.enabled === "boolean") {
      enabled = (account as { enabled?: boolean }).enabled;
    } else if (
      typeof (next.channels as Record<string, { enabled?: boolean }> | undefined)?.[channel]
        ?.enabled === "boolean"
    ) {
      enabled = (next.channels as Record<string, { enabled?: boolean }>)[channel]?.enabled;
    }
    return enabled === false ? "disabled" : undefined;
  };

  const buildSelectionOptions = (
    entries: Array<{
      id: ChannelChoice;
      meta: { id: string; label: string; selectionLabel?: string };
    }>,
  ) =>
    entries.map((entry) => {
      const status = statusByChannel.get(entry.id);
      const disabledHint = resolveDisabledHint(entry.id);
      const hint = [status?.selectionHint, disabledHint].filter(Boolean).join(" · ") || undefined;
      return {
        value: entry.meta.id,
        label: entry.meta.selectionLabel ?? entry.meta.label,
        ...(hint ? { hint } : {}),
      };
    });

  const getChannelEntries = () => {
    const core = listChatChannels();
    const installed = listChannelPlugins();
    const installedIds = new Set(installed.map((plugin) => plugin.id));
    const workspaceDir = resolveAgentWorkspaceDir(next, resolveDefaultAgentId(next));
    const catalog = listChannelPluginCatalogEntries({ workspaceDir }).filter(
      (entry) => !installedIds.has(entry.id),
    );
    const metaById = new Map<string, ChannelMeta>();
    for (const meta of core) {
      metaById.set(meta.id, meta);
    }
    for (const plugin of installed) {
      metaById.set(plugin.id, plugin.meta);
    }
    for (const entry of catalog) {
      if (!metaById.has(entry.id)) {
        metaById.set(entry.id, entry.meta);
      }
    }
    const entries = Array.from(metaById, ([id, meta]) => ({
      id: id as ChannelChoice,
      meta,
    }));
    return {
      entries,
      catalog,
      catalogById: new Map(catalog.map((entry) => [entry.id as ChannelChoice, entry])),
    };
  };

  const refreshStatus = async (channel: ChannelChoice) => {
    const adapter = getChannelOnboardingAdapter(channel);
    if (!adapter) {
      return;
    }
    const status = await adapter.getStatus({ cfg: next, options, accountOverrides });
    statusByChannel.set(channel, status);
  };

  const ensureBundledPluginEnabled = async (channel: ChannelChoice): Promise<boolean> => {
    if (getChannelPlugin(channel)) {
      return true;
    }
    const result = enablePluginInConfig(next, channel);
    next = result.config;
    if (!result.enabled) {
      await prompter.note(
        `Cannot enable ${channel}: ${result.reason ?? "plugin disabled"}.`,
        "Channel setup",
      );
      return false;
    }
    const workspaceDir = resolveAgentWorkspaceDir(next, resolveDefaultAgentId(next));
    reloadOnboardingPluginRegistry({
      cfg: next,
      runtime,
      workspaceDir,
    });
    if (!getChannelPlugin(channel)) {
      await prompter.note(`${channel} plugin not available.`, "Channel setup");
      return false;
    }
    await refreshStatus(channel);
    return true;
  };

  const configureChannel = async (channel: ChannelChoice) => {
    const adapter = getChannelOnboardingAdapter(channel);
    if (!adapter) {
      await prompter.note(`${channel} does not support onboarding yet.`, "Channel setup");
      return;
    }
    const result = await adapter.configure({
      cfg: next,
      runtime,
      prompter,
      options,
      accountOverrides,
      shouldPromptAccountIds,
      forceAllowFrom: forceAllowFromChannels.has(channel),
    });
    next = result.cfg;
    if (result.accountId) {
      recordAccount(channel, result.accountId);
    }
    addSelection(channel);
    await refreshStatus(channel);
  };

  const handleConfiguredChannel = async (channel: ChannelChoice, label: string) => {
    const plugin = getChannelPlugin(channel);
    const adapter = getChannelOnboardingAdapter(channel);
    const supportsDisable = Boolean(
      options?.allowDisable && (plugin?.config.setAccountEnabled || adapter?.disable),
    );
    const supportsDelete = Boolean(options?.allowDisable && plugin?.config.deleteAccount);
    const action = await promptConfiguredAction({
      prompter,
      label,
      supportsDisable,
      supportsDelete,
    });

    if (action === "skip") {
      return;
    }
    if (action === "update") {
      await configureChannel(channel);
      return;
    }
    if (!options?.allowDisable) {
      return;
    }

    if (action === "delete" && !supportsDelete) {
      await prompter.note(`${label} does not support deleting config entries.`, "Remove channel");
      return;
    }

    const shouldPromptAccount =
      action === "delete"
        ? Boolean(plugin?.config.deleteAccount)
        : Boolean(plugin?.config.setAccountEnabled);
    const accountId = shouldPromptAccount
      ? await promptRemovalAccountId({
          cfg: next,
          prompter,
          label,
          channel,
        })
      : DEFAULT_ACCOUNT_ID;
    const resolvedAccountId =
      normalizeAccountId(accountId) ??
      (plugin ? resolveChannelDefaultAccountId({ plugin, cfg: next }) : DEFAULT_ACCOUNT_ID);
    const accountLabel = formatAccountLabel(resolvedAccountId);

    if (action === "delete") {
      const confirmed = await prompter.confirm({
        message: `Delete ${label} account "${accountLabel}"?`,
        initialValue: false,
      });
      if (!confirmed) {
        return;
      }
      if (plugin?.config.deleteAccount) {
        next = plugin.config.deleteAccount({ cfg: next, accountId: resolvedAccountId });
      }
      await refreshStatus(channel);
      return;
    }

    if (plugin?.config.setAccountEnabled) {
      next = plugin.config.setAccountEnabled({
        cfg: next,
        accountId: resolvedAccountId,
        enabled: false,
      });
    } else if (adapter?.disable) {
      next = adapter.disable(next);
    }
    await refreshStatus(channel);
  };

  const handleChannelChoice = async (channel: ChannelChoice) => {
    const { catalogById } = getChannelEntries();
    const catalogEntry = catalogById.get(channel);
    if (catalogEntry) {
      const workspaceDir = resolveAgentWorkspaceDir(next, resolveDefaultAgentId(next));
      const result = await ensureOnboardingPluginInstalled({
        cfg: next,
        entry: catalogEntry,
        prompter,
        runtime,
        workspaceDir,
      });
      next = result.cfg;
      if (!result.installed) {
        return;
      }
      reloadOnboardingPluginRegistry({
        cfg: next,
        runtime,
        workspaceDir,
      });
      await refreshStatus(channel);
    } else {
      const enabled = await ensureBundledPluginEnabled(channel);
      if (!enabled) {
        return;
      }
    }

    const plugin = getChannelPlugin(channel);
    const label = plugin?.meta.label ?? catalogEntry?.meta.label ?? channel;
    const status = statusByChannel.get(channel);
    const configured = status?.configured ?? false;
    if (configured) {
      await handleConfiguredChannel(channel, label);
      return;
    }
    await configureChannel(channel);
  };

  if (options?.quickstartDefaults) {
    const { entries } = getChannelEntries();
    const choice = (await prompter.select({
      message: "选择频道（快速开始）",
      options: [
        ...buildSelectionOptions(entries),
        {
          value: "__skip__",
          label: "暂时跳过",
          hint: `您可以稍后通过 \`${formatCliCommand("openclaw channels add")}\` 添加频道`,
        },
      ],
      initialValue: quickstartDefault,
    })) as ChannelChoice | "__skip__";
    if (choice !== "__skip__") {
      await handleChannelChoice(choice);
    }
  } else {
    const doneValue = "__done__" as const;
    const initialValue = options?.initialSelection?.[0] ?? quickstartDefault;
    while (true) {
      const { entries } = getChannelEntries();
      const choice = (await prompter.select({
        message: "选择频道",
        options: [
          ...buildSelectionOptions(entries),
          {
            value: doneValue,
            label: "完成",
            hint: selection.length > 0 ? "完成" : "暂时跳过",
          },
        ],
        initialValue,
      })) as ChannelChoice | typeof doneValue;
      if (choice === doneValue) {
        break;
      }
      await handleChannelChoice(choice);
    }
  }

  options?.onSelection?.(selection);

  const selectionNotes = new Map<string, string>();
  const { entries: selectionEntries } = getChannelEntries();
  for (const entry of selectionEntries) {
    selectionNotes.set(entry.id, formatChannelSelectionLine(entry.meta, formatDocsLink));
  }
  const selectedLines = selection
    .map((channel) => selectionNotes.get(channel))
    .filter((line): line is string => Boolean(line));
  if (selectedLines.length > 0) {
    await prompter.note(selectedLines.join("\n"), "已选择的频道");
  }

  if (!options?.skipDmPolicyPrompt) {
    next = await maybeConfigureDmPolicies({
      cfg: next,
      selection,
      prompter,
      accountIdsByChannel,
    });
  }

  return next;
}
