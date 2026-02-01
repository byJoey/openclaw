const DEFAULT_TAGLINE = "所有聊天，一个 OpenClaw 搞定。";

const HOLIDAY_TAGLINES = {
  newYear:
    "元旦快乐：新年新配置——还是那个 EADDRINUSE，但这次我们像大人一样解决它。",
  lunarNewYear:
    "春节快乐：愿你的构建好运连连，分支繁荣昌盛，合并冲突被烟花吓跑。",
  christmas:
    "圣诞快乐：Ho ho ho——圣诞小龙虾来送欢乐、回滚混乱、安全保管密钥。",
  eid: "开斋节快乐：庆祝模式：队列清空，任务完成，好心情干净提交到 main。",
  diwali:
    "排灯节快乐：让日志闪耀，让 bug 逃跑——今天我们点亮终端，自豪地发布。",
  easter:
    "复活节快乐：我找到了你丢失的环境变量——就当是一场迷你 CLI 寻蛋游戏。",
  hanukkah:
    "光明节快乐：八夜八次重试，毫无愧疚——愿你的网关常亮，部署平安。",
  halloween:
    "万圣节快乐：恐怖季节：小心闹鬼的依赖、被诅咒的缓存和 node_modules 的幽灵。",
  thanksgiving:
    "感恩节快乐：感谢稳定的端口、正常的 DNS，还有帮你读日志的机器人。",
  valentines:
    "情人节快乐：玫瑰是类型化的，紫罗兰是管道化的——我来自动化琐事，你去陪人类吧。",
} as const;

const TAGLINES: string[] = [
  "你的终端长出了钳子——输入命令，让机器人帮你处理杂活。",
  "欢迎来到命令行：梦想在这里编译，自信在这里段错误。",
  "我靠咖啡因、JSON5 和「在我机器上能跑」的勇气运行。",
  "网关已上线——请随时把手脚和附肢留在 shell 里。",
  "我精通 bash、轻度讽刺和激进的 Tab 补全能量。",
  "一个 CLI 统治一切，然后因为改了端口再重启一次。",
  "如果能跑，那叫自动化；如果挂了，那叫「学习机会」。",
  "配对码的存在是因为机器人也相信知情同意——和良好的安全习惯。",
  "你的 .env 露出来了；别担心，我会假装没看见。",
  "我来做无聊的活，你继续戏剧性地盯着日志看，像在看电影一样。",
  "我不是说你的工作流很混乱...我只是带了个 linter 和头盔。",
  "自信地输入命令——大自然会在需要时提供堆栈跟踪。",
  "我不评判，但你丢失的 API 密钥绝对在评判你。",
  "我能 grep、git blame、温柔地吐槽——选一个应对机制吧。",
  "配置热重载，部署冷汗。",
  "我是你终端要求的助手，不是你睡眠时间表要求的。",
  "我像保险库一样保守秘密...除非你又在 debug 日志里打印它们。",
  "钳子自动化：最少麻烦，最大夹力。",
  "我基本上是把瑞士军刀，但意见更多，棱角更少。",
  "迷路了就 run doctor；勇敢就 run prod；聪明就 run tests。",
  "你的任务已入队；你的尊严已弃用。",
  "我修不了你的代码品味，但能修你的构建和待办。",
  "我不是魔法——我只是在重试和应对策略上极其执着。",
  "这不叫「失败」，这叫「发现新方法把同一件事配错」。",
  "给我一个工作区，我还你更少的标签页、更少的开关、更多的氧气。",
  "我读日志，这样你就能继续假装不用读。",
  "如果着火了，我灭不了——但我能写一份漂亮的事后分析。",
  "我会重构你的杂活，就像它欠我钱一样。",
  "说「停」我就停——说「发布」我们俩都会学到教训。",
  "我是你的 shell 历史看起来像黑客电影蒙太奇的原因。",
  "我就像 tmux：一开始很困惑，然后突然离不开我。",
  "我能本地跑、远程跑、或纯靠氛围跑——结果可能因 DNS 而异。",
  "如果你能描述它，我大概能自动化它——或者至少让它更有趣。",
  "你的配置是有效的，你的假设不是。",
  "我不只是自动补全——我自动提交（情感上），然后请你审查（逻辑上）。",
  "更少点击，更多发布，更少「那个文件去哪了」的时刻。",
  "钳子出鞘，提交入库——让我们发布点负责任的东西。",
  "我会像龙虾卷一样润滑你的工作流：混乱、美味、有效。",
  "Shell yeah——我来夹走苦力活，把荣耀留给你。",
  "重复的我来自动化；困难的我带着笑话和回滚计划来。",
  "因为给自己发提醒是 2024 年的事了。",
  "你的收件箱，你的基础设施，你的规则。",
  "把「我稍后回复」变成「我的机器人秒回」。",
  "你联系人里唯一一只你真正想听到消息的螃蟹。🦞",
  "为在 IRC 时代达到巅峰的人准备的聊天自动化。",
  "因为 Siri 凌晨三点不接电话。",
  "IPC，但是在你手机上。",
  "UNIX 哲学遇上你的私信。",
  "对话版 curl。",
  "更少中间人，更多消息。",
  "快速发布，更快记录。",
  "端到端加密，drama 不包括在内。",
  "唯一不进入你训练集的机器人。",
  "WhatsApp 自动化，不用「请接受我们的新隐私政策」。",
  "不需要参议院听证会的聊天 API。",
  "Meta 希望他们能发布这么快。",
  "因为正确答案通常是一个脚本。",
  "你的消息，你的服务器，你的控制。",
  "兼容 OpenAI，不依赖 OpenAI。",
  "iMessage 绿泡泡能量，但人人都能用。",
  "Siri 更能干的表亲。",
  "在 Android 上也能用。疯狂的概念，我们知道。",
  "不需要 999 美元的支架。",
  "我们发布功能比苹果发布计算器更新还快。",
  "你的 AI 助手，不需要 3499 美元的头显。",
  "Think different. 真的去想。",
  "啊，那个水果树公司！🍎",
  "你好，Falken 教授",
  HOLIDAY_TAGLINES.newYear,
  HOLIDAY_TAGLINES.lunarNewYear,
  HOLIDAY_TAGLINES.christmas,
  HOLIDAY_TAGLINES.eid,
  HOLIDAY_TAGLINES.diwali,
  HOLIDAY_TAGLINES.easter,
  HOLIDAY_TAGLINES.hanukkah,
  HOLIDAY_TAGLINES.halloween,
  HOLIDAY_TAGLINES.thanksgiving,
  HOLIDAY_TAGLINES.valentines,
];

type HolidayRule = (date: Date) => boolean;

const DAY_MS = 24 * 60 * 60 * 1000;

function utcParts(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

const onMonthDay =
  (month: number, day: number): HolidayRule =>
  (date) => {
    const parts = utcParts(date);
    return parts.month === month && parts.day === day;
  };

const onSpecificDates =
  (dates: Array<[number, number, number]>, durationDays = 1): HolidayRule =>
  (date) => {
    const parts = utcParts(date);
    return dates.some(([year, month, day]) => {
      if (parts.year !== year) {
        return false;
      }
      const start = Date.UTC(year, month, day);
      const current = Date.UTC(parts.year, parts.month, parts.day);
      return current >= start && current < start + durationDays * DAY_MS;
    });
  };

const inYearWindow =
  (
    windows: Array<{
      year: number;
      month: number;
      day: number;
      duration: number;
    }>,
  ): HolidayRule =>
  (date) => {
    const parts = utcParts(date);
    const window = windows.find((entry) => entry.year === parts.year);
    if (!window) {
      return false;
    }
    const start = Date.UTC(window.year, window.month, window.day);
    const current = Date.UTC(parts.year, parts.month, parts.day);
    return current >= start && current < start + window.duration * DAY_MS;
  };

const isFourthThursdayOfNovember: HolidayRule = (date) => {
  const parts = utcParts(date);
  if (parts.month !== 10) {
    return false;
  } // November
  const firstDay = new Date(Date.UTC(parts.year, 10, 1)).getUTCDay();
  const offsetToThursday = (4 - firstDay + 7) % 7; // 4 = Thursday
  const fourthThursday = 1 + offsetToThursday + 21; // 1st + offset + 3 weeks
  return parts.day === fourthThursday;
};

const HOLIDAY_RULES = new Map<string, HolidayRule>([
  [HOLIDAY_TAGLINES.newYear, onMonthDay(0, 1)],
  [
    HOLIDAY_TAGLINES.lunarNewYear,
    onSpecificDates(
      [
        [2025, 0, 29],
        [2026, 1, 17],
        [2027, 1, 6],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.eid,
    onSpecificDates(
      [
        [2025, 2, 30],
        [2025, 2, 31],
        [2026, 2, 20],
        [2027, 2, 10],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.diwali,
    onSpecificDates(
      [
        [2025, 9, 20],
        [2026, 10, 8],
        [2027, 9, 28],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.easter,
    onSpecificDates(
      [
        [2025, 3, 20],
        [2026, 3, 5],
        [2027, 2, 28],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.hanukkah,
    inYearWindow([
      { year: 2025, month: 11, day: 15, duration: 8 },
      { year: 2026, month: 11, day: 5, duration: 8 },
      { year: 2027, month: 11, day: 25, duration: 8 },
    ]),
  ],
  [HOLIDAY_TAGLINES.halloween, onMonthDay(9, 31)],
  [HOLIDAY_TAGLINES.thanksgiving, isFourthThursdayOfNovember],
  [HOLIDAY_TAGLINES.valentines, onMonthDay(1, 14)],
  [HOLIDAY_TAGLINES.christmas, onMonthDay(11, 25)],
]);

function isTaglineActive(tagline: string, date: Date): boolean {
  const rule = HOLIDAY_RULES.get(tagline);
  if (!rule) {
    return true;
  }
  return rule(date);
}

export interface TaglineOptions {
  env?: NodeJS.ProcessEnv;
  random?: () => number;
  now?: () => Date;
}

export function activeTaglines(options: TaglineOptions = {}): string[] {
  if (TAGLINES.length === 0) {
    return [DEFAULT_TAGLINE];
  }
  const today = options.now ? options.now() : new Date();
  const filtered = TAGLINES.filter((tagline) => isTaglineActive(tagline, today));
  return filtered.length > 0 ? filtered : TAGLINES;
}

export function pickTagline(options: TaglineOptions = {}): string {
  const env = options.env ?? process.env;
  const override = env?.OPENCLAW_TAGLINE_INDEX;
  if (override !== undefined) {
    const parsed = Number.parseInt(override, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      const pool = TAGLINES.length > 0 ? TAGLINES : [DEFAULT_TAGLINE];
      return pool[parsed % pool.length];
    }
  }
  const pool = activeTaglines(options);
  const rand = options.random ?? Math.random;
  const index = Math.floor(rand() * pool.length) % pool.length;
  return pool[index];
}

export { TAGLINES, HOLIDAY_RULES, DEFAULT_TAGLINE };
