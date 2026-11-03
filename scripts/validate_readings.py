"""Check source vocabulary, paired Markdown files, links, and translation maps."""
from collections import Counter
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def validate_stage(stage):
    source = {}
    for line in (stage / f'vocab_{stage.name}.txt').read_text(encoding='utf-8-sig').splitlines():
        match = re.fullmatch(r'(\d+)\. (.*?) — (.*)', line)
        if match:
            source_id, word, meaning = match.groups()
            assert source_id not in source, f'{stage.name}: duplicate source ID {source_id}'
            source[source_id] = (word, meaning)
    paragraphs = sorted((stage / 'paragraph').glob('*.md'), key=lambda p: int(p.stem.split('_')[0]))
    assert source and len(paragraphs) * 10 == len(source), stage
    assert [int(p.stem.split('_')[0]) for p in paragraphs] == list(range(1, len(paragraphs) + 1)), stage
    expected_files = {p.name for p in paragraphs}
    assert {p.name for p in (stage / 'vocabulary').glob('*.md')} == expected_files, stage
    assert {p.stem for p in (stage / 'translations').glob('*.json')} == {p.stem for p in paragraphs}, stage
    used = Counter()
    segment_ids = set()
    translations = 0
    lengths = []
    for path in paragraphs:
        text = path.read_text(encoding='utf-8')
        paragraph = text.split('\n\n')[1]
        plain = paragraph.replace('**', '')
        vocabulary = (stage / 'vocabulary' / path.name).read_text(encoding='utf-8')
        entries = re.findall(r'^(\d+)\. \*\*(.+?)\*\* — (.+?) \(mục (\d+)\)$', vocabulary, re.M)
        assert [int(e[0]) for e in entries] == list(range(1, 11)), path
        for _, word, meaning, source_id in entries:
            original_word, original_meaning = source[source_id]
            assert word.casefold() == original_word.casefold() and meaning == original_meaning, (path, source_id)
            assert re.search(r'(?<![A-Za-z])' + re.escape(word) + r'(?![A-Za-z])', plain, re.I), (path, word)
            assert re.search(r'\*\*' + re.escape(word) + r'\*\*', paragraph, re.I), (path, word)
            used[source_id] += 1
        assert {w.casefold() for w in re.findall(r'\*\*(.*?)\*\*', paragraph)} == {e[1].casefold() for e in entries}, path
        assert f'../vocabulary/{path.name}' in text and f'../paragraph/{path.name}' in vocabulary, path
        count = len(re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", plain))
        assert 75 <= count <= 145 and f'{count} từ trong đoạn đọc.' in text, (path, count)
        lengths.append(count)
        mapping = json.loads((stage / 'translations' / f'{path.stem}.json').read_text(encoding='utf-8'))
        assert mapping['lessonId'] == int(path.stem.split('_')[0]), path
        assert mapping['schemaVersion'] == 1 and mapping['language'] == 'vi', path
        assert mapping['sourceFile'] == f'paragraph/{path.name}', path
        assert mapping['sourceSha256'] == hashlib.sha256(plain.encode('utf-8')).hexdigest(), path
        assert ' '.join(s['en'] for s in mapping['segments']) == plain, path
        for segment in mapping['segments']:
            assert segment['id'] not in segment_ids and segment['kind'] in ('sentence', 'group'), path
            assert segment['en'].strip() and re.search(r'[À-ỹ]', segment['vi']), path
            assert '\ufffd' not in segment['vi'] and not re.search(r'[A-Za-zÀ-ỹ]\?[A-Za-zÀ-ỹ]', segment['vi']), path
            segment_ids.add(segment['id'])
            translations += 1
        assert '\ufffd' not in text + vocabulary, path
    assert set(used) == set(source) and all(count == 1 for count in used.values()), stage
    print(f'{stage.name}: {len(paragraphs)} pairs, {len(used)}/{len(source)} source entries, '
          f'{translations} translations, {min(lengths)}–{max(lengths)} words per reading.')


if __name__ == '__main__':
    for stage in sorted((ROOT / 'data').glob('stage*'), key=lambda p: int(p.name.removeprefix('stage'))):
        if (stage / 'paragraph').is_dir():
            validate_stage(stage)
