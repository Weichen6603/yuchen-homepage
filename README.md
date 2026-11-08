# Yuchen Yan — Personal Academic Homepage (V41)

Personal research homepage of **Yuchen Yan**, Research Scientist at [Aether AI](https://aetherlabs.ai/).

## Current version

**V41** is the current website source in this repository. The older V38 title in the previous README described an earlier layout iteration; it was not the current release label.

- Minimal white-and-black academic layout with SF Pro–preferred typography (system fallback on Windows/Linux).
- Five-photo personal photography carousel.
- Profile sidebar with aligned name, affiliation, location, and contact links.
- About, News, Publications, and Projects sections.
- Research video preview cards with inline video playback where supported; video assets are not yet committed.
- Scroll-triggered Little Yuchen character, portal/gripper entrance, and optional Bug Hunt interaction.

## Repository structure

- `index.html`: generated static homepage
- `templates/`: source templates
- `profile.json`: research content and publication metadata
- `styles.css`, `sidebar.css`, `desktop-pet.css`: styles
- `script.js`, `desktop-pet.js`: interactions
- `assets/`: photography, portrait, and character assets
- `build.py`: generate site and deployable `dist/`
- `make_preview.py`: standalone offline preview
- `test_site.py`: static validation

## Local development

Requires Python 3.12+ for the project build scripts.

```powershell
python build.py
python test_site.py
python -m http.server 8000
```

Open http://localhost:8000 in your browser.

## Publishing

The repository contains a ready-to-view `index.html`, but production publication is a separate step.

1. Verify the biography, publications, links, and images.
2. In `profile.json`, set `content_confirmed` to `true` only after reviewing the content.
3. Run `python build.py --production` to create the production build.
4. Deploy the generated static files to GitHub Pages, ensuring the root URL and relative asset paths work.

**Important:** the current source contains a `noindex, nofollow` robots meta tag while content is unconfirmed. Do not treat an accessible preview as a finalized public launch.

## Research videos

The original MP4 files remain on the owner's computer and are not yet in the repository:

| File | Local size | Suggested next step |
| --- | ---: | --- |
| `video2world.mp4` | 18.7 MB | Browser-ready MP4 in regular Git |
| `robotagentbench.mp4` | 31.1 MB | Browser-ready MP4 in regular Git |
| `cris0.mp4` | 98.4 MB | Compress a web playback copy before committing |

For browser playback, prefer H.264/AAC MP4 with `-movflags +faststart`. Avoid using a Git LFS pointer URL as an HTML `<video>` source. The large original files may be archived separately.

## Source of truth

This GitHub repository is the canonical website source. ChatGPT Space is a project index/archive, not a second independent source tree.
