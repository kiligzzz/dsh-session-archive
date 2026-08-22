# CHANGELOG

All notable changes to this project are documented in this file.

## [0.1.3] - 2026-08-22

### Fixed

- cordis peerDependencies 改为 `^4.0.0-rc.7 || ^4.0.0`：npm 上无 cordis 4.0.0 正式版（latest=4.0.0-rc.8），原 `^4.0.0` 被商店校验判不满足；宿主内置 4.0.1 兼容。

## [0.1.2] - 2026-08-22

### Changed

- peerDependencies 已覆盖 0.1.1-rc.2 宿主（`^0.1.0-rc.7 || ^0.1.1-rc.1`）。
- README: 默认简体中文（`README.md`），英文切换至 `README.en.md`；新增商店下载数 badge。
