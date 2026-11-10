# RWSDK ATP

Pieces to make RWSDK app development for the AT Protocol easier.

## Local development

### 1. Start watch mode

In this repo:

```sh
pnpm dev
```

tsup will rebuild `dist/` on every file change.

### 2. Link to a consuming project

From the **consuming project's root**:

```sh
pnpm link /path/to/rwsdk-atp
```

pnpm resolves the symlink through the `exports` map, so imports like `rwsdk-atp` will hit the live `dist/` output. Because `pnpm dev` is rebuilding on save, changes show up on the next reload/restart of the consuming project — no re-link needed.

To remove and re-install when you're done (annoyingly `pnpm unlink` only works for globally linked packages).

```sh
pnpm remove rwsdk-atp
pnpm unlink rwsdk-atp
# then reinstall to restore the published version
pnpm add rwsdk-atp@git+https://tangled.org/arsdehnel.com/rwsdk-atp.git
```

> **Note:** `pnpm link` requires the `dist/` folder to exist. Run `pnpm build` at least once before linking if you haven't started `pnpm dev` yet.

## Updating the docs site

The docs site is built with VitePress and served from the `docs-site` branch via tangled.org Sites. The source lives in `./docs` on `main`; the built output is never committed to `main`.

### Build and deploy

```sh
pnpm docs:build

# Commit the built output into a temporary git repo and force-push to docs-site
git -C docs/.vitepress/dist init
git -C docs/.vitepress/dist add -A
git -C docs/.vitepress/dist commit -m "docs: update site"
git -C docs/.vitepress/dist push --force "$(git remote get-url origin)" HEAD:docs-site
rm -rf docs/.vitepress/dist/.git
```

Each deploy replaces the previous content on the `docs-site` branch entirely.

### First-time setup

If the `docs-site` branch does not exist yet, the push above will create it. After that, go to **Settings → Sites** in the tangled.org repo and configure:

- **Branch:** `docs-site`
- **Deploy directory:** `/`
