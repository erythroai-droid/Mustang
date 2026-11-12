"""i18n/ru.txt -> i18n/{en,he,ar}.txt through the Translater worker (C:\\agents\\Translater). Never translate site copy by hand.

Run with the worker's own Python (it brings its venv, .env and LLM provider):
    C:\\agents\\Translater\\.venv\\Scripts\\python.exe scripts/translate.py            # all keys
    C:\\agents\\Translater\\.venv\\Scripts\\python.exe scripts/translate.py hero_h1 w1 # only these keys (the rest of each file is kept)
then `npm run i18n`.
"""
import os
import re
import sys
from pathlib import Path

WORKER = Path(os.environ.get("TRANSLATER_DIR", r"C:\agents\Translater"))
ROOT = Path(__file__).resolve().parent.parent
I18N = ROOT / "i18n"
LANGS = {"en": "english_final", "he": "hebrew_final", "ar": "arabic_final"}
CHUNK = 14
CONTEXT = (
    "Это строки интерфейса лендинга коллекционного автомобиля MUSTANG 6663 RT (ручная сборка, тираж 66 машин): "
    "короткие заголовки, подписи, кнопки, маркетинговый текст. Формат каждой строки: `ключ = текст`. "
    "Ключ слева от ` = ` НЕ переводить и не менять, сохранить порядок и количество строк. Переводить только текст справа. "
    "MUSTANG, 6663 RT, MST, e-mail, телефоны, числа и единицы оставлять как есть. Тон — дорогой, лаконичный, как у премиального автобренда."
)
# fixed wording the client asked for, passed to the worker as a hint (it still translates HE/AR itself)
GLOSSARY = {
    "ou_h": "в английском строго одно слово Unbreakable (название блока)",
}
BIDI ="\u200e\u200f\u202a\u202b\u202c\u202d\u202e\u2066\u2067\u2068\u2069"
LINE = re.compile(r"^\s*[" + BIDI + r"]*\s*([a-z][a-z0-9_]*)\s*[" + BIDI + r"]*\s*=\s*(.*)$", re.I)

sys.path.insert(0, str(WORKER))
os.chdir(WORKER)                                   # the worker reads its .env from its own folder
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from core.engine import LLMEngine                  # noqa: E402
from core.pipeline import TechnicalTranslationPipeline  # noqa: E402


def read(lang):
    f = I18N / f"{lang}.txt"
    out = {}
    if f.exists():
        for raw in f.read_text(encoding="utf-8-sig").splitlines():
            m = LINE.match(raw)
            if m:
                out[m.group(1)] = m.group(2).strip()
    return out


HEBREW = re.compile(r"[֐-׿]")
ARABIC = re.compile(r"[؀-ۿ]")


def clean(lang, text):
    """The worker sometimes leaks letters of the other RTL script (seen: Arabic letters inside Hebrew words). Such a line is retried."""
    if lang == "he":
        return not ARABIC.search(text)
    if lang == "ar":
        return not HEBREW.search(text)
    return not (HEBREW.search(text) or ARABIC.search(text))


def parse_block(text):
    out = {}
    for raw in (text or "").splitlines():
        m = LINE.match(raw)
        if m:
            out[m.group(1)] = m.group(2).strip()
    return out


def main():
    src = read("ru")
    only = [k for k in sys.argv[1:] if k in src]
    keys = only or list(src)
    current = {l: read(l) for l in LANGS}
    pipe = TechnicalTranslationPipeline(engine=LLMEngine())

    done = {l: {} for l in LANGS}
    for i in range(0, len(keys), CHUNK):
        part = keys[i:i + CHUNK]
        block = "\n".join(f"{k} = {src[k]}" for k in part)
        print(f"[{i + 1}-{i + len(part)}/{len(keys)}] {part[0]} … {part[-1]}", flush=True)
        notes = [f"{k}: {GLOSSARY[k]}" for k in part if k in GLOSSARY]
        hint = CONTEXT + (" Обязательные термины: " + "; ".join(notes) + "." if notes else "")
        res = pipe.translate_and_verify(block, context_hint=hint, target_style="UI/Microcopy")
        for l, field in LANGS.items():
            got = parse_block(getattr(res, field))
            for k in part:
                if got.get(k) and clean(l, got[k]):
                    done[l][k] = got[k]
        # keys the block answer lost or renamed: one by one, plain text
        for k in part:
            if all(done[l].get(k) for l in LANGS):
                continue
            print(f"  retry {k}", flush=True)
            one = pipe.translate_and_verify(src[k], context_hint=CONTEXT.split(" Формат")[0], target_style="UI/Microcopy")
            for l, field in LANGS.items():
                if not done[l].get(k):
                    v = " ".join(getattr(one, field).split())
                    if clean(l, v):
                        done[l][k] = v
                    else:
                        print(f"  {l}:{k} still mixes scripts, kept the old line", flush=True)

    for l in LANGS:
        merged = {**current[l], **done[l]}
        lines = [f"{k} = {merged[k]}" for k in src if merged.get(k)]
        (I18N / f"{l}.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
        miss = [k for k in src if not merged.get(k)]
        print(f"{l}.txt: {len(lines)} keys" + (f", missing: {', '.join(miss)}" if miss else ""))


if __name__ == "__main__":
    main()
