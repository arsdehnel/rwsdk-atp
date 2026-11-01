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
