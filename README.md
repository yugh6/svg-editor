# SVG Editor · Lab1 Phase 1

TypeScript 面向对象 SVG 命令行编辑器，实现 [作业要求](phase_cli_1.md) 的第一阶段。支持 rect、circle、ellipse、line、text、g，采用 Command、Composite 与 Memento 模式。

## 运行

需要 Node.js 22 或更新版本。请在本目录执行：

```sh
npm ci
npm run cli
```

```text
svg> init 800 600
svg> create g scene
svg> create rect r1 20 30 120 60 #4a90d9 in scene
svg> create text t1 35 65 "Hello SVG" in scene
svg> move scene 100 20
svg> undo
svg> tree
svg> save demo.svg
```

`help` 显示完整语法。通过 EOF 结束输入：Unix 通常为 Ctrl+D；Windows 可使用 Ctrl+Z 后回车。保存得到的 SVG 可直接在浏览器中打开。

## 检查与构建

```sh
npm run check
npm run build
npm start
```

`check` 包含严格类型检查、71 项自动化测试和生产构建。只运行测试使用 `npm test`。

## 示例回放

PowerShell：

```powershell
$OutputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
Get-Content -Encoding utf8 examples/flowchart.cli | npm run cli
```

Bash：

```sh
npm run cli < examples/flowchart.cli
```

- [两节点流程图脚本](examples/flowchart.cli)、[SVG 输出](examples/flowchart.svg)、[实际运行记录](examples/flowchart.transcript.txt)
- [完整会话脚本](examples/session.cli)、[实际运行记录](examples/session.transcript.txt)
- [作业指定的外部 SVG](examples/other.svg)、[补全 ID 后的保存结果](examples/other-roundtrip.svg)

![两节点流程图](examples/flowchart.svg)

## 提交文档

[doc/README.md](doc/README.md) 包含架构方案、PlantUML 图、设计模式落地、依赖方向、变化点假设、实际迭代记录、一致性自查与质量保证。

仓库：[yugh6/svg-editor](https://github.com/yugh6/svg-editor)。最终版本使用 `final` 标签；Git 历史保留逐步开发过程。
