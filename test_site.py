#!/usr/bin/env python3
"""Offline structural regression checks for V38. Standard library only."""
import json,re,unittest
from pathlib import Path
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
if __name__=='__main__':unittest.main(verbosity=2)
