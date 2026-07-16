# 竞品情报

**[中文](./README.md)** · [English](./README.en.md)

> 把「谁在跟我抢市场、哪里被压着、下一步怎么赢」变成桌面上能反复跑的工作流。

[![Demo](https://img.shields.io/badge/在线_Demo-立即体验-5b8cff?style=flat-square)](https://wangyaominde.github.io/competitor-scout/)
[![Download](https://img.shields.io/badge/下载-macOS_/_Windows-111827?style=flat-square)](https://github.com/wangyaominde/competitor-scout/releases/tag/latest)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

---

## 这是什么

竞品情报是一款**本地运行的桌面应用**。你描述自己的产品，它帮你：

1. **找**——自动搜索并整理可能的竞品  
2. **判**——按威胁程度排序，而不是一份散乱的名单  
3. **比**——规格、价格、渠道一条条对齐  
4. **赢**——生成可执行的击败路径，并支持定时盯盘  

密钥和竞品库都留在你自己的电脑上，**不会上传到本仓库，也不会塞进安装包**。

---

## 先试试

| | |
|---|---|
| **两分钟上手** | [在线 Demo](https://wangyaominde.github.io/competitor-scout/)（示例数据，**不用填大模型、不用 API Key**） |
| **完整能力** | [下载桌面版](https://github.com/wangyaominde/competitor-scout/releases/tag/latest)（接你自己的 LLM，真正扫描） |

macOS 若提示「已损坏，无法打开」，多半是系统隔离，不是安装包坏了：

```bash
xattr -cr /Applications/CompetitorScout.app
open /Applications/CompetitorScout.app
```

| 你的电脑 | 下这个 |
|---------|--------|
| Mac（Apple 芯片） | `CompetitorScout-*-mac-arm64.dmg` |
| Mac（Intel） | `CompetitorScout-*-mac-x64.dmg` |
| Windows | `CompetitorScout-*-win-x64.exe` |

---

## 你能用它做什么

**把竞品从「感觉」变成「清单」**  
扫一轮，待确认队列里会出现候选；你只把真正的对手入库，其余一键忽略。

**先看谁最危险**  
综合品类重合、功能规格、渠道与价格压力，给出威胁分与原因，并支持 3D 空间、卡片、表格多种视图。

**做参数级对比，而不是口号式对比**  
「我们有、对方没有 / 对方更强」落在具体规格行上。对比表用于分析，**不会反向改写威胁分**——判定与分析职责分开。

**让 AI 帮你推演怎么赢**  
基于你的产品和高威胁竞品，生成分阶段路线图：定位、价格与渠道策略、能力差距、本周可行动作。

**设好之后可以少盯着**  
开启 Loop，按你定的节奏后台巡检；高威胁出现时再通知你。

---

## 使用节奏（桌面版）

1. 接一个 OpenAI 兼容的大模型（DeepSeek、通义、MiniMax、Kimi、Ollama…）  
2. 在「我的产品」里写清楚你是谁、卖什么、卖多少  
3. 跑一次智能扫描 → 在竞品库确认  
4. 需要时打开参数对比、击败路径，或开启定时 Loop  

在线 Demo **没有**大模型配置入口，避免误以为网页版也要填 Key——那是故意的。

---

## 从源码运行（可选）

已有 Node.js 时：

```bash
git clone https://github.com/wangyaominde/competitor-scout.git
cd competitor-scout
npm install
npm start
```

国内若 Electron 下载失败，可先设置镜像再安装：

```bash
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/   # macOS / Linux
npm install
```

---

## 隐私与信任

- 仓库内**不含** API Key，也**不含**你的真实竞品库  
- 桌面端数据写在系统用户目录（例如 macOS 的 Application Support）  
- 欢迎审计代码；测试与构建流水线会拦常见密钥泄漏  

---

## 许可

[MIT](./LICENSE) — 欢迎使用、改造与分享。

有想法或问题？欢迎开 [Issue](https://github.com/wangyaominde/competitor-scout/issues)。
