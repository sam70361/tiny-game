# HTML Demo 项目工程化最佳实践

> 本文档总结了纯 HTML/CSS/JS 构建 Demo 站点的工程化经验，适用于任何需要快速构建高质量静态演示站的场景。内容已抽象为通用知识，不依赖特定项目。

---

## 1. 项目结构设计原则

### 1.1 单入口 + 分层架构

一个良好的 HTML Demo 项目应遵循**单入口**原则与清晰的分层结构：

- **根目录只保留一个 `index.html`**，作为唯一入口文件，避免用户不知道该打开哪个页面
- 多模块/多页面通过 **Hash 路由** 或 **动态加载** 实现切换，不需要多个 HTML 文件
- 所有资源路径以 `index.html` 所在目录为基准，统一简洁

```
project/
  index.html                # 唯一入口文件（SPA 模式）
  css/
    tokens.css              # 设计令牌 (最底层)
    reset.css               # CSS 重置
    base.css                # 基础元素样式
    layout.css              # 布局系统
    components/             # 组件样式（拆分为独立文件）
      modal.css
      drawer.css
      table.css
      ...                   # 每个组件一个文件
    pages/                  # 页面/模块专属样式
      page-name.css
    utilities.css           # 工具类
    print.css               # 打印样式
  js/
    app.js                  # 应用初始化与全局逻辑（含路由）
    store.js                # 数据存储与状态管理
    event-bus.js            # 跨组件事件通信
    utils.js                # 通用工具函数
    router.js               # Hash 路由（页面切换 + Tab 切换）
    components/             # 可复用组件（每个独立文件）
    pages/                  # 页面控制器（按模块分子目录）
      module-a/
        sub-page-1.js
        sub-page-2.js
      module-b/
        ...
  data/                     # JSON 数据文件（按模块分子目录）
    shared/                 # 共享基础数据
    module-a/               # 模块数据（可拆分为多个 JSON）
    module-b/
  assets/
    icons/                  # SVG 图标
    images/                 # 图片资源
    fonts/                  # 自托管字体
  libs/                     # 第三方库
  docs/                     # 文档
```

### 1.2 关键原则

- **单一入口**：根目录只放一个 `index.html`，用户无需选择打开哪个文件，对新手友好
- **文件职责单一**：每个文件只负责一件事，CSS/JS/JSON 都按职责拆分为独立文件
- **数据与视图分离**：所有业务数据放 JSON 文件，JS 负责加载渲染，HTML 只提供骨架
- **组件可复用**：通用 UI 元素提取为组件，通过 variants 和 options 支持变形

### 1.3 文件拆分原则

当项目规模增大时，合理拆分文件是保证可维护性的关键：

- **CSS 组件拆分**：不要把所有组件样式放在一个 `components.css` 中，而是拆分为 `components/modal.css`、`components/table.css` 等独立文件，每个文件 100-300 行为宜
- **JS 页面拆分**：当一个模块有多个子功能（如 Tab 页）时，每个子功能应有独立的页面控制器文件，放在 `pages/模块名/` 子目录下
- **JSON 数据拆分**：避免单个 JSON 文件过大（超过 500 条记录），按业务领域拆分为独立文件，共用数据（如人员、部门）放在 `data/shared/` 中跨模块引用
- **单文件行数**：CSS 文件建议不超过 400 行，JS 文件建议不超过 500 行，超过时考虑拆分
- **拆分粒度参考**：

| 文件类型 | 建议拆分粒度 | 示例 |
|---------|------------|------|
| CSS 组件 | 每个 UI 组件一个文件 | `modal.css`, `table.css`, `drawer.css` |
| JS 组件 | 每个可复用组件一个文件 | `modal.js`, `table.js`, `chart-wrapper.js` |
| JS 页面 | 每个 Tab/子功能一个文件 | `resource-mgmt.js`, `alert-trigger.js` |
| JSON 数据 | 按业务实体拆分 | `resources.json`, `plans.json`, `alerts.json` |
| CSS 页面 | 每个模块/页面一个文件 | `emergency.css`, `energy.css` |

---

## 2. 设计令牌 (Design Tokens) 方法论

### 2.1 什么是设计令牌

设计令牌是将所有视觉决策（颜色、字体、间距、阴影等）抽象为可复用的变量。在纯 CSS 项目中使用 CSS Custom Properties 实现。

### 2.2 令牌分类体系

```css
:root {
  /* 颜色 -- 语义化命名，不用具体色值命名 */
  --color-primary:   ...;
  --color-secondary: ...;
  --color-accent:    ...;
  --color-success:   ...;
  --color-warning:   ...;
  --color-surface:   ...;     /* 卡片/弹窗背景 */
  --color-overlay:   ...;     /* 遮罩层 */

  /* 字体 -- 按用途分类，包含完整 fallback 链 */
  --font-headline: ...;       /* 标题 */
  --font-body:     ...;       /* 正文 */
  --font-ui:       ...;       /* 界面标签 */
  --font-mono:     ...;       /* 代码 */

  /* 字号 -- 使用模块化缩放 (推荐 1.25 比例) */
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.25rem;
  /* ... 递增 */

  /* 间距 -- 使用 4px 为基础单位 */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-4: 1rem;     /* 16px */
  /* ... */

  /* 阴影 -- 分层级 */
  --shadow-sm:    ...;
  --shadow-md:    ...;
  --shadow-lg:    ...;

  /* 圆角、过渡、z-index 等 */
  --radius-sm: 2px;
  --ease-default: 200ms ease;
  --z-dropdown: 100;
  --z-modal:    300;
}
```

### 2.3 令牌化的好处

1. **一致性**：全站视觉统一，修改一处即可全局生效
2. **可维护性**：设计改版时只需修改 tokens.css
3. **可读性**：`var(--space-4)` 比 `16px` 更具语义
4. **主题化**：通过覆盖 tokens 即可实现深色模式等主题切换

---

## 3. CSS 分层架构

### 3.1 加载顺序 (从通用到具体)

```html
<link rel="stylesheet" href="css/tokens.css">      <!-- 1. 令牌定义 -->
<link rel="stylesheet" href="css/reset.css">        <!-- 2. 浏览器重置 -->
<link rel="stylesheet" href="css/base.css">         <!-- 3. 基础元素样式 -->
<link rel="stylesheet" href="css/layout.css">       <!-- 4. 布局系统 -->
<link rel="stylesheet" href="css/components.css">   <!-- 5. 组件样式 -->
<link rel="stylesheet" href="css/pages/xxx.css">    <!-- 6. 页面专属 -->
<link rel="stylesheet" href="css/utilities.css">    <!-- 7. 工具类 (最高优先级) -->
<link rel="stylesheet" href="css/print.css">        <!-- 8. 打印样式 -->
```

### 3.2 每层职责

| 层级 | 职责 | 示例 |
|------|------|------|
| tokens | 定义变量值 | `--color-ink: #1A1A1A` |
| reset | 消除浏览器默认样式 | `*, *::before { box-sizing: border-box }` |
| base | 为 HTML 元素设置默认样式 | `h1 { font-family: var(--font-headline) }` |
| layout | 页面结构、网格、容器 | `.grid--3 { grid-template-columns: repeat(3, 1fr) }` |
| components | 可复用 UI 组件 | `.card`, `.badge`, `.modal`, `.toast` |
| pages | 特定页面的专属样式 | `.home-headlines`, `.article-body` |
| utilities | 原子级工具类 | `.mt-4`, `.text-center`, `.hidden` |

---

## 4. 无框架组件架构

### 4.1 组件模式

在不使用框架的前提下，通过 Class 模式组织组件：

```javascript
class Component {
  constructor(container, options = {}) {
    this.container = container;
    this.options = { ...this.defaults, ...options };
  }

  get defaults() { return {}; }
  render() { return ''; }              // 返回 HTML 字符串

  mount() {
    this.container.innerHTML = this.render();
    this.bindEvents();
  }

  bindEvents() {}                       // 绑定 DOM 事件
  update(newOptions) {                  // 响应数据变化
    Object.assign(this.options, newOptions);
    this.mount();
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
```

### 4.2 组件变形 (Variants)

通过 CSS 修饰符类 + JS options 实现组件变形：

```css
.card { }                    /* 默认样式 */
.card--featured { }          /* 精选变体 */
.card--compact { }           /* 紧凑变体 */
```

```javascript
renderCard(data, { variant: 'featured', type: 'prompt' });
```

### 4.3 跨组件通信

使用事件总线 (EventBus) 解耦组件间通信：

```javascript
// 发布
EventBus.emit('favorites:changed', { id, isFavorite });

// 订阅
EventBus.on('favorites:changed', (data) => { /* 更新 UI */ });
```

---

## 5. 数据驱动渲染

### 5.1 JSON 数据即数据库

对于 Demo 站，使用 JSON 文件替代数据库：

```javascript
// store.js - 集中数据管理
class Store {
  async load() {
    const [users, articles] = await Promise.all([
      fetch('data/users.json').then(r => r.json()),
      fetch('data/articles.json').then(r => r.json())
    ]);
  }

  getUser(id) { return this.users.find(u => u.id === id); }
  search(query) { /* 全文搜索逻辑 */ }
}
```

### 5.2 数据模型设计原则

- 使用字符串 ID 进行跨表关联 (如 `author: "author-1"`)
- 每个实体包含完整的元数据字段
- 预计算统计数据 (viewCount, rating) 作为 mock 数据
- 支持层级关系 (parentId) 用于分类树

### 5.3 客户端持久化

使用 localStorage 存储用户交互状态：

```javascript
// 收藏状态
localStorage.setItem('favorites', JSON.stringify(ids));

// 学习进度
localStorage.setItem('path_progress', JSON.stringify(progress));

// 已关闭的公告
localStorage.setItem('dismissed', JSON.stringify(dismissedIds));
```

---

## 6. 资产管理策略

### 6.1 字体

- **自托管字体**：下载 woff2 文件放 `assets/fonts/`，通过 `@font-face` 声明
- **中文字体 fallback**：系统字体作为后备，避免下载巨大的中文字体文件
- **`font-display: swap`**：确保字体加载期间文本可见

```css
--font-body: 'Source Serif 4', 'Noto Serif SC', 'SimSun', 'Georgia', serif;
```

### 6.2 图标

- 使用 **SVG Sprite** 方案：所有图标合并为一个 SVG 文件
- 通过 `<use>` 引用，支持 CSS 颜色继承
- 保持图标尺寸一致 (24x24 viewBox)

```html
<svg class="icon"><use href="assets/icons/icons.svg#search"></use></svg>
```

### 6.3 图片

- Demo 项目图片优先使用 SVG (头像、装饰图)
- 照片类素材从免费图库 (Unsplash) 下载到本地
- 使用 `loading="lazy"` 延迟加载

---

## 7. 中文本地化要点

### 7.1 字体栈

```css
/* 正文字体栈 - 中文优先 */
--font-body: 'Latin Font', 'Noto Serif SC', 'SimSun', 'Georgia', serif;

/* UI 字体栈 - 无衬线 */
--font-ui: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
```

### 7.2 日期格式化

```javascript
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
```

### 7.3 标签本地化

将所有 UI 标签集中管理：

```javascript
const labels = {
  difficulty: { beginner: '入门', intermediate: '进阶', advanced: '高级' },
  status: { active: '已发布', draft: '草稿', archived: '已归档' },
  department: { tech: '技术', marketing: '营销', sales: '销售' }
};
```

---

## 8. 性能优化

### 8.1 CSS 性能

- CSS 变量在 `:root` 上定义，编译时确定，运行时高效
- 避免过深的选择器嵌套 (最多 3 层)
- 使用 `will-change` 谨慎 (仅在频繁动画的元素上)

### 8.2 JS 性能

- **防抖搜索**：`debounce(fn, 200)` 避免输入时频繁搜索
- **分页渲染**：不要一次渲染所有数据，使用分页
- **事件委托**：在容器上监听事件而非每个子元素
- **IntersectionObserver**：滚动高亮 TOC 等场景使用

### 8.3 加载性能

- CSS 放 `<head>`，JS 放 `</body>` 前
- 字体使用 `font-display: swap`
- 图片使用 `loading="lazy"`

---

## 9. 可访问性

- 语义化 HTML：使用 `<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`
- ARIA 标签：`aria-label` 用于图标按钮
- 键盘导航：`tabindex`, `:focus-visible` 样式
- 快捷键：全局搜索 Ctrl+K
- 颜色对比度：确保文本与背景的对比度达标
- `::selection` 自定义选中样式

---

## 10. 功能完整性检查清单

在构建知识管理类 Demo 时，确保覆盖以下功能模块：

### 核心内容管理
- [ ] 内容的增删改查展示 (CRUD 模拟)
- [ ] 多维度分类体系 (层级分类 + 标签)
- [ ] 全文搜索与结果展示
- [ ] 内容详情页 (完整元数据、作者信息)
- [ ] 关联推荐 (相关内容)

### 用户交互
- [ ] 收藏 / 书签功能
- [ ] 评分 / 反馈机制
- [ ] 评论展示
- [ ] 一键复制
- [ ] 阅读进度 (阅读量统计)

### 知识传递 (替代培训)
- [ ] 学习路径 / 知识地图
- [ ] 进度跟踪 (已完成 / 总数)
- [ ] 步骤化模块设计
- [ ] 难度分级
- [ ] 目标受众标记 (部门 / 角色)

### 信息架构
- [ ] 全局导航 (masthead / 导航栏)
- [ ] 面包屑导航
- [ ] 侧边栏分类树
- [ ] 目录 (TOC) 与滚动高亮
- [ ] 前后文章导航
- [ ] 分页

### 通知与公告
- [ ] 顶部公告栏 (可关闭)
- [ ] Toast 提示
- [ ] 空状态提示

### 辅助功能
- [ ] 打印按钮与打印样式
- [ ] 回到顶部按钮
- [ ] 键盘快捷键 (Ctrl+K)
- [ ] 视图切换 (网格 / 列表)

---

## 11. SPA 路由与模块化页面加载

### 11.1 Hash 路由模式

对于后台管理类 Demo，推荐使用 Hash 路由实现单页应用（SPA）：

```javascript
// 页面级路由：#/module 切换模块
// Tab级路由：#/module/tab 切换子功能
class Router {
  navigate(path) {
    window.location.hash = path;
  }
  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute(); // 处理初始路由
  }
}
```

### 11.2 动态脚本加载

模块的 JS 文件按需加载，避免首屏加载全部脚本：

```javascript
async function loadModule(moduleName) {
  const scripts = MODULE_SCRIPTS[moduleName]; // 模块脚本清单
  for (const src of scripts) {
    if (!document.querySelector(`script[src="${src}"]`)) {
      await loadScript(src);
    }
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
```

### 11.3 模块注册模式

每个页面控制器注册到全局，支持按需初始化和销毁：

```javascript
// js/pages/emergency/resource-mgmt.js
(function(global) {
  const ResourceMgmt = {
    async init(container) {
      // 加载数据 → 渲染 → 绑定事件
    },
    destroy() {
      // 清理定时器、事件监听等
    }
  };
  global.ResourceMgmt = ResourceMgmt;
})(window);
```

---

## 12. 工程化思维总结

1. **单一入口**：根目录只放一个 `index.html`，所有模块通过路由切换
2. **令牌先行**：在写任何具体样式之前，先定义设计令牌
3. **结构优于装饰**：先搭建好文件结构和数据模型，再做视觉美化
4. **合理拆分**：文件超过 400-500 行时必须拆分，按职责/模块/组件拆为独立文件
5. **组件思维**：任何 UI 元素出现两次以上就应该提取为组件
6. **数据驱动**：页面内容由数据决定，不要在 HTML 中硬编码业务内容
7. **渐进增强**：先保证功能可用，再添加动画和视觉效果
8. **面向中文**：字体、日期、标签本地化从项目开始就要考虑
9. **按需加载**：模块脚本按需动态加载，避免首屏卡顿
10. **防御式编程**：数据加载用 try/catch，组件调用前判断存在性，空状态友好展示

---

*本文档可作为未来 HTML Demo 项目的工程化参考手册。*
