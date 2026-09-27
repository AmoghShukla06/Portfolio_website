# Amogh Shukla — Portfolio

A personal portfolio styled after the Halo series. The landing page is a Halo-style main menu over a video loop. The main page is a HUD built from the same visual language: a shield bar that tracks reading progress, chamfered Forerunner-cut panels, and a reticle cursor that turns red over anything clickable.

Live: [portfoliojohn117.vercel.app](https://portfoliojohn117.vercel.app)

Built with **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4** and **Framer Motion**.

## What's on the page

| Section | Halo reference | Content |
| --- | --- | --- |
| Main menu (`/`) | Title screen | Keyboard navigable: arrow keys or W/S to move, Enter to select |
| Hero | Spartan dossier | Intro, current role, quick facts |
| Campaign | Mission select | Projects as a list and briefing panel (arrow keys switch missions) |
| Service record | Service record | Work experience |
| Loadout | Weapon loadout | Languages, frameworks, AI and systems tools |
| Firefight | Horde mode | Canvas mini game: grunts, jackals, drones and elites, shields, grenades, medals and synthesized sound. Loaded only when you scroll near it |
| Comms | Comms channel | Contact links |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build locally |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
├── app/
│   ├── page.tsx               # Main menu (video + menu)
│   ├── home/page.tsx          # Portfolio page
│   ├── layout.tsx             # Fonts, metadata
│   ├── opengraph-image.tsx    # Generated social preview card
│   └── globals.css            # Tokens, panels, HUD utilities, keyframes
├── components/
│   ├── Landing.tsx            # Main menu with keyboard navigation
│   ├── Header.tsx             # Sticky HUD bar with the shield progress meter
│   ├── Hero.tsx               # Intro, dossier panel, boot animation
│   ├── Projects.tsx           # Campaign: mission select + side missions
│   ├── Schematic.tsx          # Holographic line art for projects without screenshots
│   ├── Experience.tsx         # Service record
│   ├── Loadout.tsx            # Skills as loadout slots
│   ├── Firefight.tsx          # Lazy-loading wrapper for the mini game
│   ├── FirefightGame.tsx      # Canvas horde-mode game
│   ├── firefightAudio.ts      # Web Audio synthesized sound effects
│   ├── Footer.tsx             # Comms + credits
│   └── GlassShards.tsx        # Falling glass shards in the hero
├── data/portfolio.ts          # All content: projects, experience, skills, links
└── fonts/                     # Handel Gothic, Highway Gothic + Barlow (Google)
```

## Editing content

Everything lives in [`src/data/portfolio.ts`](src/data/portfolio.ts):

- **Projects**: add to `missions`. Give it an `image` from `public/images/`, or pick a `schematic` kind (`chess`, `candles`, `neural`, `wireframe`, `dashboard`, `terminal`, `globe`, `converter`, `game`, `mobile`, `transit`) for generated line art.
- **Smaller projects**: `sideMissions`.
- **Experience**: `serviceRecord`.
- **Skills**: `loadout`.
- **Social links**: `links`.

## Design tokens

| Token | Hex | Use |
| --- | --- | --- |
| `void` | `#03060B` | Page background |
| `hull` | `#0A1422` | Panel fill |
| `holo` | `#5CD6FF` | Hologram cyan: primary accent |
| `visor` | `#F2A93B` | Spartan visor gold: selected and active states only |
| `ink` | `#DDE7F0` | Text |

Motion respects `prefers-reduced-motion`.

---

Halo is a trademark of Microsoft. This is a fan-styled personal site and is not affiliated with Halo Studios. Hero background art by The Adam Taylor.
