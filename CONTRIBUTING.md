# 贡献指南 / Contributing

欢迎提交问题、文档改进和代码修改。使用说明见 [中文 README](README.md) / [English README](README.en.md)。

## 开发环境 / Development setup

使用 Node.js 22 或更高版本，以及项目固定的 pnpm 11。Use Node.js 22 or later and the pinned pnpm 11 release.

```sh
pnpm install --frozen-lockfile
pnpm run check
```

## 修改约定 / Change guidelines

- 保持修改聚焦；用户可见行为变化需要同步两份 README。
- 主会话与子代理的识别、完成原因和时长阈值变化需要测试覆盖。
- 不手工编辑 `lib/`；通过构建脚本生成。
- 不提交依赖、令牌、真实会话日志或个人 DSH 配置。

Keep changes focused, update both READMEs for user-visible changes, and test changes to main-session filtering, completion reasons, and duration thresholds. Build `lib/` instead of editing it. Do not commit dependencies, tokens, real session logs, or personal DSH configuration.

## 提交前验证 / Before submitting

```sh
pnpm run check
```

## 许可证 / License

提交贡献时，请确认你有权按项目的 [MIT 许可证](LICENSE)提供这些内容。

Make sure you have the right to contribute under the project's [MIT license](LICENSE).
