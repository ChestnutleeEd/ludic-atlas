# Game Cover Assets

Place real game cover images in this directory when assets are ready.

Naming rule:

```text
/covers/{game-id}.jpg
```

Examples:

```text
public/covers/zelda-botw.jpg
public/covers/elden-ring.jpg
public/covers/black-myth-wukong.jpg
```

The `game-id` must match the `id` field in `src/data/games.ts`.

Current MVP behavior:

- Do not download cover images automatically.
- Do not store external API URLs in `coverImage`.
- If a `.jpg` file is missing or fails to load, the UI falls back to the gradient cover placeholder.
