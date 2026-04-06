# create-lidex

Interactive scaffolder for Lidex projects.

## Usage

```bash
npm create lidex@latest
```

or

```bash
pnpm create lidex
```

The CLI asks for:

1. project name
2. theme preset

It currently ships the `default` preset, which generates the full bundled Lidex example site.

## What It Generates

The scaffold writes:

- the current full Lidex example site
- a project-level `package.json`
- a `.gitignore`

It keeps the built-in `Lidex` site copy in the generated content. Your chosen project name is only used for the target directory and generated package metadata.

## Next Steps

After scaffolding:

```bash
cd YOUR_PROJECT_NAME
npm install
npm run dev
```

