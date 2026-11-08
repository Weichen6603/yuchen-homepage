# Yuchen Yan — Personal Academic Homepage (V43)

Personal research homepage of **Yuchen Yan**, Research Scientist at [Aether AI](https://aetherlabs.ai/).

## Current version

**V43** adds silent looping video previews and a cinematic, accessible modal player to the bounded 1480px research layout.

- Minimal white-and-black academic layout with SF Pro–preferred typography (system fallback on Windows/Linux).
- Five-photo personal photography carousel.
- Profile sidebar with aligned name, affiliation, location, and contact links.
- About, News, Publications, and Projects sections.
- Silent looping research video previews, hover/focus play overlays, and a full-size modal player with a brief light-frame and scan transition.
- Scroll-triggered Little Yuchen character, portal/gripper entrance, and optional Bug Hunt interaction.

## Repository structure

- `index.html`: generated static homepage
- `templates/`: source templates
- `profile.json`: research content and publication metadata
- `styles.css`, `sidebar.css`, `desktop-pet.css`: styles
- `script.js`, `desktop-pet.js`, `video-player.js`: interactions
- `video-player.css`: preview and modal visuals
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

The public site is **https://yuchenyan.me/**. The owner authorized opening the current site to search engines after connecting the domain and enabling HTTPS. The workflow now builds with `--production --require-local-videos`; this removes the preview-only `noindex` tag.

`profile.json` holds `site_url` and an optional `google_site_verification` token. The build generates the canonical URL, social sharing metadata, Person/ProfilePage structured data, `dist/robots.txt`, and `dist/sitemap.xml`. The sitemap contains only the canonical homepage; section anchors are not separate pages. Preview builds retain `noindex` and overwrite the sitemap with an empty URL set.

To reproduce the deployment locally, run `python build.py --production --require-local-videos` followed by `python test_site.py`. Keep the custom domain configured in GitHub Pages settings (this site deploys through Actions).

For Google Search Console, verify the URL-prefix property `https://yuchenyan.me/` using the owner's HTML verification token, submit `https://yuchenyan.me/sitemap.xml`, and request indexing of the homepage. Verification and indexing requests require the owner's Google session; deploying this configuration alone does not confirm Google indexing.

## Research videos

The uploaded MP4s are stored in Git LFS, with these **case-sensitive** paths:

| File | Bytes |
| --- | ---: |
| `assets/videos/Video2World.mp4` | 19,618,053 |
| `assets/videos/RobotAgentBench.mp4` | 32,668,937 |
| `assets/videos/CRIS-0.mp4` | 103,278,735 |

**Storage and playback are separate.** GitHub Pages does not resolve LFS pointers. Before V42, the deployed `Video2World.mp4` URL returned a 133-byte pointer even though the response said `video/mp4`; the generated page still used external project URLs. Lowercase local paths also did not match the uploaded filenames.

The simplest solution here uses the existing deployment: `actions/checkout` with `lfs: true` downloads the real MP4s, `git lfs fsck` checks their integrity, and `build.py --require-local-videos` rejects missing files, pointers, and invalid MP4 headers before packaging them as ordinary static assets in `dist/`. The browser plays same-origin Pages URLs; it never downloads from an LFS pointer endpoint. No re-encoding or additional video host is needed. Deployments download LFS objects and remain subject to the account's LFS quota; visitor playback is served by Pages.

Keep the video filename case consistent in `profile.json`. Use `git lfs pull` before building locally. Previews start muted and loop only while at least 20% visible; off-screen previews and hidden tabs pause. Reduced-motion and data-saving preferences default to a poster, with an explicit Play preview control. Each card can also pause its preview. Clicking a card opens one native modal dialog, pauses all previews, and starts the full film from the beginning with sound and native controls. Close with Esc, the close button, or the backdrop; closing stops and releases the full film, restores focus, and resumes eligible previews. The entrance uses a short cyan frame/scan effect and respects reduced motion. Browser autoplay restrictions fall back to the poster and explicit controls.

References: [GitHub LFS limitations](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage), [checkout LFS option](https://github.com/actions/checkout), [Pages artifact deployment](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Source of truth

This GitHub repository is the canonical website source. ChatGPT Space is a project index/archive, not a second independent source tree.
