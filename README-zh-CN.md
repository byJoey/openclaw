# 🦞 OpenClaw — 个人 AI 助手（中文版）

<p align="center">
  <img src="README-header.png" alt="OpenClaw" width="600">
</p>

<p align="center">
  <strong>您的个人 AI 助手。任何操作系统。任何平台。龙虾之道。🦞</strong>
</p>

<p align="center">
  <a href="https://openclaw.ai">官网</a> · 
  <a href="https://docs.openclaw.ai">文档</a> · 
  <a href="https://discord.gg/openclaw">Discord</a>
</p>

---

## 🌏 关于此 Fork

这是 [OpenClaw](https://github.com/openclaw/openclaw) 的**中文本地化版本**，由 [@byJoey](https://github.com/byJoey) 维护。

### 本地化内容

- ✅ 安装脚本 (`install.sh`) 完整中文化
- ✅ 引导设置 (onboarding) 界面中文化
- ✅ 安全警告、频道配置、网关设置等交互文本
- ✅ Telegram/WhatsApp/Discord 等频道描述
- ✅ 趣味标语 (Taglines) 中文翻译
- ✅ 节日祝福语中文化

---

## 📦 安装

### 方式一：使用中文安装脚本

```bash
# 克隆此仓库
git clone https://github.com/byJoey/openclaw.git
cd openclaw

# 运行中文安装脚本
bash install.sh
```

### 方式二：从源码构建

**运行时要求：Node ≥22**

```bash
# 克隆仓库
git clone https://github.com/byJoey/openclaw.git
cd openclaw

# 安装依赖
pnpm install

# 构建 UI
pnpm ui:build

# 构建项目
pnpm build

# 运行引导设置
pnpm openclaw onboard --install-daemon
```

---

## 🚀 快速开始

```bash
# 启动引导设置向导（中文界面）
openclaw onboard --install-daemon

# 启动网关
openclaw gateway --port 18789 --verbose

# 发送消息
openclaw message send --to +1234567890 --message "来自 OpenClaw 的问候"

# 与助手对话
openclaw agent --message "帮我列一个任务清单" --thinking high
```

---

## 📱 支持的频道

| 频道 | 状态 | 说明 |
|------|------|------|
| **Telegram** | ✅ 推荐 | 最简单的入门方式 — 使用 @BotFather 注册机器人 |
| **WhatsApp** | ✅ 支持 | 使用您自己的号码；建议使用单独的手机 + eSIM |
| **Discord** | ✅ 支持 | 目前支持非常好 |
| **Google Chat** | ✅ 支持 | 带有 HTTP webhook 的 Google Workspace Chat 应用 |
| **Slack** | ✅ 支持 | Socket Mode |
| **Signal** | ✅ 支持 | signal-cli 链接设备；需要更多设置 |
| **iMessage** | 🚧 开发中 | 仍在开发中 |
| **Microsoft Teams** | 📦 插件 | 安装插件以启用 |
| **Matrix** | 📦 插件 | 安装插件以启用 |
| **Nostr** | 📦 插件 | 去中心化协议；通过 NIP-04 加密 DM |

---

## 🔐 安全须知

> ⚠️ **安全警告 — 请仔细阅读**

OpenClaw 是一个业余项目，仍处于测试阶段。请注意：

- 如果启用了工具，此机器人可以读取文件并执行操作
- 恶意提示可能会诱骗它执行不安全的操作
- 如果您不熟悉基本的安全和访问控制，请不要运行 OpenClaw

### 推荐的安全配置

- 配对/允许列表 + 提及触发
- 沙箱 + 最小权限工具
- 将密钥保存在代理无法访问的文件系统之外
- 对任何带有工具或不受信任收件箱的机器人使用最强大的可用模型

### 定期运行安全审计

```bash
openclaw security audit --deep
openclaw security audit --fix
```

---

## 📚 文档链接

- [入门指南](https://docs.openclaw.ai/start/getting-started)
- [频道配置](https://docs.openclaw.ai/channels)
- [安全指南](https://docs.openclaw.ai/gateway/security)
- [故障排除](https://docs.openclaw.ai/gateway/troubleshooting)
- [常见问题](https://docs.openclaw.ai/start/faq)

---

## 🛠️ 开发

### 开发模式

```bash
# 监听模式（自动重载）
pnpm gateway:watch

# 运行测试
pnpm test

# 代码检查
pnpm lint
```

### 项目结构

```
openclaw/
├── src/
│   ├── wizard/          # 引导设置向导
│   ├── channels/        # 频道插件
│   ├── commands/        # CLI 命令
│   ├── gateway/         # 网关核心
│   ├── i18n/            # 国际化（中文翻译）
│   └── ...
├── ui/                  # Web UI
├── apps/                # 移动应用
├── install.sh           # 中文安装脚本
└── README-zh-CN.md      # 本文档
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 翻译贡献

如果您发现翻译问题或想改进翻译，请：

1. Fork 此仓库
2. 修改 `src/i18n/zh-CN.ts` 或相关文件
3. 提交 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 🙏 致谢

- [OpenClaw](https://github.com/openclaw/openclaw) - 原始项目
- Peter Steinberger 和社区贡献者们

---

<p align="center">
  <strong>🦞 OpenClaw 中文版 — 让 AI 助手更懂中文用户</strong>
</p>
