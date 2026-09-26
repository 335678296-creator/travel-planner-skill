# 🧳 旅行攻略 Skill（Kimi / Agent 通用）

把零散旅行信息变成**"打开就能改、改完自动同步"的在线协作看板**：表格看板 + GitHub Pages 部署 + Nostr 免注册云端同步（助理/家人无需账号，刷新即见最新版）+ PDF 导出 + 交接存档。

来自一次真实的冰岛+挪威 13 天攻略实战打磨（4 人商务舱、6 家酒店比价、20+ 轮迭代）。

## 它能做什么

- **第 0 步 · 需求采集**：分批问清硬约束/预算/风格，3 轮收敛需求（`references/intake.md`）
- **路线设计**：季节硬约束先行、单向不回头、住宿跟着次日景点走等五原则（`references/planning.md`）
- **酒店比价**：官网/Booking/携程同口径对比，含早和取消条款换算后再比（`references/board-format.md`）
- **协作看板**：全表格 HTML，手机端自适应，景点酒店全带 Google 地图链接
- **免注册协作**：助理点"编辑模式"直接在线改，Nostr 云端同步，AI 更新前先合并不覆盖
- **一键 PDF**：无头 Chrome 打印，看板改了 PDF 同步重出

## 安装

1. 把整个文件夹拷到你的 Kimi skills 目录：
   `~/Library/Application Support/kimi-desktop/daimon-share/daimon/skills/旅行攻略/`
2. 首次使用同步功能前：`cd scripts && npm i`
3. 对 Kimi 说"做个旅行攻略"即可触发

## 没有 Kimi？

用配套提示词包，任何 AI（ChatGPT/豆包/Claude……）都能做出同款攻略：
👉 [AI旅行攻略提示词包](prompt-pack.md)

## 目录结构

```
SKILL.md                    主流程（0-6 步）+ 铁律
references/intake.md        需求采集清单
references/planning.md      路线设计方法论 + 调研 SOP
references/board-format.md  看板格式 + 酒店比价规范
references/deploy-github-pages.md  部署流程
references/nostr-sync.md    同步机制细节
references/pdf-export.md    PDF 导出
assets/edit-mode-sync.html  编辑模式代码
scripts/nostr-publish.mjs   云端播种/读取脚本
prompt-pack.md              给粉丝的复制即用提示词包
```

## 注意

- 同步用 Nostr 公共中继，SK 嵌在公开页面 = 任何人可覆盖同步状态，只用于低风险协作页
