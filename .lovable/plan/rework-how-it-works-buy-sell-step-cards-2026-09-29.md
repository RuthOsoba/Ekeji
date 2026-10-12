# Rework "How it works" — Buy & Sell step cards

## What changes

Replace the current three-step "How it works" section (Buy / Sell / Wear again) on the landing page (`src/routes/index.tsx`) with two larger editorial cards: **Buy** and **Sell**.

## Behaviour

- Desktop: the cards show their title and a short line; **hovering reveals the steps** (fade/slide in over the card).
- Mobile: steps are always visible under each card title (hover doesn't exist on touch).

## Steps

**Sell**
1. Add item description
2. Set exact measurements
3. Set your price
4. Upload listing
5. Ship using tracked postage
6. Let your outfit be worn again

**Buy**
1. Browse against your measurements and exact fabric
2. Purchase
3. Receive via tracked postage
4. Review and rewear

## Scope

- Edit only the "How it works" section in `src/routes/index.tsx`; no data or other pages change.
- Styling uses the existing design tokens (card-editorial, eyebrow, gold accents) — no hardcoded colours.
- Verify the section on phone (390×844) and desktop (1280×1800) with the preview.
