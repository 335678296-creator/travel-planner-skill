# Nostr 免注册云端同步 · 踩坑与验证

## 机制

- 用 **kind 30078（可替换事件）** 存整个看板状态：同一 pubkey + 同一 `d` tag 下，中继只保留 `created_at` 最新的一条 → 天然"最后写入获胜"。
- 密钥对用 `scripts/nostr-publish.mjs genkey` 生成，**SK 直接嵌进公开页面**。后果：任何看源码的人都能覆盖同步状态。低风险协作页（行程、清单）可接受；真被搞了就重新播种。不要用于敏感数据。
- 页面加载顺序必须是：先渲染 localStorage 缓存（秒开）→ 再拉云端比较 `updatedAt`，谁新用谁。时间戳统一放 content JSON 的 `updatedAt` 字段。

## 中继

实测可用（2026-08）：`relay.damus.io` `nos.lol` `nostr.mom` `offchain.pub` `relay.primal.net`。
单个中继拒收/超时是常态，发布 3/5 成功即视为成功。中继是公共设施，不保证永久留存——重要变更让用户用页面里的「导出变更」留底。

## 体积

- 单事件上限约 64KB。实测 32KB（16 张表的 innerHTML，含 CJK）在 5 个中继全部收发正常。
- 超过 50KB 先压缩或拆分，不要硬发。

## nostr-tools 的坑（最重要）

默认 `connectionTimeout = baseEoseTimeout = publishTimeout = 4400ms`，国内网络必然误杀：

- **浏览器**：必须 `await Promise.allSettled(RELAYS.map(u=>pool.ensureRelay(u,{connectionTimeout:25000})))` 预热，且 `pool.querySync(urls, filter, {maxWait:25000})`。不预热的表现：读取返回空、发布偶发失败。
- **Node**：`Relay.connect` / `SimplePool` 即使 polyfill `ws` 也全部超时（原因未查清）。**在 Node 里不要用它做网络操作**，用本技能 `scripts/nostr-publish.mjs`（手写 `["EVENT"]`/`["REQ"]` 协议）。`finalizeEvent` / `generateSecretKey` 等纯函数可以正常用。
- CDN：`cdn.jsdelivr.net/npm/nostr-tools@2.13.0/+esm` 为主，`unpkg.com` 兜底，动态 `import()` 逐个试。

## 免注册存储的失败名录（别再试）

| 服务 | 死法 |
|---|---|
| jsonblob.com | Cloudflare 403 |
| kvdb.io | 创建要邮箱，未验证前禁止写入 |
| npoint.io | 创建接口 500 |
| getpantry.cloud | 创建要 reCaptcha |
| json.extendsclass.com | 要 API key |
| jsonbox.io | 已变成 WordPress 博客 |
| restful-api.dev | 免注册且 CORS `*`，但 **data 总量上限约 975 字符**，只够存指针 |

结论：免注册 + 可写 + ≥30KB + 持久 ≥2 周的 HTTPS 存储基本不存在，Nostr 是可走路径。

## 验证方法

1. **协议层**：`node scripts/nostr-publish.mjs publish state.json --sk <hex>`，看每个中继"发布✅ 读回✅"；再 `read --pk <hex>` 比对内容。
2. **真实浏览器**（无 WebBridge 扩展时）：起本地回传服务器——页面跑完同步逻辑后 `fetch('http://127.0.0.1:PORT/report',{method:'POST',body:JSON.stringify(结果)})`，`open -a "Google Chrome" http://127.0.0.1:PORT/test` 打开，读回传文件判断成败。这是验证 CDN 可达性 + 浏览器 WS + 库 API 用法的唯一可靠手段。

## 重新发布的铁律

**改了页面 HTML 重新部署后，必须立刻用新内容重新播种云端**（重新生成 state 再 publish）。否则旧云端状态时间戳更新，会把新发布的页面内容覆盖回旧版。
