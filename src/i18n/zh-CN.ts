/**
 * OpenClaw 中文本地化文件
 * Chinese (Simplified) localization for OpenClaw
 */

export const zh_CN = {
  // 通用
  common: {
    yes: "是",
    no: "否",
    skip: "跳过",
    cancel: "取消",
    continue: "继续",
    finished: "完成",
    done: "完成",
    back: "返回",
    next: "下一步",
    save: "保存",
    delete: "删除",
    update: "更新",
    enable: "启用",
    disable: "禁用",
    install: "安装",
    configure: "配置",
    default: "默认",
    custom: "自定义",
    none: "无",
    all: "全部",
    error: "错误",
    warning: "警告",
    success: "成功",
    info: "信息",
  },

  // 引导设置
  onboarding: {
    title: "OpenClaw 引导设置",
    intro: "OpenClaw 引导设置",
    
    // 安全警告
    security: {
      title: "安全",
      warning: "安全警告 — 请仔细阅读。",
      content: [
        "安全警告 — 请仔细阅读。",
        "",
        "OpenClaw 是一个业余项目，仍处于测试阶段。请注意可能存在问题。",
        "如果启用了工具，此机器人可以读取文件并执行操作。",
        "恶意提示可能会诱骗它执行不安全的操作。",
        "",
        "如果您不熟悉基本的安全和访问控制，请不要运行 OpenClaw。",
        "在启用工具或将其暴露到互联网之前，请寻求有经验的人帮助。",
        "",
        "推荐的基本设置：",
        "- 配对/允许列表 + 提及触发。",
        "- 沙箱 + 最小权限工具。",
        "- 将密钥保存在代理无法访问的文件系统之外。",
        "- 对任何带有工具或不受信任收件箱的机器人使用最强大的可用模型。",
        "",
        "定期运行：",
        "openclaw security audit --deep",
        "openclaw security audit --fix",
        "",
        "必读：https://docs.openclaw.ai/gateway/security",
      ].join("\n"),
      confirm: "我理解这是强大的且具有固有风险。继续？",
      notAccepted: "风险未接受",
    },

    // 模式选择
    mode: {
      title: "引导模式",
      quickstart: "快速开始",
      quickstartHint: "稍后通过 `openclaw configure` 配置详细信息。",
      manual: "手动配置",
      manualHint: "配置端口、网络、Tailscale 和认证选项。",
      invalidFlow: "无效的 --flow（使用 quickstart、manual 或 advanced）。",
    },

    // 配置处理
    config: {
      existingDetected: "检测到现有配置",
      invalid: "无效配置",
      handling: "配置处理",
      keepExisting: "使用现有值",
      updateValues: "更新值",
      reset: "重置",
      resetScope: "重置范围",
      configOnly: "仅配置",
      configCredsessions: "配置 + 凭据 + 会话",
      fullReset: "完全重置（配置 + 凭据 + 会话 + 工作区）",
      issues: "配置问题",
      invalidRun: "配置无效。运行 `openclaw doctor` 修复它，然后重新运行引导设置。",
    },

    // 网关设置
    gateway: {
      title: "网关",
      port: "网关端口",
      bind: "网关绑定",
      auth: "网关认证",
      tailscale: "Tailscale 暴露",
      loopback: "回环（127.0.0.1）",
      lan: "局域网",
      auto: "自动",
      customIp: "自定义 IP",
      tailnet: "Tailnet（Tailscale IP）",
      token: "令牌（默认）",
      password: "密码",
      off: "关闭",
      serve: "服务",
      funnel: "漏斗",
      directToChannels: "直接连接到聊天频道。",
      keepingSettings: "保留您当前的网关设置：",
      setupQuestion: "您想设置什么？",
      local: "本地网关（此机器）",
      localReachable: "网关可达",
      localNotDetected: "未检测到网关",
      remote: "远程网关（仅信息）",
      remoteNotConfigured: "尚未配置远程 URL",
      remoteReachable: "网关可达",
      remoteUnreachable: "已配置但无法访问",
      remoteConfigured: "远程网关已配置。",
    },

    // 工作区
    workspace: {
      title: "工作区",
      directory: "工作区目录",
    },

    // 模型/认证
    model: {
      title: "模型/认证提供商",
      default: "默认模型",
    },

    // 频道
    channels: {
      title: "频道状态",
      howWork: "频道工作原理",
      howWorkContent: [
        "DM 安全：默认为配对；未知 DM 会收到配对码。",
        "批准命令：openclaw pairing approve <channel> <code>",
        '公开 DM 需要 dmPolicy="open" + allowFrom=["*"]。',
        '多用户 DM：设置 session.dmScope="per-channel-peer"（或多账户频道使用 "per-account-channel-peer"）来隔离会话。',
      ].join("\n"),
      notConfigured: "未配置",
      configured: "已配置",
      pluginDisabled: "插件已禁用",
      installPlugin: "安装插件以启用",
      selectChannel: "选择频道",
      selectChannelQuickstart: "选择频道（快速开始）",
      skipForNow: "暂时跳过",
      addLater: "您可以稍后通过 `openclaw channels add` 添加频道",
      configureNow: "现在配置聊天频道？",
      alreadyConfigured: "已配置。您想做什么？",
      modifySettings: "修改设置",
      disableKeepConfig: "禁用（保留配置）",
      deleteConfig: "删除配置",
      skipLeaveAsIs: "跳过（保持原样）",
      selectedChannels: "已选择的频道",

      // 具体频道
      telegram: {
        label: "Telegram（Bot API）",
        blurb: "最简单的入门方式 — 使用 @BotFather 注册一个机器人并开始使用。",
        tokenTitle: "Telegram 机器人令牌",
        tokenInstructions: [
          "1) 打开 Telegram 并与 @BotFather 聊天",
          "2) 运行 /newbot（或 /mybots）",
          "3) 复制令牌（类似 123456:ABC...）",
          "提示：您也可以在环境变量中设置 TELEGRAM_BOT_TOKEN。",
        ].join("\n"),
        enterToken: "输入 Telegram 机器人令牌",
      },
      whatsapp: {
        label: "WhatsApp",
        blurb: "使用您自己的号码；建议使用单独的手机 + eSIM。",
      },
      discord: {
        label: "Discord",
        blurb: "目前支持非常好。",
      },
      googlechat: {
        label: "Google Chat",
        blurb: "带有 HTTP webhook 的 Google Workspace Chat 应用。",
      },
      slack: {
        label: "Slack",
        blurb: "支持（Socket Mode）。",
      },
      signal: {
        label: "Signal",
        blurb: "signal-cli 链接设备；需要更多设置。",
      },
      imessage: {
        label: "iMessage",
        blurb: "这仍在开发中。",
      },
      nostr: {
        label: "Nostr",
        blurb: "去中心化协议；通过 NIP-04 加密 DM。",
      },
      msteams: {
        label: "Microsoft Teams",
        blurb: "Bot Framework；企业支持。",
      },
      mattermost: {
        label: "Mattermost",
        blurb: "自托管的 Slack 风格聊天；安装插件以启用。",
      },
      nextcloudtalk: {
        label: "Nextcloud Talk",
        blurb: "通过 Nextcloud Talk webhook 机器人进行自托管聊天。",
      },
      matrix: {
        label: "Matrix",
        blurb: "开放协议；安装插件以启用。",
      },
      bluebubbles: {
        label: "BlueBubbles",
        blurb: "通过 BlueBubbles mac 应用 + REST API 使用 iMessage。",
      },
      line: {
        label: "LINE",
        blurb: "LINE Messaging API 机器人，面向日本/台湾/泰国市场。",
      },
      zalo: {
        label: "Zalo",
        blurb: "面向越南的消息平台，带有 Bot API。",
      },
      zalopersonal: {
        label: "Zalo 个人版",
        blurb: "通过二维码登录的 Zalo 个人账户。",
      },
      tlon: {
        label: "Tlon",
        blurb: "Urbit 上的去中心化消息；安装插件以启用。",
      },
    },

    // DM 策略
    dmPolicy: {
      title: "DM 访问策略",
      configure: "现在配置 DM 访问策略？（默认：配对）",
      pairing: "配对（推荐）",
      allowlist: "允许列表（仅特定用户）",
      open: "开放（公开入站 DM）",
      disabled: "禁用（忽略 DM）",
      pairingDesc: "默认：配对（未知 DM 会收到配对码）。",
    },

    // 技能
    skills: {
      title: "技能",
      skipping: "跳过技能设置。",
    },

    // Shell 补全
    shell: {
      installCompletion: "安装 shell 补全脚本？",
    },

    // 完成
    finalize: {
      setupCancelled: "设置已取消。",
    },
  },

  // 频道状态
  channelStatus: {
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    discord: "Discord",
    googlechat: "Google Chat",
    slack: "Slack",
    signal: "Signal",
    imessage: "iMessage",
    msteams: "Microsoft Teams",
    mattermost: "Mattermost",
    nextcloudtalk: "Nextcloud Talk",
    matrix: "Matrix",
    bluebubbles: "BlueBubbles",
    line: "LINE",
    zalo: "Zalo",
    zalopersonal: "Zalo 个人版",
    nostr: "Nostr",
    tlon: "Tlon",
  },
};

export default zh_CN;
