"""Verify concatenation without touching the real learning materials."""
import contextlib
import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import build_lessons


class CombinedCatalogTests(unittest.TestCase):
    def write_stage(self, root, stage_number):
        stage = root / 'data' / f'stage{stage_number}'
        for folder in ('paragraph', 'vocabulary', 'translations'):
            (stage / folder).mkdir(parents=True)
        words = ['I', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her']
        text = ' '.join(words) + '.'
        filename = '01_sample.md'
        entries = [f'{i}. **{word}** — nghĩa (mục {(stage_number - 1) * 10 + i:04d})' for i, word in enumerate(words, 1)]
        source = [f'{(stage_number - 1) * 10 + i:04d}. {word} — nghĩa' for i, word in enumerate(words, 1)]
        (stage / f'vocab_stage{stage_number}.txt').write_text('\n'.join(source), encoding='utf-8')
        (stage / 'paragraph' / filename).write_text(f'# 01. Stage {stage_number} story\n\n{text}\n\n---\n', encoding='utf-8')
        (stage / 'vocabulary' / filename).write_text('# 01. Sample\n\nBài mẫu\n\n' + '\n'.join(entries), encoding='utf-8')
        mapping = {'lessonId': 1, 'sourceFile': f'paragraph/{filename}', 'sourceSha256': hashlib.sha256(text.encode()).hexdigest(), 'segments': [{'id': f's{stage_number}-01-01', 'kind': 'sentence', 'en': text, 'vi': 'Một bản dịch.'}]}
        (stage / 'translations' / '01_sample.json').write_text(json.dumps(mapping), encoding='utf-8')

    def test_stages_become_one_continuous_list_and_unprepared_stages_are_skipped(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            # Reverse creation order to exercise numeric source sorting.
            self.write_stage(root, 2)
            self.write_stage(root, 1)
            (root / 'data' / 'stage3').mkdir()
            output = root / 'web' / 'data' / 'lessons.json'
            with patch.object(build_lessons, 'ROOT', root), patch.object(build_lessons, 'OUTPUT', output), patch('sys.argv', ['build_lessons.py']), contextlib.redirect_stdout(io.StringIO()):
                build_lessons.build()
            catalog = json.loads(output.read_text(encoding='utf-8'))
            self.assertEqual([lesson['id'] for lesson in catalog['lessons']], [1, 2])
            self.assertEqual([lesson['title'] for lesson in catalog['lessons']], ['Stage 1 story', 'Stage 2 story'])
            self.assertNotIn('stage', catalog)
            self.assertTrue(all('stage' not in lesson for lesson in catalog['lessons']))
            self.assertEqual(catalog['lessons'][1]['vocabulary'][0]['sourceId'], 11)


if __name__ == '__main__':
    unittest.main()
