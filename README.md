# Yuchen Yan — Personal Homepage

Personal academic homepage for Yuchen Yan, Research Scientist at Aether AI.

## Site

A minimal white-and-black research homepage with personal photography, publications, projects, and an interactive Little Yuchen desktop pet.

## Deployment plan

- Static site on GitHub Pages.
- Website source and optimized photographs are stored in Git.
- Video2World (18.7 MB) and RobotAgentBench (31.1 MB): regular Git after checking browser playback.
- CRIS-0 (98.4 MB): encode a smaller web MP4 before committing. Keep the high-quality original locally or in separate archival storage.
- Prefer H.264/AAC MP4 with `-movflags +faststart`; avoid using Git LFS URLs as HTML `<video>` sources.

The complete site files are being prepared for upload; this README alone is not a deployable website.
