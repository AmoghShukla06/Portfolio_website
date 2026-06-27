# Amogh Shukla — Portfolio

A personal portfolio website with a Halo-inspired aesthetic: a video landing page, a metallic-black theme, glassmorphism project/experience cards, and falling glass-shard effects in the hero.

Built with **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4**, and **Framer Motion**.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/) for entrance animations
- Local fonts (Handel Gothic, Highway Gothic) via `next/font/local`
- TypeScript

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the development server         |
| `npm run build` | Create a production build            |
| `npm run start` | Run the production build locally     |
| `npm run lint`  | Run ESLint                           |

## Project Structure

```
src/
├── app/
│   ├── page.tsx        # Landing page (video intro → "Jump In")
│   ├── home/page.tsx   # Main page (Header, Hero, Projects, Experience, Footer)
│   ├── layout.tsx      # Root layout + metadata
│   └── globals.css     # Tailwind import, theme tokens, keyframes
├── components/
│   ├── Landing.tsx              # Video intro screen
│   ├── Header.tsx              # Sticky nav with logo + social links
│   ├── Hero.tsx               # Intro section with falling glass shards
│   ├── GlassShards.tsx        # Animated shard overlay (hero)
│   ├── Projects.tsx           # Glassmorphism project cards
│   ├── Experience.tsx         # Work experience cards
│   ├── Footer.tsx             # Social links
│   └── MetallicBackground.tsx # Shared metallic-black backdrop
└── fonts/                     # Local font files + config

public/
├── images/   # Logo, hero background, project screenshots
└── videos/   # Landing background video
```

## Customizing Content

- **Projects** — edit the `projects` array in [`src/components/Projects.tsx`](src/components/Projects.tsx). Drop screenshots in `public/images/` (`project-1.jpg`, `project-2.jpg`, …).
- **Experience** — edit the `experience` array in [`src/components/Experience.tsx`](src/components/Experience.tsx).
- **Social links** — update the URLs in [`src/components/Header.tsx`](src/components/Header.tsx) and [`src/components/Footer.tsx`](src/components/Footer.tsx).
- **Hero text / bio** — [`src/components/Hero.tsx`](src/components/Hero.tsx).

## Deployment

The site is fully static and deploys to any static host. The easiest path is [Vercel](https://vercel.com/new):

1. Push to GitHub.
2. Import the repo in Vercel.
3. Deploy (defaults work — `next build`, output detected automatically).

> **Note:** the landing video (`public/videos/background_theme.webm`) is large. Consider compressing it to keep mobile load times low.
