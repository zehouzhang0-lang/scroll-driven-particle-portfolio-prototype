# 教师快速审阅指南

## 先看成果

1. 打开仓库首页的 `README.md`，确认项目定位和边界。
2. 查看 `screenshots/homepage-assembly-hero-final2.png` 与 `screenshots/homepage-assembly-1.png`，了解集成页面的起点与终点。
3. 查看 `screenshots/runner-module-preview.png`、`runner-flow-end.png`、`flow-chenlee-attractor.png` 与 `chenlee-manifold-breathing-soft.png`，了解四幕视觉的组成。

截图含调试面板是因为它们来自研发过程，而不是重新制作的宣传图；面板读数不能视为性能测试。

## 再看技术实现

建议在 GitHub 文件页使用浏览器搜索定位下列函数或常量：

| 文件 | 搜索内容 | 能看到什么 |
|---|---|---|
| `runner-model.js` | `buildTriangleSampler` | 三角形面积加权采样 |
| `runner-model.js` | `sampleBarycentric` | 粒子在网格表面的重心坐标绑定 |
| `runner-model.js` | `updateRunnerParticleTargets` | 动画网格到粒子目标的逐帧更新 |
| `index.html` | `CHEN_SAMPLE_COUNT` | 120,000 点轨迹配置 |
| `index.html` | `rk4Step` | Chen–Lee 的 RK4 数值积分 |
| `index.html` | `resolveScene` | 四幕稳态与过渡区间 |
| `index.html` | `buildManifoldBindings` | 概念网络的 strand 与参数绑定 |
| `index.html` | `computeManifoldPosition` | 多参数网络向三维坐标的映射 |
| `index.html` | `ShaderMaterial` | 自定义粒子与线条着色器 |

系统关系可看 [architecture.md](architecture.md)，事实口径可看 [evidence-and-claims.md](evidence-and-claims.md)。

## 下载与复现

本仓库为公开的脱敏作品集快照，可直接在线查看，并可在仓库页面右上方选择 **Code → Download ZIP** 下载安全归档源码。仓库不含原始 FBX；完整运行前需要按照 [assets/README.md](../assets/README.md) 自行提供有权使用的兼容资产。

这意味着教师可以直接下载和审阅全部核心代码及截图，但不能把当前 ZIP 理解为无需外部资产即可完整运行的成品包。
