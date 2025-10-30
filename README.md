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

### Chrome/Edge/Brave

#### Option 1: Download from Releases (Recommended)

1. Go to [Releases](../../releases)
2. Download latest `github-pr-comment-copier-*.zip`
3. Unzip the file
4. Open `chrome://extensions/`
5. Enable "Developer mode" (top right)
6. Click "Load unpacked"
7. Select the unzipped folder

#### Option 2: Build from Source

1. Build the extension: `bun run build`
2. Open `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `dist/` folder

### Firefox

#### Option 1: Download from Releases (Recommended)

1. Go to [Releases](../../releases)
2. Download latest `github-pr-comment-copier-*.zip`
3. Unzip the file
4. Open `about:debugging#/runtime/this-firefox`
5. Click "Load Temporary Add-on..."
6. Select the `manifest.json` file from unzipped folder

**Note:** Firefox requires temporary loading in developer mode. For permanent installation, the extension needs to be signed by Mozilla.

#### Option 2: Build from Source

1. Build the extension: `bun run build`
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select the `manifest.json` file from `dist/` folder

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
├── .github/workflows/
│   └── release.yml     # CI/CD workflow
├── src/
│   ├── content.ts      # Main content script
│   └── styles.css      # Button styling
├── dist/               # Build output
├── manifest.json       # Extension manifest
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript config
└── package.json
```

## Releasing

### Automated Release (via GitHub Actions)

Create a new release by pushing a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will automatically:
1. Build the extension
2. Create a ZIP file
3. Create a GitHub release
4. Attach the ZIP to the release

### Manual Release

```bash
bun run build
cd dist
zip -r ../github-pr-comment-copier.zip .
```
