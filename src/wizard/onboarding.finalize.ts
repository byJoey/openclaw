import fs from "node:fs/promises";
import path from "node:path";
import type { OnboardOptions } from "../commands/onboard-types.js";
import type { OpenClawConfig } from "../config/config.js";
import type { RuntimeEnv } from "../runtime.js";
import type { GatewayWizardSettings, WizardFlow } from "./onboarding.types.js";
import type { WizardPrompter } from "./prompts.js";
import { DEFAULT_BOOTSTRAP_FILENAME } from "../agents/workspace.js";
import { formatCliCommand } from "../cli/command-format.js";
import {
  buildGatewayInstallPlan,
  gatewayInstallErrorHint,
} from "../commands/daemon-install-helpers.js";
import {
  DEFAULT_GATEWAY_DAEMON_RUNTIME,
  GATEWAY_DAEMON_RUNTIME_OPTIONS,
} from "../commands/daemon-runtime.js";
import { formatHealthCheckFailure } from "../commands/health-format.js";
import { healthCommand } from "../commands/health.js";
import {
  detectBrowserOpenSupport,
  formatControlUiSshHint,
  openUrl,
  openUrlInBackground,
  probeGatewayReachable,
  waitForGatewayReachable,
  resolveControlUiLinks,
} from "../commands/onboard-helpers.js";
import { resolveGatewayService } from "../daemon/service.js";
import { isSystemdUserServiceAvailable } from "../daemon/systemd.js";
import { ensureControlUiAssetsBuilt } from "../infra/control-ui-assets.js";
import { runTui } from "../tui/tui.js";
import { resolveUserPath } from "../utils.js";

type FinalizeOnboardingOptions = {
  flow: WizardFlow;
  opts: OnboardOptions;
  baseConfig: OpenClawConfig;
  nextConfig: OpenClawConfig;
  workspaceDir: string;
  settings: GatewayWizardSettings;
  prompter: WizardPrompter;
  runtime: RuntimeEnv;
};

export async function finalizeOnboardingWizard(options: FinalizeOnboardingOptions) {
  const { flow, opts, baseConfig, nextConfig, settings, prompter, runtime } = options;

  const withWizardProgress = async <T>(
    label: string,
    options: { doneMessage?: string },
    work: (progress: { update: (message: string) => void }) => Promise<T>,
  ): Promise<T> => {
    const progress = prompter.progress(label);
    try {
      return await work(progress);
    } finally {
      progress.stop(options.doneMessage);
    }
  };

  const systemdAvailable =
    process.platform === "linux" ? await isSystemdUserServiceAvailable() : true;
  if (process.platform === "linux" && !systemdAvailable) {
    await prompter.note(
      "Systemd 用户服务不可用。跳过 lingering 检查和服务安装。",
      "Systemd",
    );
  }

  if (process.platform === "linux" && systemdAvailable) {
    const { ensureSystemdUserLingerInteractive } = await import("../commands/systemd-linger.js");
    await ensureSystemdUserLingerInteractive({
      runtime,
      prompter: {
        confirm: prompter.confirm,
        note: prompter.note,
      },
      reason:
        "Linux 安装默认使用 systemd 用户服务。如果没有 lingering，systemd 会在注销/空闲时停止用户会话并终止网关。",
      requireConfirm: false,
    });
  }

  const explicitInstallDaemon =
    typeof opts.installDaemon === "boolean" ? opts.installDaemon : undefined;
  let installDaemon: boolean;
  if (explicitInstallDaemon !== undefined) {
    installDaemon = explicitInstallDaemon;
  } else if (process.platform === "linux" && !systemdAvailable) {
    installDaemon = false;
  } else if (flow === "quickstart") {
    installDaemon = true;
  } else {
    installDaemon = await prompter.confirm({
      message: "安装网关服务（推荐）",
      initialValue: true,
    });
  }

  if (process.platform === "linux" && !systemdAvailable && installDaemon) {
    await prompter.note(
      "Systemd 用户服务不可用；跳过服务安装。请使用容器管理器或 `docker compose up -d`。",
      "网关服务",
    );
    installDaemon = false;
  }

  if (installDaemon) {
    const daemonRuntime =
      flow === "quickstart"
        ? DEFAULT_GATEWAY_DAEMON_RUNTIME
        : await prompter.select({
            message: "网关服务运行时",
            options: GATEWAY_DAEMON_RUNTIME_OPTIONS,
            initialValue: opts.daemonRuntime ?? DEFAULT_GATEWAY_DAEMON_RUNTIME,
          });
    if (flow === "quickstart") {
      await prompter.note(
        "快速开始使用 Node 作为网关服务（稳定 + 支持）。",
        "网关服务运行时",
      );
    }
    const service = resolveGatewayService();
    const loaded = await service.isLoaded({ env: process.env });
    if (loaded) {
      const action = await prompter.select({
        message: "网关服务已安装",
        options: [
          { value: "restart", label: "重启" },
          { value: "reinstall", label: "重新安装" },
          { value: "skip", label: "跳过" },
        ],
      });
      if (action === "restart") {
        await withWizardProgress(
          "网关服务",
          { doneMessage: "网关服务已重启。" },
          async (progress) => {
            progress.update("正在重启网关服务…");
            await service.restart({
              env: process.env,
              stdout: process.stdout,
            });
          },
        );
      } else if (action === "reinstall") {
        await withWizardProgress(
          "网关服务",
          { doneMessage: "网关服务已卸载。" },
          async (progress) => {
            progress.update("正在卸载网关服务…");
            await service.uninstall({ env: process.env, stdout: process.stdout });
          },
        );
      }
    }

    if (!loaded || (loaded && !(await service.isLoaded({ env: process.env })))) {
      const progress = prompter.progress("网关服务");
      let installError: string | null = null;
      try {
        progress.update("正在准备网关服务…");
        const { programArguments, workingDirectory, environment } = await buildGatewayInstallPlan({
          env: process.env,
          port: settings.port,
          token: settings.gatewayToken,
          runtime: daemonRuntime,
          warn: (message, title) => prompter.note(message, title),
          config: nextConfig,
        });

        progress.update("正在安装网关服务…");
        await service.install({
          env: process.env,
          stdout: process.stdout,
          programArguments,
          workingDirectory,
          environment,
        });
      } catch (err) {
        installError = err instanceof Error ? err.message : String(err);
      } finally {
        progress.stop(
          installError ? "网关服务安装失败。" : "网关服务已安装。",
        );
      }
      if (installError) {
        await prompter.note(`网关服务安装失败：${installError}`, "网关");
        await prompter.note(gatewayInstallErrorHint(), "网关");
      }
    }
  }

  if (!opts.skipHealth) {
    const probeLinks = resolveControlUiLinks({
      bind: nextConfig.gateway?.bind ?? "loopback",
      port: settings.port,
      customBindHost: nextConfig.gateway?.customBindHost,
      basePath: undefined,
    });
    // Daemon install/restart can briefly flap the WS; wait a bit so health check doesn't false-fail.
    await waitForGatewayReachable({
      url: probeLinks.wsUrl,
      token: settings.gatewayToken,
      deadlineMs: 15_000,
    });
    try {
      await healthCommand({ json: false, timeoutMs: 10_000 }, runtime);
    } catch (err) {
      runtime.error(formatHealthCheckFailure(err));
      await prompter.note(
        [
          "文档：",
          "https://docs.openclaw.ai/gateway/health",
          "https://docs.openclaw.ai/gateway/troubleshooting",
        ].join("\n"),
        "健康检查帮助",
      );
    }
  }

  const controlUiEnabled =
    nextConfig.gateway?.controlUi?.enabled ?? baseConfig.gateway?.controlUi?.enabled ?? true;
  if (!opts.skipUi && controlUiEnabled) {
    const controlUiAssets = await ensureControlUiAssetsBuilt(runtime);
    if (!controlUiAssets.ok && controlUiAssets.message) {
      runtime.error(controlUiAssets.message);
    }
  }

  await prompter.note(
    [
      "添加节点以获取额外功能：",
      "- macOS 应用（系统 + 通知）",
      "- iOS 应用（相机/画布）",
      "- Android 应用（相机/画布）",
    ].join("\n"),
    "可选应用",
  );

  const controlUiBasePath =
    nextConfig.gateway?.controlUi?.basePath ?? baseConfig.gateway?.controlUi?.basePath;
  const links = resolveControlUiLinks({
    bind: settings.bind,
    port: settings.port,
    customBindHost: settings.customBindHost,
    basePath: controlUiBasePath,
  });
  const tokenParam =
    settings.authMode === "token" && settings.gatewayToken
      ? `?token=${encodeURIComponent(settings.gatewayToken)}`
      : "";
  const authedUrl = `${links.httpUrl}${tokenParam}`;
  const gatewayProbe = await probeGatewayReachable({
    url: links.wsUrl,
    token: settings.authMode === "token" ? settings.gatewayToken : undefined,
    password: settings.authMode === "password" ? nextConfig.gateway?.auth?.password : "",
  });
  const gatewayStatusLine = gatewayProbe.ok
    ? "网关：可达"
    : `网关：未检测到${gatewayProbe.detail ? `（${gatewayProbe.detail}）` : ""}`;
  const bootstrapPath = path.join(
    resolveUserPath(options.workspaceDir),
    DEFAULT_BOOTSTRAP_FILENAME,
  );
  const hasBootstrap = await fs
    .access(bootstrapPath)
    .then(() => true)
    .catch(() => false);

  await prompter.note(
    [
      `Web UI：${links.httpUrl}`,
      tokenParam ? `Web UI（带令牌）：${authedUrl}` : undefined,
      `网关 WS：${links.wsUrl}`,
      gatewayStatusLine,
      "文档：https://docs.openclaw.ai/web/control-ui",
    ]
      .filter(Boolean)
      .join("\n"),
    "控制面板",
  );

  let controlUiOpened = false;
  let controlUiOpenHint: string | undefined;
  let seededInBackground = false;
  let hatchChoice: "tui" | "web" | "later" | null = null;

  if (!opts.skipUi && gatewayProbe.ok) {
    if (hasBootstrap) {
      await prompter.note(
        [
          "这是让您的代理成为您的定义性操作。",
          "请花点时间。",
          "您告诉它的越多，体验就越好。",
          '我们将发送："醒醒，我的朋友！"',
        ].join("\n"),
        "启动 TUI（最佳选择！）",
      );
    }

    await prompter.note(
      [
        "网关令牌：网关 + 控制面板的共享认证。",
        "存储在：~/.openclaw/openclaw.json（gateway.auth.token）或 OPENCLAW_GATEWAY_TOKEN。",
        "Web UI 在浏览器的 localStorage 中存储一个副本（openclaw.control.settings.v1）。",
        `随时获取带令牌的链接：${formatCliCommand("openclaw dashboard --no-open")}`,
      ].join("\n"),
      "令牌",
    );

    hatchChoice = await prompter.select({
      message: "您想如何孵化您的机器人？",
      options: [
        { value: "tui", label: "在 TUI 中孵化（推荐）" },
        { value: "web", label: "打开 Web UI" },
        { value: "later", label: "稍后再做" },
      ],
      initialValue: "tui",
    });

    if (hatchChoice === "tui") {
      await runTui({
        url: links.wsUrl,
        token: settings.authMode === "token" ? settings.gatewayToken : undefined,
        password: settings.authMode === "password" ? nextConfig.gateway?.auth?.password : "",
        // Safety: onboarding TUI should not auto-deliver to lastProvider/lastTo.
        deliver: false,
        message: hasBootstrap ? "Wake up, my friend!" : undefined,
      });
      if (settings.authMode === "token" && settings.gatewayToken) {
        seededInBackground = await openUrlInBackground(authedUrl);
      }
      if (seededInBackground) {
        await prompter.note(
          `Web UI 已在后台初始化。稍后打开：${formatCliCommand(
            "openclaw dashboard --no-open",
          )}`,
          "Web UI",
        );
      }
    } else if (hatchChoice === "web") {
      const browserSupport = await detectBrowserOpenSupport();
      if (browserSupport.ok) {
        controlUiOpened = await openUrl(authedUrl);
        if (!controlUiOpened) {
          controlUiOpenHint = formatControlUiSshHint({
            port: settings.port,
            basePath: controlUiBasePath,
            token: settings.gatewayToken,
          });
        }
      } else {
        controlUiOpenHint = formatControlUiSshHint({
          port: settings.port,
          basePath: controlUiBasePath,
          token: settings.gatewayToken,
        });
      }
      await prompter.note(
        [
          `仪表板链接（带令牌）：${authedUrl}`,
          controlUiOpened
            ? "已在浏览器中打开。保持该标签页以控制 OpenClaw。"
            : "在此机器的浏览器中复制/粘贴此 URL 以控制 OpenClaw。",
          controlUiOpenHint,
        ]
          .filter(Boolean)
          .join("\n"),
        "仪表板就绪",
      );
    } else {
      await prompter.note(
        `当您准备好时：${formatCliCommand("openclaw dashboard --no-open")}`,
        "稍后",
      );
    }
  } else if (opts.skipUi) {
    await prompter.note("跳过控制面板/TUI 提示。", "控制面板");
  }

  await prompter.note(
    [
      "备份您的代理工作区。",
      "文档：https://docs.openclaw.ai/concepts/agent-workspace",
    ].join("\n"),
    "工作区备份",
  );

  await prompter.note(
    "在您的计算机上运行代理是有风险的 — 加强您的设置：https://docs.openclaw.ai/security",
    "安全",
  );

  const shouldOpenControlUi =
    !opts.skipUi &&
    settings.authMode === "token" &&
    Boolean(settings.gatewayToken) &&
    hatchChoice === null;
  if (shouldOpenControlUi) {
    const browserSupport = await detectBrowserOpenSupport();
    if (browserSupport.ok) {
      controlUiOpened = await openUrl(authedUrl);
      if (!controlUiOpened) {
        controlUiOpenHint = formatControlUiSshHint({
          port: settings.port,
          basePath: controlUiBasePath,
          token: settings.gatewayToken,
        });
      }
    } else {
      controlUiOpenHint = formatControlUiSshHint({
        port: settings.port,
        basePath: controlUiBasePath,
        token: settings.gatewayToken,
      });
    }

    await prompter.note(
      [
        `仪表板链接（带令牌）：${authedUrl}`,
        controlUiOpened
          ? "已在浏览器中打开。保持该标签页以控制 OpenClaw。"
          : "在此机器的浏览器中复制/粘贴此 URL 以控制 OpenClaw。",
        controlUiOpenHint,
      ]
        .filter(Boolean)
        .join("\n"),
      "仪表板就绪",
    );
  }

  const webSearchKey = (nextConfig.tools?.web?.search?.apiKey ?? "").trim();
  const webSearchEnv = (process.env.BRAVE_API_KEY ?? "").trim();
  const hasWebSearchKey = Boolean(webSearchKey || webSearchEnv);
  await prompter.note(
    hasWebSearchKey
      ? [
          "Web search is enabled, so your agent can look things up online when needed.",
          "",
          webSearchKey
            ? "API key: stored in config (tools.web.search.apiKey)."
            : "API key: provided via BRAVE_API_KEY env var (Gateway environment).",
          "Docs: https://docs.openclaw.ai/tools/web",
        ].join("\n")
      : [
          "If you want your agent to be able to search the web, you’ll need an API key.",
          "",
          "OpenClaw uses Brave Search for the `web_search` tool. Without a Brave Search API key, web search won’t work.",
          "",
          "Set it up interactively:",
          `- Run: ${formatCliCommand("openclaw configure --section web")}`,
          "- Enable web_search and paste your Brave Search API key",
          "",
          "Alternative: set BRAVE_API_KEY in the Gateway environment (no config changes).",
          "Docs: https://docs.openclaw.ai/tools/web",
        ].join("\n"),
    "Web search (optional)",
  );

  await prompter.note(
    'What now: https://openclaw.ai/showcase ("What People Are Building").',
    "What now",
  );

  await prompter.outro(
    controlUiOpened
      ? "Onboarding complete. Dashboard opened with your token; keep that tab to control OpenClaw."
      : seededInBackground
        ? "Onboarding complete. Web UI seeded in the background; open it anytime with the tokenized link above."
        : "Onboarding complete. Use the tokenized dashboard link above to control OpenClaw.",
  );
}
