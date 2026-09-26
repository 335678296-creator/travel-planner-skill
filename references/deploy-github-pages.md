# GitHub Pages 部署协作看板

静态页 + 免后端，最适合配合 Nostr 同步编辑模式。

## 首次部署

```bash
# 1. 确认 gh 已登录
gh auth status

# 2. 建仓库（public，GitHub Pages 免费档要求公开）
gh repo create <repo-name> --public

# 3. 建发布目录并推送
mkdir dist-<name> && cd dist-<name>
git init && git remote add origin git@github.com:<user>/<repo-name>.git
cp ../board.html index.html          # 首页必须是 index.html
git add -A && git -c user.name="bot" -c user.email="bot@local" commit -m "init"
git branch -M main && git push -u origin main

# 4. 开 Pages（main 分支根目录）
gh api repos/<user>/<repo-name>/pages -X POST -f "source[branch]=main" -f "source[path]=/"
```

地址：`https://<user>.github.io/<repo-name>/`，约 1 分钟生效。

## 更新发布

```bash
cp 源文件.html dist-<name>/index.html
cd dist-<name> && git add -A \
  && git -c user.name="bot" -c user.email="bot@local" commit -qm "说明" \
  && git push -q
```

## 验证（必须做）

```bash
sleep 40 && curl -s https://<user>.github.io/<repo-name>/ | grep -c "<新内容关键字>"
```

grep 计数 ≥1 才算上线成功。GitHub Pages 有 CDN 缓存，通知用户首次打开按 `Cmd+Shift+R` 强刷。

## 注意

- 页面完全公开（知道链接即可见）——别放护照号、完整票号二维码等敏感信息；确认号级别的信息用户自己权衡
- 仓库 URL 会嵌在页面源码里
- **改完页面重新发布后，记得重新播种云端**（见 references/nostr-sync.md 末条）
