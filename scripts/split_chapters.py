"""从 README.md 机械生成九个章节页面；使用 --check 检查副本是否同步。"""

import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def chapter_pages():
    source = (ROOT / "README.md").read_bytes().decode("utf-8")
    headings = list(re.finditer(r"^## ([0-8]) .+$", source, re.MULTILINE))
    if [int(heading[1]) for heading in headings] != list(range(9)):
        raise ValueError("README.md 必须按顺序包含第 0～8 章的二级标题")

    book_title = source.splitlines()[0].removeprefix("# ")
    pages = {}
    for number, heading in enumerate(headings):
        start = 0 if number == 0 else heading.start()
        end = headings[number + 1].start() if number < 8 else len(source)
        # 仅调整相对图片路径，让分章文件在 GitHub 上也能直接阅读。
        body = source[start:end].replace("](images/", "](../images/")
        metadata = {
            "layout": "chapter",
            "title": book_title if number == 0 else heading[0][3:],
            "nav_title": "序章" if number == 0 else f"第{number}章",
            "chapter": number,
            "permalink": "/" if number == 0 else f"/{number}/",
        }
        if number > 0:
            metadata["previous_url"] = "/" if number == 1 else f"/{number - 1}/"
            metadata["previous_title"] = "序章" if number == 1 else f"第{number - 1}章"
        if number < 8:
            metadata["next_url"] = f"/{number + 1}/"
            metadata["next_title"] = f"第{number + 1}章"
        front_matter = "\n".join(
            f"{key}: {json.dumps(value, ensure_ascii=False)}"
            for key, value in metadata.items()
        )
        pages[ROOT / "pages" / f"{number}.md"] = (
            "---\n# Generated from README.md by scripts/split_chapters.py.\n"
            + front_matter
            + "\n---\n"
            + body
        )
    return pages


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="仅检查，不写入文件")
    args = parser.parse_args()
    pages = chapter_pages()
    if args.check:
        stale = [
            str(path.relative_to(ROOT))
            for path, content in pages.items()
            if not path.exists() or path.read_bytes() != content.encode("utf-8")
        ]
        if stale:
            parser.exit(1, "分章副本未同步，请运行 python scripts/split_chapters.py：\n" + "\n".join(stale) + "\n")
        print("PASS: 9 个分章页面与 README.md 同步")
    else:
        (ROOT / "pages").mkdir(exist_ok=True)
        for path, content in pages.items():
            path.write_bytes(content.encode("utf-8"))
        print("已从 README.md 生成 pages/0.md～pages/8.md")


if __name__ == "__main__":
    main()
