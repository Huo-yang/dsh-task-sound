/**
 * 本插件的 npm 包名。
 *
 * DSH 用**包名**给浏览器半边与插件配置页做索引，两处都必须与 package.json 的
 * `name` 完全一致：
 *
 * 1. 模块表：`dsh-client-modules` 按包名拼 `window.__DSH_BOOT__` 的图节点 id，
 *    并据此加载 `/plugins/<包名>/client.js`。客户端 bundle 的注册 id 与它不符时，
 *    加载器会报 “bundle loaded without registering …”，整个浏览器半边不会生效。
 * 2. 配置锚点：插件管理页按包名把 `plugins.bundle.config` 槽位派发给该包的详情页；
 *    注册时用别的 key，配置区整块都不会渲染。
 *
 * 构建脚本会断言这里与 package.json 的 `name` 相同，避免两处漂移。
 */
export const PACKAGE_NAME = '@huo-yang/dsh-task-sound'
