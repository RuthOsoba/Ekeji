# Marketplace-first home and “How Ekeji works” page

## Home page
- Replace the tall promotional landing layout with the selected compact, marketplace-focused design.
- Keep the existing celebration photograph in a shallow banner with the headline, one **Sell your outfit** button, and a **Learn how it works** link.
- Remove the home-page “Why Ekeji?”, featured carousel, inline “How it works”, and closing promotional banner so outfits become the main content.
- Bring working marketplace controls directly below the banner: search, Women’s/Men’s/Everyone selection, outfit categories, full filters, result count, and the responsive listing grid.
- Preserve GBP prices, favourite counts, fit guidance, signed-out favourite redirect, and the existing filter behavior. Occasion categories will not return.

## New “How Ekeji works” page
- Add a dedicated `/how-it-works` page linked from the compact home banner.
- Explain the Ekeji name, the belief that meaningful Aso Ebi deserves another celebration, and the marketplace’s focus on precise fit information and tracked delivery.
- Present two clear paths—**Buy** and **Sell**—with three concise steps each.
- Use six cohesive editorial images to visually distinguish the steps rather than relying on decorative cards.
- Include direct links to browse outfits and start selling.

## Visual and responsive treatment
- Follow the selected marketplace-focused composition while retaining Ekeji’s Playfair wordmark, Newsreader display text, Manrope interface text, and existing oxblood/ivory/gold tokens.
- Keep the home dense and merchandise-led on phone and desktop; use imagery and restrained borders instead of marketing-heavy panels.
- Respect reduced-motion preferences and verify that controls and text do not overlap.

## Technical details
- Reuse the established listing filters and listing-card behavior instead of creating a second filtering model.
- Add route-specific title, description, Open Graph, and Twitter metadata for `/how-it-works`; refresh the home metadata to match its marketplace focus.
- Record the shared marketplace-filter implementation decision in `AGENTS.md`.
- Verify the home and story page at phone and desktop sizes, including search, department/category filtering, filter drawer access, listing navigation, and both calls to action.
