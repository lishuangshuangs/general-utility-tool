# Utilora 在线实用工具箱

Utilora 是一个基于 HTML、CSS 和 JavaScript 的免费在线工具集合，使用 GitHub Pages 自动发布。

## 在线访问

https://utilora.github.io/

## 目录结构

```text
.
├─ index.html                         # 网站首页，只负责展示和链接工具
├─ assets/
│  ├─ css/site.css                    # 全站公共样式
│  └─ js/home.js                      # 首页脚本
├─ feedback/
│  ├─ index.html                      # 功能建议页面
│  └─ feedback.js                     # 生成 GitHub Issue 留言链接
└─ tools/
   ├─ text-counter/                   # 文本统计
   ├─ json-formatter/                 # JSON 格式化
   ├─ timestamp/                      # 时间戳转换
   ├─ password-generator/             # 密码生成器
   └─ case-converter/                 # 大小写转换
```

每个工具目录包含自己的 `index.html` 和 `tool.js`，工具逻辑不会写入网站根目录的 `index.html`。

## 新增工具

1. 在 `tools` 下新建工具文件夹。
2. 在该文件夹中创建 `index.html` 和 `tool.js`。
3. 在根目录 `index.html` 中增加该工具的入口卡片。
4. 提交并推送代码。

## 发布更新

```bash
git add .
git commit -m "更新网站"
git push
```

GitHub Pages 会在推送后自动重新发布网站。

## 功能建议

网站的功能建议页面会引导用户在本项目的 GitHub Issues 中提交建议。提交者需要登录 GitHub，留言内容公开可见。
