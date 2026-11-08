#!/usr/bin/env python3
"""Offline structural regression checks for V38. Standard library only."""
import json,re,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
import build
ROOT=Path(__file__).resolve().parent
class SiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page=(ROOT/'index.html').read_text(encoding='utf-8')
        cls.js=(ROOT/'desktop-pet.js').read_text(encoding='utf-8')
        cls.data=json.loads((ROOT/'profile.json').read_text(encoding='utf-8'))
    def test_pet_replaces_old_widget(self):
        self.assertIn('id="little-yuchen"',self.page)
        self.assertNotIn('class="bug-launcher"',self.page)
        self.assertIn('id="pet-wake"',self.page)
    def test_sections_and_content(self):
        for section in ['about','news','publications','research']:
            self.assertIn(f'id="{section}"',self.page)
        self.assertEqual(len(self.data['publications']),4)
        self.assertEqual(len(self.data['projects']),3)
        self.assertEqual(len(re.findall(r'<img class="photo-slide(?: is-active)?"',self.page)),5)
        self.assertIn('mailto:yuchen6603@gmail.com',self.page)
    def test_local_assets(self):
        for attr,path in re.findall(r'(src|href)="((?:assets/)[^\"]+)"',self.page):
            self.assertTrue((ROOT/path).is_file(),path)
        for path in ['desktop-pet.css','desktop-pet.js','sidebar.css','styles.css','script.js']:
            self.assertTrue((ROOT/path).is_file())
    def test_consent_accessibility(self):
        self.assertIn('const TOTAL = 5',self.js)
        self.assertIn('protectedRects',self.js)
        self.assertIn('prefers-reduced-motion',self.js)
        self.assertIn('Escape',self.js)
        self.assertIn('aria-live="polite"',self.page)
        self.assertIn('id="pet-game-layer" data-bughunt aria-label="Bug Hunt targets" hidden',self.page)
    def test_sidebar_pet_anchor(self):
        self.assertIn('id="pet-sidebar-slot"',self.page)
        self.assertNotIn('id="pet-mobile-slot"',self.page)
        self.assertIn('sidebarSlot.appendChild(pet)',self.js)
        self.assertNotIn('document.body.appendChild(pet)',self.js)
    def test_arrival_and_affiliation(self):
        self.assertIn('class="profile-affiliation" href="https://aetherlabs.ai/"', self.page)
        self.assertIn('class="pet-gripper"', self.page)
        self.assertIn('const SCROLL_TO_INVITE = 80', self.js)
        self.assertIn('hasArrived = true', self.js)
        self.assertIn('event.isTrusted', self.js)
        self.assertIn("setState('dormant')", self.js)
    def test_no_template_tokens(self):
        self.assertIsNone(re.search(r'\{\{[A-Z_]+\}\}',self.page))

class VideoBuildTests(unittest.TestCase):
    def test_deployment_rejects_missing_video_and_lfs_pointer(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(build, 'ROOT', Path(directory)):
            local = 'assets/videos/Example.mp4'
            project = {'local_video': local, 'video_url': 'https://example.com/demo.mp4'}
            with self.assertRaisesRegex(ValueError, 'Missing local video'):
                build.project_video_url(project, required=True)
            path = Path(directory)/local
            path.parent.mkdir(parents=True)
            path.write_bytes(b'version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 1234\n')
            with self.assertRaisesRegex(ValueError, 'LFS pointer'):
                build.project_video_url(project, required=True)
            path.write_bytes(b'not a video')
            with self.assertRaisesRegex(ValueError, 'Expected an MP4'):
                build.project_video_url(project, required=True)

    def test_uploaded_videos_use_exact_filenames_and_playable_bytes(self):
        data = json.loads((ROOT/'profile.json').read_text(encoding='utf-8'))
        for project in data['projects']:
            local = project['local_video']
            path = ROOT/local
            self.assertIn(path.name, {entry.name for entry in path.parent.iterdir()})
            self.assertEqual(build.project_video_url(project, required=True), local)
            self.assertGreater(path.stat().st_size, 1024)
            self.assertIn(f'<source src="{local}" type="video/mp4">', (ROOT/'index.html').read_text(encoding='utf-8'))
if __name__=='__main__':unittest.main(verbosity=2)
