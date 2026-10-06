# 发布流程 / Release process

[中文 README](../README.md) · [English README](../README.en.md)

正式版本以 `package.json` 版本、`v<version>` Git 标签和同名 GitHub Release 为同一版本来源。发布准备使用并保留 `release/<version>` 分支。已发布标签和资产不可移动、重建或静默覆盖；修复进入新的 patch 版本。

The `package.json` version, `v<version>` tag, and GitHub Release are one immutable version identity. Prepare and retain a `release/<version>` branch. Publish fixes as a new patch version rather than moving a tag or replacing an asset.

## 发布前 / Before release

1. 更新 `package.json` 版本。
2. 将 `CHANGELOG.md` 的 Unreleased 内容归入带日期版本。
3. 同步两份 README 的版本徽章、安装包名和用户可见行为。
4. 新建 `docs/releases/v<version>.md`，面向安装者说明本版主题、实际验证的 DSH 版本与范围、安装方式、限制和 Changelog 链接。
5. 在 `release/<version>` 分支运行：

```powershell
pnpm install --frozen-lockfile
pnpm peers check
pnpm run check
pnpm run release:prepare -- v<version>
git diff --check
```

6. 检查 `npm pack` 清单和 `dist/` 中的三个资产：版本化 `.tgz`、`SHA256SUMS.txt`、`release-manifest.json`。
7. 使用全新隔离 `DSH_HOME` 和 profile 从 `.tgz` 安装；先运行 `scripts/verify-isolated.ps1 -PluginPath <tgz> -WithWebProfile`，再启动该隔离 profile 验证 Host/Client 加载、配置读取与保存、测试通知、主会话完成通知及卸载。
8. 创建 Pull Request，等待 Windows/Ubuntu CI 通过并合入 `main`。
9. 确认 `release/<version>` 与最终提交一致，再在该提交创建并推送 `v<version>` 标签。

Update versioned documentation, run all locked checks, inspect the package contents and three assets, install the archive into a fresh isolated DSH home, and merge the release PR only after both CI platforms pass.

## 自动发布 / Automation

推送 `v*` 标签后，Release workflow 是 GitHub Release 的唯一创建者。工作流重新安装锁定依赖、执行完整检查、校验标签与包版本、重新生成资产，并使用 `docs/releases/v<version>.md` 调用 `gh release create`。

手工 `workflow_dispatch` 只生成 Actions artifact，不创建 Release。不要在标签工作流运行期间手工创建同名 Release；如果 Release 已存在，工作流应失败并由维护者调查，而不是覆盖资产。

The tag workflow is the sole GitHub Release creator. Manual dispatch creates an Actions artifact only. An existing same-name Release is an error to investigate, not permission to overwrite public assets.

## 发布后 / After release

1. 确认 Release 非 Draft，稳定版不标记为 Prerelease。
2. 从 GitHub Release 重新下载全部三个资产。
3. 核对文件名、数量、`SHA256SUMS.txt` 和 `release-manifest.json`。
4. 从下载后的公开 `.tgz` 再次在全新隔离 profile 中安装。
5. Release 说明写明实际验证的 DSH 版本、覆盖行为、Windows/Ubuntu CI 结果、安装命令和已知限制。
6. 确认仓库没有未提交的发布修改，且 `release/<version>` 已推送并保留。

The authoritative checksum is the one attached to the final GitHub Release. Locally and remotely generated npm archives may differ byte-for-byte even when their contents are equivalent.
