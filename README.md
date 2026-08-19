# Utilora 在线实用工具箱

Utilora 是一个基于 HTML、CSS 和 JavaScript 的免费在线工具集合，使用 GitHub Pages 自动发布。处理尽量只在浏览器中完成。

## 在线访问

https://utilora.github.io/

## 这次更新

- JSON / YAML / CSV 互转
- 图片批量压缩并打包下载
- 二维码识别
- 词级简繁转换
- Markdown 预览与公众号 HTML
- 工具页可分享链接（`?q=`）
- 身份证号码结构校验

## 目录结构

```text
.
├─ index.html
├─ assets/
│  ├─ css/site.css
│  ├─ js/
│  └─ vendor/
└─ tools/
   ├─ data-convert/
   ├─ image-compress/
   ├─ markdown-preview/
   └─ ...
```

每个工具目录包含自己的 `index.html` 和 `tool.js`。

## 发布更新

```bash
git add .
git commit -m "更新网站"
git push
```

GitHub Pages 会在推送后自动重新发布网站。
