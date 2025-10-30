# GitHub PR Comment Copier

Chrome extension to copy GitHub PR comments in AI-friendly XML format.

## Features

- Extract conversation and review comments from PRs
- Include file paths, line numbers, and code context
- Structured XML output for AI tools
- One-click copy per comment

## Development

Built with:
- **Vite** for fast bundling
- **TypeScript** for type safety
- **@crxjs/vite-plugin** for Chrome extension support
- **Bun** as package manager

### Setup

```bash
bun install
```

### Build

```bash
bun run build
```

Output in `dist/` folder.

### Development Mode

```bash
bun run dev
```

Hot reload enabled in dev mode.

## Installation

1. Build the extension: `bun run build`
2. Open Chrome: `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `dist/` folder

## Usage

1. Navigate to any GitHub PR page
2. Find "Copy" button next to each comment
3. Click to copy comment as XML
4. Paste into your AI tool

## XML Output Format

```xml
<comment>
  <author>username</author>
  <file>path/to/file.js</file>
  <line>42</line>
  <code>
9: const foo = bar;
10: return baz;
  </code>
  <content>Review comment text</content>
</comment>
```

## Project Structure

```
github-copy-comment/
├── src/
│   ├── content.ts      # Main content script
│   └── styles.css      # Button styling
├── dist/               # Build output
├── manifest.json       # Extension manifest
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript config
└── package.json
```
