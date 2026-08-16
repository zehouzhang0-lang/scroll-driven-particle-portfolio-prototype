# 证据与主张边界

本表把代码可核验事实、作者陈述和当前不支持的说法分开。

- `verified`：可由本仓库源码或归档文件直接核验。
- `owner_attestation`：由作者于 2026-08-16 确认，尚无独立材料闭环。
- `partially_verified`：同时包含代码证据与仍依赖作者陈述的部分。
- `unsupported / not_claimed`：当前材料不支持，仓库主动不作该主张。
- `license_pending / excluded`：曾在本地使用，但没有随仓库提供可再分发许可，因此排除。

| 主张 | 状态 | 证据基础 | 对外安全表述 |
|---|---|---|---|
| 个人独立项目 | `owner_attestation` | 作者确认；当前快照无原始 Git 历史 | “个人独立设计和开发的交互原型。” |
| 使用 Codex、Claude、Gemini 辅助研发 | `owner_attestation` | 作者确认；对话/任务记录尚未脱敏归档 | “开发过程中使用 Codex、Claude 与 Gemini 辅助。” |
| 四幕滚动粒子原型 | `verified` | `index.html` 的场景解析、过渡权重与渲染逻辑 | 可直接表述 |
| 默认 15,000 粒子 | `verified` | `index.html` 与 `runner-model.js` 的质量档位和默认值 | “默认更新 15,000 个粒子”；不外推稳定 FPS |
| FBX 蒙皮表面采样与重心绑定 | `verified` | `runner-model.js` 的三角形面积权重、重心坐标与蒙皮更新 | 可直接表述技术实现 |
| RK4 生成 120,000 点 Chen–Lee 轨迹 | `verified` | `index.html` 的轨迹预计算与积分代码 | 可直接表述技术实现 |
| 自定义 Shader、滚动状态机、文字 reveal 与 snap | `verified` | `index.html` | 可直接表述技术实现 |
| 20D 概念结构由作者设计 | `owner_attestation` | 作者确认；本仓库保存实现快照 | “作者设计的 20D 概念网络。” |
| 多参数网络与三维投影已经实现 | `verified` | 18 条 strand，phase/frequency/depth 等参数及 `computeManifoldPosition()` | “20D 概念结构的三维视觉投影。” |
| 经数学证明的严格 20 维流形算法 | `unsupported / not_claimed` | 当前没有显式 20 元向量定义、流形性质或数学证明 | 不作该主张 |
| 页面包含 AI/LLM/Agent 产品能力 | `unsupported / not_claimed` | 代码没有模型调用、Agent、RAG 或推理服务 | 只谈 AI 辅助研发流程 |
| 已正式上线或有真实用户结果 | `unsupported / not_claimed` | 无部署、访问或运营证据 | 定位为原型和安全归档 |
| 稳定 60 FPS、跨浏览器或移动端质量 | `unsupported / not_claimed` | 无系统基准与测试矩阵 | 不作性能或兼容性承诺 |
| 原始 Mixamo FBX 可随仓库分发 | `license_pending / excluded` | 二进制元数据可识别来源；无仓库内再分发许可 | 原始 FBX 不进入 Git |

## 推荐的一句话描述

> 独立设计并开发个人作品集首页的滚动驱动 WebGL 交互原型，将 15,000 粒子在动画跑者、程序化流场、Chen–Lee 吸引子与作者设计的 20D 概念网络三维投影之间连续形变，并使用 Codex、Claude 与 Gemini 辅助研发。

该句中的代码细节为 `verified`；“独立”“AI 辅助”和“20D 设计归属”仍属于作者确认口径。
