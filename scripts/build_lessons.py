"""Build the web catalog from original Markdown and reviewed translation maps."""
from pathlib import Path
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
STAGE = ROOT / 'data' / 'stage1'
OUTPUT = ROOT / 'web' / 'data' / 'lessons.json'


def read_source(path):
    text = path.read_text(encoding='utf-8')
    title = text.splitlines()[0].split('. ', 1)[1]
    paragraph = text.split('\n\n')[1].replace('**', '')
    return title, paragraph


def build():
    lessons = []
    seen = []
    expected_vocabulary = set()
    sources = []
    stages = sorted((ROOT / 'data').glob('stage*'), key=lambda p: int(p.name.removeprefix('stage')))
    for stage in stages:
        paragraphs = sorted((stage / 'paragraph').glob('*.md'), key=lambda p: int(p.stem.split('_', 1)[0]))
        if not paragraphs:
            continue
        expected_vocabulary.update(int(source_id) for source_id in re.findall(r'^(\d+)\.', (stage / f'vocab_{stage.name}.txt').read_text(encoding='utf-8-sig'), re.M))
        sources.extend((stage, path) for path in paragraphs)
    for stage, path in sources:
        number = int(path.stem.split('_', 1)[0])
        title, paragraph = read_source(path)
        vocab_text = (stage / 'vocabulary' / path.name).read_text(encoding='utf-8')
        vocab = [
            {'word': word, 'meaning': meaning, 'sourceId': int(source_id)}
            for word, meaning, source_id in re.findall(
                r'^\d+\. \*\*(.+?)\*\* — (.+?) \(mục (\d+)\)$', vocab_text, re.M
            )
        ]
        mapping_path = stage / 'translations' / f'{path.stem}.json'
        mapping = json.loads(mapping_path.read_text(encoding='utf-8'))
        assert mapping['lessonId'] == number, mapping_path
        assert mapping['sourceFile'] == f'paragraph/{path.name}'
        assert mapping['sourceSha256'] == hashlib.sha256(paragraph.encode('utf-8')).hexdigest(), (
            f'{path.name}: source changed; review translations before rebuilding'
        )
        segments = mapping['segments']
        assert segments and len({s['id'] for s in segments}) == len(segments)
        assert ' '.join(s['en'] for s in segments) == paragraph, f'{path.name}: incomplete mapping'
        for segment in segments:
            assert segment['en'].strip() and segment['vi'].strip()
            assert segment['kind'] in ('sentence', 'group')
        assert len(vocab) == 10, path
        for entry in vocab:
            assert re.search(r'(?<![A-Za-z])' + re.escape(entry['word']) + r'(?![A-Za-z])', paragraph, re.I)
            seen.append(entry['sourceId'])
        lessons.append({
            'id': len(lessons) + 1,
            'title': title,
            'titleVi': vocab_text.split('\n\n')[1],
            'wordCount': len(re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", paragraph)),
            'segments': segments,
            'vocabulary': vocab,
        })
    assert lessons, 'No reading material found'
    assert len(seen) == len(set(seen)) and set(seen) == expected_vocabulary, 'Missing or repeated source vocabulary'
    output = json.dumps({'schemaVersion': 1, 'lessons': lessons}, ensure_ascii=False, indent=2) + '\n'
    if '--check' in sys.argv:
        assert OUTPUT.read_text(encoding='utf-8') == output, 'Run python scripts/build_lessons.py to update web data'
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(output, encoding='utf-8', newline='\n')
    print(f'Validated {len(lessons)} lessons in one continuous list, {sum(len(l["segments"]) for l in lessons)} translations, {len(seen)}/{len(expected_vocabulary)} vocabulary entries.')


if __name__ == '__main__':
    build()
