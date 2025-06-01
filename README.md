# 邮件转发系统

这是一个基于 Cloudflare Workers 的邮件转发系统，可以将收到的邮件转发到指定的邮箱，并提供一个简单的 Web 界面来查看和管理邮件。

## 功能特点

- 📧 自动接收和转发邮件
- 🔒 支持基本认证，保护你的隐私
- 📱 响应式设计，支持移动端访问
- 🎨 美观的用户界面
- 🔍 支持多种邮件编码格式
- 🗑️ 支持删除单条消息和清空所有消息

## 部署步骤

### 1. 准备工作

1. 注册一个 Cloudflare 账号：访问 [Cloudflare 官网](https://dash.cloudflare.com/sign-up) 注册
2. 注册一个 GitHub 账号：访问 [GitHub 官网](https://github.com/signup) 注册
3. 安装 [Node.js](https://nodejs.org/)（选择 LTS 版本）

### 2. 克隆项目

1. 打开命令行工具（Windows 用户可以使用 PowerShell）
2. 运行以下命令：
```bash
git clone https://github.com/你的用户名/邮件转发系统.git
cd 邮件转发系统
```

### 3. 安装依赖

在项目目录下运行：
```bash
npm install
```

### 4. 配置 Cloudflare

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击左侧菜单的 "Workers & Pages"
3. 点击 "Create application"
4. 选择 "Create Worker"
5. 给 Worker 起个名字（比如 `email-forwarder`）
6. 点击 "Deploy"

### 5. 配置环境变量

1. 在 Cloudflare Dashboard 中，找到你创建的 Worker
2. 点击 "Settings" -> "Variables"
3. 添加以下环境变量：
   - `AUTH_USERNAME`: 设置你的登录用户名
   - `AUTH_PASSWORD`: 设置你的登录密码
   - `ALLOWED_ORIGIN`: 设置你的网站域名（例如：`https://your-domain.com`）

### 6. 部署前端

1. 在项目目录下运行：
```bash
npm run build
```

2. 将 `dist` 目录下的文件上传到你的网站服务器
3. 添加"VITE_WORKER_URL"与"vVITE_API_URL"值均为worker地址

### 7. 配置邮件路由

1. 在 Cloudflare Dashboard 中，找到 "Email" -> "Email Workers"
2. 点击 "Create Route"
3. 设置路由规则：
   - 选择你创建的 Worker
   - 设置接收邮件的域名（例如：`mail.your-domain.com`）

## 使用说明

### 访问系统

1. 打开浏览器，访问你的网站域名
2. 使用设置的用户名和密码登录

### 查看邮件

1. 登录后，你将看到所有收到的邮件列表
2. 点击邮件可以展开查看详细内容
3. 可以删除单条消息或清空所有消息

### 转发邮件

1. 系统会自动接收发送到配置的邮箱地址的邮件
2. 收到的邮件会显示在 Web 界面上
3. 支持多种邮件格式和编码

## 常见问题

### 1. 无法接收邮件
- 检查 Cloudflare 邮件路由配置是否正确
- 确认域名 DNS 记录是否正确设置

### 2. 登录失败
- 检查环境变量中的用户名和密码是否正确
- 确认 `ALLOWED_ORIGIN` 是否设置正确

### 3. 邮件显示乱码
- 系统支持自动处理多种编码格式
- 如果仍有问题，可以尝试刷新页面

## 技术支持

如果遇到问题，可以：
1. 查看 [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
