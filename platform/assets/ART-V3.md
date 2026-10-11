# Mystic Life · art v3

The user-approved seven-screen reference uses ivory paper, navy ink, antique gold,
painted mountain landscapes, small colored activity objects, and handwritten
Vietnamese headings. The former assets were tiny crops of complete mockups;
some contained baked-in UI labels and borders. This pass uses clean illustrations
created for the actual banner and world-card dimensions.

## Production assets

| Asset | Size | Use |
|---|---:|---|
| `landscape-reading-v3.webp` | 2172 × 724 | Shared panoramic header; faint paper/mountain details in journal and settings |
| `landscape-world-v3.webp` | 1774 × 887 | Game world illustration, sidebar, community spaces, world teaser and settings sync |
| `../src/art.mjs` | SVG | Colored activity pictograms, mood faces, lunar seal |

The illustrations were created with the built-in ImageGen tool. The PNG masters
were exported to WebP at quality 94; no UI text was rasterized into either image.
All captions, date labels, badges and controls remain HTML/SVG. Area cards use
different object positions of the coherent world scene instead of scaled mockup crops.

Fonts are served locally from `fonts/`: Be Vietnam Pro for the interface, Sriracha
for headings. Sriracha's Latin/Vietnamese subset covers U+0020–024F, U+1E00–1EFF,
and U+2000–206F. Both SIL OFL licenses are included. No Google Fonts request is
needed to reproduce the art direction. GSAP remains optional with the existing
Web Animations fallback and reduced-motion setting.

## ImageGen prompts

### Reading panorama

Use case: illustration-story. Asset type: production panoramic banner illustration for the TuTien Vietnamese mystical life journal web app; ONE standalone illustration, not a UI mockup. Make a wide 3:1 horizontal composition, ideally 3072x1024 or greater. Style: richly detailed hand-painted East Asian ink and watercolor fantasy illustration on warm ivory rice paper; beautiful sharp fine ink linework, textured translucent watercolor washes, sophisticated navy blue and muted teal landscape with restrained antique gold sunlight. Match the traditional illustrated cultivation journal aesthetic, a peaceful lived-in landscape, NOT flat vector, NOT pixel art, NOT glossy 3D. Composition: the LEFT 48 percent is pale warm ivory paper negative space for real HTML headings, with only very faint misty mountain silhouettes near the lower edge and a tiny delicate twig near the top left. From CENTER to RIGHT, a layered mountain village on dramatic limestone karsts, graceful tiled temple roofs, mist, pale blue sky, leafy bamboo tree edges. At the RIGHT 25 percent, an elegant young long-black-haired female cultivator in ivory and navy robes with subtle gold trim and red hair ribbon seated at a wooden pavilion reading an open book, shown in side/back three-quarter view facing toward the left, well-proportioned small-scale figure integrated with the scene. Framing: the important figure and roofs live in the MIDDLE vertical third so cropping to a shorter banner never cuts the face; keep the whole figure right of the midpoint. Crisp painted detail, harmonious natural asymmetry and soft paper-edge transitions. Render only the art. No writing, lettering, glyphs, watermark, logo, UI, panels, borders, infographic, calligraphy or buttons.

### World panorama

Use case: stylized-concept. Asset type: clean illustrated game world panorama to embed in a Vietnamese cultivation life journal web app. One standalone scene, wide landscape 2:1 aspect ratio ideally 2048x1024 or larger. A magnificent peaceful cultivation village built on interconnected layered limestone karst mountains above clouds, seen top-down three-quarter aerial view. Central elegant blue-black tiled temple with warm golden windows, to the left an open wooden library pavilion, lower left planted green garden terraces, right a stone training courtyard, lower right a quiet waterside resting pavilion. Clear graceful winding stone paths and bridges connect these places; flowing streams and tall waterfalls wind around terraces, bamboo, bonsai trees, mist, natural rock cliffs. Deep ink navy blue, muted sage and teal, warm ivory mist, antique gold accents; fine sharp hand-painted watercolor and ink line illustration on light textured rice paper, beautiful editorial cultivation journal art. Twilight with one pale golden moon in upper right, soft warmly lit lanterns. Intricately painted architecture with coherent spatial depth. Fill image edge to edge, no blank top strip. NO text, NO signs, NO labels, NO lettering, NO menu, NO border, NO button, NO badges, NO level numbers, NO logo, NO watermark, NO UI overlays. This is pure background art for real HTML labels placed later. Match detailed traditional East Asian watercolor landscape style, not flat vector or pixel art, not 3D.
