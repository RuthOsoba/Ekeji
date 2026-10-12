# Refresh the website serif while preserving the Ekeji wordmark

## Change
- Keep “Ekeji” in its current Playfair Display typeface.
- Replace the serif used across headings, cards, prices, and page titles with Newsreader, a more characterful editorial face that feels less templated.
- Preserve the existing Manrope body typeface, sizing, colours, spacing, and layout.

## Technical details
- Add a dedicated brand-font token so the wordmark no longer inherits the general heading font.
- Load Newsreader alongside the existing brand and body fonts.
- Point the shared display token to Newsreader and apply the brand token only to the Ekeji wordmark.
- Check the landing page and sell page at the current screen size, and confirm the preview remains error-free.
