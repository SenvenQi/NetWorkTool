# 网络测试工具

Electron + React 桌面工具，支持 TCP 客户端、UDP、HTTP 监听、串口与 HID，保存设备配置和常用命令。

## 开发与运行

使用 Node.js 22.12+（推荐 Node.js 24 LTS）和 npm。首次安装会为 Electron 编译/下载原生依赖；从源码编译时需要平台 C/C++ 工具链，Linux 的 HID 模块还可能需要 libudev/libusb 开发包。

```sh
npm ci
npm --prefix frontend/tool ci
npm run dev
```

生产模式运行：

```sh
npm run build
npm start
```

`npm run pack` 在 Windows 上生成 x64 NSIS 安装包，不自动发布。开发模式仅在显式设置 `NODE_ENV=development` 且应用未打包时访问本机 Vite；生产模式加载本地文件。

## 输入格式

- TCP：`host:port`，IPv6 使用 `[::1]:8080`。
- HTTP / UDP 地址：本地监听端口（1–65535）。UDP 可配置目标地址和端口，默认保持原有广播目标 `255.255.255.255:1500`。
- 串口：选择端口和波特率；HID：选择设备路径。
- 发送数据为完整十六进制字节，允许空白，例如 `00 ff 12`。常用命令支持十六进制或 UTF-8 文本；空内容、奇数位或非法字符会报错。
- HTTP 监听仅接收请求，不提供主动发送；请求体和 multipart 文件总量限制为 1 MiB，上传临时文件在处理后清理。

## 数据与安全

配置继续保存在 Electron `userData/desktopApp.db`；数据库名称、表结构及既有命令格式保持兼容。驱动改为 better-sqlite3，启动和所有仓储操作等待数据库初始化。建议升级前备份该文件。

渲染进程关闭 Node 集成、开启上下文隔离和 Web 安全；IPC 限定主窗口主框架及明确的设备操作列表。窗口禁止导航和新窗口。生产页面启用 CSP；仅开发服务器允许 React 热更新所需的内联脚本。

连接退出时清理，异步失败返回界面提示。历史接收消息最多保留 1000 条，避免持续接收导致内存无限增长。

## 验证

```sh
npm run lint
npm test
npm --prefix frontend/tool test
npm run build
npm run test:database
npm run test:electron
npm run test:ui
# 在打包后验证实际安装目录：
npm run test:packaged
npm audit
npm --prefix frontend/tool audit
```

Electron 集成测试使用临时用户目录，验证旧 SQLite 数据兼容、页面与 preload 加载、IPC 拒绝、设备增删、TCP 回环及 UTF-8 命令。Linux 无显示环境可运行 `npm run test:electron -- --no-sandbox --ozone-platform=headless`；`--no-sandbox` 仅用于隔离测试环境，不是应用默认配置。

TCP、UDP、HTTP 使用真实本机 socket 做回环回归，覆盖断线重连、连接拒绝、端口冲突、分段 UTF-8、超限请求、multipart 解析和上传清理。串口使用 SerialPortMock，HID 使用测试专用模拟驱动，覆盖字节收发、拔出、写入失败和重连；真实硬件、驱动兼容性和 HID 报告长度仍需连接物理设备验证。

`npm run test:ui` 在独立临时用户目录启动实际 Electron 窗口，通过界面完成五种协议的添加、连接和收发，以及无效输入修正、命令保存、刷新、复制、删除和布局检查。测试同时检查 800×600、1280×800 窗口，截图保存到 `test-results/ui/`。Linux 自动使用无显示模式；模拟驱动只在测试入口加载，不进入应用或安装包。

设备和命令弹窗在保存成功后关闭，失败时保留输入；未连接设备禁用发送，HTTP 显示监听状态。默认窗口的命令面板以浮层展开，长消息自动换行，关闭的面板不参与键盘导航。Windows 安装包应在 Windows runner 上构建验证。

设备和数据库请求按提交顺序处理，重复连接不会重建正在连接的设备；刷新界面时读取主进程的实时连接状态。单次 HTTP 请求中断或 UDP 发送失败只报告操作错误，不会把仍在监听的设备标为断线。

GitHub Actions 的 Windows 检查还会上传 `network-tool-ui-screenshots` 截图，并生成 x64 NSIS 安装包，并启动打包程序验证页面、IPC 和数据库。通过后可在对应运行的 Artifacts 中下载 `network-tool-windows-x64`（保留 14 天）。
