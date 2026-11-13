# Strike Protocol

A local, CS-inspired browser FPS built with React, Three.js, and Tailwind CSS. No account, server, or external game assets are required. Five bots are enabled by default.

## Play

Choose a loadout and click **Deploy now**. A desktop keyboard and mouse are required for gameplay. The lobby supports compact viewports.

| Control            | Action                   |
| ------------------ | ------------------------ |
| WASD               | Move                     |
| Mouse              | Look                     |
| Left mouse         | Fire                     |
| Right mouse (hold) | Aim / zoom               |
| R                  | Reload                   |
| Shift              | Walk                     |
| Ctrl / C           | Crouch                   |
| Space              | Jump                     |
| Tab (hold)         | Scoreboard               |
| Escape             | Pause and release cursor |

Pointer lock captures the mouse during gameplay. If an embedding browser disallows it, drag the mouse to look.

**Elimination:** one life per round, eliminate every bot, first to five rounds wins. A 90-second timeout awards the round to the bots.

**Deathmatch:** three minutes, respawning bots and player. Maximize kills before time runs out.

Loadouts include AK-47, M4A1-S, and AWP-inspired models with different damage, fire rates, magazines, and reload times. Shots use raycast collision, cover blocks gunfire, and headshots deal triple damage.

Settings offer 3, 5, or 7 bots, three difficulties, mouse sensitivity, and sound volume. Bot count and loadout are applied on deployment. Match state is session-only.

## Verification

The development server is managed by Figma Make; do not start a second server.

```sh
pnpm exec tsc --noEmit
pnpm build
pnpm exec playwright install chromium
pnpm exec playwright test --workers=1 --reporter=line
pnpm format
```

Browser tests expect the existing development server on port 3000 (configured in `playwright.config.ts`). They cover the lobby, settings, movement, shooting, reloading, pause/resume, collision, headshots, bot damage, round completion, and respawns.

This is an independent fan prototype, not affiliated with Valve. Fonts are locally hosted Google Fonts (Barlow, Barlow Condensed, IBM Plex Mono).
