import type { OpenClawConfig } from "../config/config.js";
import { resolveAgentWorkspaceDir, resolveDefaultAgentId } from "../agents/agent-scope.js";
import { buildWorkspaceSkillStatus } from "../agents/skills-status.js";
import { loadOpenClawPlugins } from "../plugins/loader.js";
import { note } from "../terminal/note.js";
import { detectLegacyWorkspaceDirs, formatLegacyWorkspaceWarning } from "./doctor-workspace.js";

export function noteWorkspaceStatus(cfg: OpenClawConfig) {
  const workspaceDir = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
  const legacyWorkspace = detectLegacyWorkspaceDirs({ workspaceDir });
  if (legacyWorkspace.legacyDirs.length > 0) {
    note(formatLegacyWorkspaceWarning(legacyWorkspace), "额外工作区");
  }

  const skillsReport = buildWorkspaceSkillStatus(workspaceDir, { config: cfg });
  note(
    [
      `可用：${skillsReport.skills.filter((s) => s.eligible).length}`,
      `缺少依赖：${
        skillsReport.skills.filter((s) => !s.eligible && !s.disabled && !s.blockedByAllowlist)
          .length
      }`,
      `被允许列表阻止：${skillsReport.skills.filter((s) => s.blockedByAllowlist).length}`,
    ].join("\n"),
    "技能状态",
  );

  const pluginRegistry = loadOpenClawPlugins({
    config: cfg,
    workspaceDir,
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
    },
  });
  if (pluginRegistry.plugins.length > 0) {
    const loaded = pluginRegistry.plugins.filter((p) => p.status === "loaded");
    const disabled = pluginRegistry.plugins.filter((p) => p.status === "disabled");
    const errored = pluginRegistry.plugins.filter((p) => p.status === "error");

    const lines = [
      `已加载：${loaded.length}`,
      `已禁用：${disabled.length}`,
      `错误：${errored.length}`,
      errored.length > 0
        ? `- ${errored
            .slice(0, 10)
            .map((p) => p.id)
            .join("\n- ")}${errored.length > 10 ? "\n- ..." : ""}`
        : null,
    ].filter((line): line is string => Boolean(line));

    note(lines.join("\n"), "插件");
  }
  if (pluginRegistry.diagnostics.length > 0) {
    const lines = pluginRegistry.diagnostics.map((diag) => {
      const prefix = diag.level.toUpperCase();
      const plugin = diag.pluginId ? ` ${diag.pluginId}` : "";
      const source = diag.source ? ` (${diag.source})` : "";
      return `- ${prefix}${plugin}: ${diag.message}${source}`;
    });
    note(lines.join("\n"), "插件诊断");
  }

  return { workspaceDir };
}
