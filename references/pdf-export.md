# 看板导出 PDF（无头 Chrome）

老板会说"给我一份 PDF"。看板页本身有 `@media print` 样式，直接用无头 Chrome 打印，不要在本地另做排版。

## 前置：页面 print CSS 必须就绪

- `@media print` 里隐藏 `#editbar` 和吸顶导航，hero 转白底黑字
- `.day { break-inside: avoid; page-break-inside: avoid; }` 保证每日卡片不跨页截断
- `@page { margin: 12mm 10mm; }`

## 导出

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=<输出路径>.pdf --virtual-time-budget=20000 \
  "https://<user>.github.io/<repo>/"   # 用线上地址，不用本地文件
```

- `--virtual-time-budget=20000` 等图片和同步脚本跑完；刚部署完先 `sleep 45` 等 Pages 生效
- 文件名带项目名，如 `冰岛挪威13天-行程看板.pdf`

## 验证（两步都做）

```python
import pypdfium2 as pdfium
pdf = pdfium.PdfDocument('看板.pdf')
print('pages:', len(pdf))
for i in [0, len(pdf)//2]:
    pdf[i].render(scale=1.1).to_pil().save(f'check-{i+1}.png')  # 眼看首页+中间页
```

再用 pypdf 抽文本 grep 本次改动的关键词（确认导出的确实是新版，不是 CDN 缓存旧版）。检查截图用完删掉。

⚠️ pypdf 抽 CJK 文本会把部分汉字抽成异体字/兼容字（如「民宿」→「⺠宿」），grep 验证**用数字或英文关键词**（价格、日期、酒店英文名），别用中文词，否则会误判"没导出新版"。

## 铁律

- **每次改完看板（改 HTML→部署→播种）后，若之前交付过 PDF，必须同步重新生成**，否则老板手里的 PDF 和看板不一致
- PDF 是快照：交付时说清调研/生成日期，提醒"看板改动后重新 Cmd+P 即可出最新版"
