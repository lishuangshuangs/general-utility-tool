# 抖音解析 Edge Function

仅用于下载本人拥有或已获授权的公开内容。函数不接收抖音 Cookie，只解析公开分享页。

部署：

Windows 推荐使用 Scoop 安装独立 CLI，避免 npm/Node 24 的平台二进制问题：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh -OutFile "$env:TEMP\install-scoop.ps1"
& "$env:TEMP\install-scoop.ps1"
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
supabase --version
supabase login
supabase functions deploy douyin-parser --project-ref nkxgnqzdswugbjjquxfj --no-verify-jwt
```

`--no-verify-jwt` 是必需的，因为工具面向未登录访客；函数内部使用域名白名单、授权确认、限时 HMAC 下载签名及 250MB 上限保护。

抖音未提供此用途的稳定公开 API，页面结构、风控或地区策略变化时解析可能失效。不要在代码或网页中收集、保存用户的抖音 Cookie。