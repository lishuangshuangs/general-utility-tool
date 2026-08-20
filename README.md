# Utilora 报价与算税

Utilora 以财务工具为主：报价单、增值税价税分离、个人所得税、到手工资和金额大写。处理在浏览器里完成，用 GitHub Pages 发布。

## 在线访问

https://utilora.github.io/

首页默认展示财务工具；文本、开发、图像仍可在「全部」里使用。

## 这次更新

- 增值税价税分离、报价单、个人所得税、到手工资
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
