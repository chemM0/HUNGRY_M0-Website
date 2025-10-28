<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="https://www.hungrym0.top/favicon.png">
    <title>HUNGRY_M0 实时视奸</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- ECharts -->
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
        }
        
        .device-card {
            transition: all 0.3s ease;
        }
        
        .device-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }
        
        .online-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
        }
        /* 炫彩品牌文字（gradient-text）样式 */
        .brand { display: inline-flex; align-items: center; text-decoration: none; }
        .brand-logo img { height: 2rem; width: 2rem; border-radius: 0.375rem; }
        .brand-text { display: inline-flex; flex-direction: column; line-height: 1; }
        .gradient-text {
            /* 多色线性渐变，背景尺寸大一些以便平移动画 */
            background: linear-gradient(90deg, #ff7a18, #af002d 30%, #7b2ff7 60%, #319197 100%);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: transparent;
            /* 平滑循环动画，沿水平方向移动渐变 */
            animation: gradientShift 6s linear infinite;
        }

        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        /* ===== 手机端字体与间距适配（覆盖 Tailwind 的部分类） ===== */
        @media (max-width: 640px) {
            /* 稍微降低根字号，使 rem 基准变小，整体文本更紧凑 */
            html { font-size: 14px; }

            /* 常见标题与卡片文本的轻度缩放，使用 !important 以覆盖 Tailwind CDN 的样式 */
            .text-4xl { font-size: 1.6rem !important; }    /* 原本较大的主标题 */
            .text-2xl { font-size: 1.25rem !important; }
            .text-xl  { font-size: 1rem !important; }
            .text-lg  { font-size: 0.95rem !important; }

            /* 调整页眉中的品牌文字，避免 logo 旁过大的文字 */
            .brand-text .gradient-text { font-size: 1.125rem !important; }

            /* 页面主标题单独微调以保证换行效果更好 */
            #page-title { font-size: 1.9rem !important; }

            /* 缩小卡片内 padding，让卡片在窄屏时显得不那么臃肿 */
            .p-6 { padding: 0.9rem !important; }
            .py-8 { padding-top: 1.5rem !important; padding-bottom: 1.5rem !important; }
        }

        /* ===== 首页设备卡片：前端覆盖设备名显示为单行小字（不修改 JS） ===== */
        /* 仅作用于首页设备列表的卡片内的计算机名称位置，保留 DOM 内容但隐藏原文本，使用 ::after 显示固定提示 */
        #devices-grid .device-card .flex > div > p.text-sm.text-gray-500.mt-1 {
            position: relative;
            color: transparent !important; /* 隐藏原文本，但保留在 DOM 以免影响脚本 */
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            height: 1.25rem; /* 为 ::after 提供垂直空间 */
        }

        #devices-grid .device-card .flex > div > p.text-sm.text-gray-500.mt-1::after {
            content: "点击查看详情";
            position: absolute;
            left: 0;
            top: 0;
            color: #6B7280; /* text-gray-500 */
            font-size: 0.78rem;
            line-height: 1.25rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <!-- 返回首页按钮（移动端仅显示图标，桌面端显示文字） -->
                    <a href="https://www.hungrym0.top/index.html" aria-label="返回首页" class="group inline-flex items-center mr-3 sm:mr-4 px-2.5 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        <svg class="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span class="ml-2 hidden sm:inline text-sm">返回首页</span>
                    </a>
                    <a href="index.php" class="brand">
                        <span class="brand-logo"><img src="https://www.hungrym0.top/favicon.png" alt="logo"></span>
                        <span class="ml-3 brand-text">
                            <span class="gradient-text text-2xl font-bold">HUNGRY#末老师</span>
                            <span class="text-sm text-gray-500">设备监控系统</span>
                        </span>
                    </a>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="../admin/" class="text-sm text-gray-600 hover:text-gray-900">管理后台</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- 主内容 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- 首页标题和简介 -->
        <div id="page-header" class="mb-8 text-center">
            <h1 class="text-4xl font-bold text-gray-900 mb-4" id="page-title">HUNGRY_M0 实时视奸</h1>
            <p class="text-lg text-gray-600 max-w-3xl mx-auto" id="page-description">😋看看你末老师又在干嘛呢</p>
        </div>
        
        <!-- 统计概览卡片 -->
        <div id="stats-overview" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 hidden">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">在线设备</p>
                        <p class="text-2xl font-bold text-green-600"><span id="online-devices">0</span>/<span id="total-devices">0</span></p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="h-10 w-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">平均CPU</p>
                        <p class="text-2xl font-bold text-purple-600" id="avg-cpu">-%</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="h-10 w-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">平均内存</p>
                        <p class="text-2xl font-bold text-orange-600" id="avg-memory">-%</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 加载状态 -->
        <div id="loading" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600">加载中...</p>
        </div>

        <!-- 设备列表 -->
        <div id="devices-container" class="hidden">
            <div class="mb-6">
                <h2 class="text-xl font-semibold text-gray-900">设备列表</h2>
                <p class="text-sm text-gray-500 mt-1">共 <span id="device-count">0</span> 台设备，<span id="online-count">0</span> 台在线</p>
            </div>

            <div id="devices-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- 设备卡片将动态生成 -->
            </div>
        </div>

        <!-- 无设备提示 -->
        <div id="no-devices" class="hidden text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <h3 class="mt-4 text-lg font-medium text-gray-900">暂无设备</h3>
            <p class="mt-2 text-sm text-gray-500">请在管理后台添加设备并配置客户端</p>
            <div class="mt-6">
                <a href="../admin/" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    前往管理后台
                </a>
            </div>
        </div>
    </div>

    <!-- 页脚 -->
    <footer class="bg-white border-t border-gray-200 mt-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p class="text-center text-sm text-gray-600">
                Powered by <span class="font-semibold text-gray-900">WatchMeDo</span> with <span class="text-red-500">❤</span>
                <span class="mx-2">·</span>
                <a href="https://github.com/wmz1024/watchmedo" target="_blank" rel="noopener noreferrer" 
                   class="text-blue-600 hover:text-blue-800 hover:underline">
                    GitHub
                </a>
            </p>
        </div>
    </footer>

    <script src="assets/js/main.js"></script>
</body>
</html>

