# Yuchen Yan — Personal Academic Homepage (V42)

Personal research homepage of **Yuchen Yan**, Research Scientist at [Aether AI](https://aetherlabs.ai/).

## Current version

**V42** adds a bounded 1480px desktop layout, larger research films and publication typography, and LFS-aware GitHub Pages deployment.

- Minimal white-and-black academic layout with SF Pro–preferred typography (system fallback on Windows/Linux).
- Five-photo personal photography carousel.
- Profile sidebar with aligned name, affiliation, location, and contact links.
- About, News, Publications, and Projects sections.
- Research video preview cards with inline playback of the three MP4s stored in Git LFS.
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
git lfs pull
python build.py --require-local-videos
python test_site.py
python -m http.server 8000 --directory dist
```

Open http://localhost:8000 in your browser.

## Publishing

Pushing to `main` runs `.github/workflows/pages.yml`: check out real LFS files, build and validate the site, then deploy **only `dist/`** to GitHub Pages. The checked-in `index.html` is also regenerated for direct previews. Python 3.12 is configured in the workflow.

1. Verify the biography, publications, links, and images.
2. In `profile.json`, set `content_confirmed` to `true` only after reviewing the content.
3. Run `python build.py --production` to create the production build.
4. Update the workflow build command to include `--production --require-local-videos` when the content is ready for indexing.

**Important:** the current source contains a `noindex, nofollow` robots meta tag while content is unconfirmed. Do not treat an accessible preview as a finalized public launch.

## Research videos

The uploaded MP4s are stored in Git LFS, with these **case-sensitive** paths:

| File | Bytes |
| --- | ---: |
| `assets/videos/Video2World.mp4` | 19,618,053 |
| `assets/videos/RobotAgentBench.mp4` | 32,668,937 |
| `assets/videos/CRIS-0.mp4` | 103,278,735 |

**Storage and playback are separate.** GitHub Pages does not resolve LFS pointers. Before V42, the deployed `Video2World.mp4` URL returned a 133-byte pointer even though the response said `video/mp4`; the generated page still used external project URLs. Lowercase local paths also did not match the uploaded filenames.

The simplest solution here uses the existing deployment: `actions/checkout` with `lfs: true` downloads the real MP4s, `git lfs fsck` checks their integrity, and `build.py --require-local-videos` rejects missing files, pointers, and invalid MP4 headers before packaging them as ordinary static assets in `dist/`. The browser plays same-origin Pages URLs; it never downloads from an LFS pointer endpoint. No re-encoding or additional video host is needed. Deployments download LFS objects and remain subject to the account's LFS quota; visitor playback is served by Pages.

Keep the video filename case consistent in `profile.json`. Use `git lfs pull` before building locally. Videos retain poster-first, click-to-play behavior (`preload="none"`), native controls, and only one playing film at a time.

References: [GitHub LFS limitations](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage), [checkout LFS option](https://github.com/actions/checkout), [Pages artifact deployment](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Source of truth

This GitHub repository is the canonical website source. ChatGPT Space is a project index/archive, not a second independent source tree.
