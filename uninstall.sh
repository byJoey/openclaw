#!/usr/bin/env bash
# OpenClaw 卸载脚本
# 一键卸载 OpenClaw 及其所有相关文件

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SUCCESS="${GREEN}"
WARN="${YELLOW}"
ERROR="${RED}"
INFO="${BLUE}"

echo ""
echo -e "${INFO}╔═══════════════════════════════════════╗${NC}"
echo -e "${INFO}║     OpenClaw 卸载程序                 ║${NC}"
echo -e "${INFO}╚═══════════════════════════════════════╝${NC}"
echo ""

# 检测是否为交互模式
FORCE_YES=${OPENCLAW_UNINSTALL_YES:-0}

confirm() {
    local prompt="$1"
    if [[ "$FORCE_YES" == "1" ]]; then
        return 0
    fi
    echo -ne "${WARN}?${NC} ${prompt} [y/N] "
    read -r answer
    case "$answer" in
        [yY]|[yY][eE][sS]) return 0 ;;
        *) return 1 ;;
    esac
}

removed_something=0

# 1. 卸载 npm 全局包
echo -e "${INFO}[1/6]${NC} 检查 npm 全局安装..."
if npm list -g openclaw &>/dev/null; then
    echo -e "${WARN}→${NC} 发现 npm 全局安装的 openclaw"
    if confirm "卸载 npm 全局包 openclaw?"; then
        npm uninstall -g openclaw 2>/dev/null || true
        echo -e "${SUCCESS}✓${NC} 已卸载 npm 全局包"
        removed_something=1
    fi
else
    echo -e "${INFO}i${NC} 未发现 npm 全局安装"
fi

# 2. 清理 npm 全局目录中的残留
echo ""
echo -e "${INFO}[2/6]${NC} 检查 npm 全局目录残留..."
npm_root="$(npm root -g 2>/dev/null || true)"
if [[ -n "$npm_root" ]]; then
    cleaned=0
    if [[ -d "$npm_root/openclaw" ]]; then
        if confirm "删除 $npm_root/openclaw?"; then
            rm -rf "$npm_root/openclaw"
            echo -e "${SUCCESS}✓${NC} 已删除 $npm_root/openclaw"
            cleaned=1
            removed_something=1
        fi
    fi
    # 清理 .openclaw-* 临时目录
    for dir in "$npm_root"/.openclaw-*; do
        if [[ -d "$dir" ]]; then
            rm -rf "$dir"
            echo -e "${SUCCESS}✓${NC} 已删除临时目录 $dir"
            cleaned=1
            removed_something=1
        fi
    done
    if [[ $cleaned -eq 0 ]]; then
        echo -e "${INFO}i${NC} npm 全局目录无残留"
    fi
else
    echo -e "${INFO}i${NC} 无法获取 npm 全局目录"
fi

# 3. 删除二进制文件/符号链接
echo ""
echo -e "${INFO}[3/6]${NC} 检查 openclaw 二进制文件..."
bin_locations=(
    "$HOME/.local/bin/openclaw"
    "$HOME/.npm-global/bin/openclaw"
    "/usr/local/bin/openclaw"
    "/opt/homebrew/bin/openclaw"
)

# 添加 npm 全局 bin 目录
npm_bin="$(npm prefix -g 2>/dev/null || true)/bin"
if [[ -n "$npm_bin" && ! " ${bin_locations[*]} " =~ " ${npm_bin}/openclaw " ]]; then
    bin_locations+=("$npm_bin/openclaw")
fi

for bin_path in "${bin_locations[@]}"; do
    if [[ -e "$bin_path" || -L "$bin_path" ]]; then
        echo -e "${WARN}→${NC} 发现 $bin_path"
        if confirm "删除 $bin_path?"; then
            rm -f "$bin_path"
            echo -e "${SUCCESS}✓${NC} 已删除 $bin_path"
            removed_something=1
        fi
    fi
done

# 4. 删除 git 检出目录
echo ""
echo -e "${INFO}[4/6]${NC} 检查 git 检出目录..."
git_dirs=(
    "$HOME/openclaw"
    "${OPENCLAW_GIT_DIR:-}"
)

for git_dir in "${git_dirs[@]}"; do
    if [[ -n "$git_dir" && -d "$git_dir" ]]; then
        if [[ -f "$git_dir/package.json" ]] && grep -q '"name".*"openclaw"' "$git_dir/package.json" 2>/dev/null; then
            echo -e "${WARN}→${NC} 发现 git 检出目录：$git_dir"
            if confirm "删除整个目录 $git_dir?"; then
                rm -rf "$git_dir"
                echo -e "${SUCCESS}✓${NC} 已删除 $git_dir"
                removed_something=1
            fi
        fi
    fi
done

# 5. 删除配置和数据目录
echo ""
echo -e "${INFO}[5/6]${NC} 检查配置和数据目录..."
config_dirs=(
    "$HOME/.openclaw"
    "$HOME/.clawdbot"
    "$HOME/.moltbot"
    "$HOME/.moldbot"
)

for config_dir in "${config_dirs[@]}"; do
    if [[ -d "$config_dir" ]]; then
        echo -e "${WARN}→${NC} 发现配置目录：$config_dir"
        if confirm "删除 $config_dir（包含配置和数据）?"; then
            rm -rf "$config_dir"
            echo -e "${SUCCESS}✓${NC} 已删除 $config_dir"
            removed_something=1
        fi
    fi
done

# 6. 清理 systemd 服务（如果存在）
echo ""
echo -e "${INFO}[6/6]${NC} 检查 systemd 服务..."
if command -v systemctl &>/dev/null; then
    for service in openclaw openclaw-gateway; do
        if systemctl --user is-enabled "$service" &>/dev/null 2>&1; then
            echo -e "${WARN}→${NC} 发现 systemd 用户服务：$service"
            if confirm "停止并禁用 $service 服务?"; then
                systemctl --user stop "$service" 2>/dev/null || true
                systemctl --user disable "$service" 2>/dev/null || true
                echo -e "${SUCCESS}✓${NC} 已停止并禁用 $service"
                removed_something=1
            fi
        fi
    done
    
    # 删除 systemd 服务文件
    systemd_dir="$HOME/.config/systemd/user"
    for service_file in "$systemd_dir/openclaw"*.service; do
        if [[ -f "$service_file" ]]; then
            echo -e "${WARN}→${NC} 发现服务文件：$service_file"
            if confirm "删除 $service_file?"; then
                rm -f "$service_file"
                systemctl --user daemon-reload 2>/dev/null || true
                echo -e "${SUCCESS}✓${NC} 已删除 $service_file"
                removed_something=1
            fi
        fi
    done
else
    echo -e "${INFO}i${NC} 系统不使用 systemd"
fi

# 总结
echo ""
echo -e "${INFO}═══════════════════════════════════════${NC}"
if [[ $removed_something -eq 1 ]]; then
    echo -e "${SUCCESS}✓${NC} 卸载完成！"
    echo ""
    echo -e "${INFO}提示：${NC}"
    echo "  - 如果您修改过 ~/.bashrc 或 ~/.zshrc 中的 PATH，请手动检查"
    echo "  - 运行 'hash -r'（bash）或 'rehash'（zsh）刷新命令缓存"
else
    echo -e "${INFO}i${NC} 未发现需要卸载的内容，或所有操作已跳过。"
fi
echo ""
