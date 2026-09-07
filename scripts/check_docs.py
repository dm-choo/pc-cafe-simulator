#!/usr/bin/env python3
"""Check this repository's document links and asset registry without dependencies.

Checks relative inline Markdown link paths, not URL reachability or heading anchors.
Fenced code examples are excluded. This is not a full Markdown/YAML validator.
"""

import argparse
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit


def check(root: Path) -> tuple[list[str], int, int]:
    errors: list[str] = []
    required = [
        "README.md", "AGENTS.md", "docs/README.md",
        "docs/product/plan.md", "docs/production/status.md",
        "docs/production/backlog.md", "docs/tasks/001-first-cafe.md",
        "docs/research/agent-game-development.md", "assets/manifest.json",
        ".github/workflows/docs.yml",
    ]
    for name in required:
        if not (root / name).is_file():
            errors.append(f"Missing required file: {name}")

    documents = sorted(set(root.glob("*.md")) | set((root / "docs").rglob("*.md"))
                       | set((root / ".github").rglob("*.md")))
    links = 0
    for doc in documents:
        content = doc.read_text(encoding="utf-8")
        content = re.sub(r"(?ms)^```[^\n]*\n.*?^```\s*$", "", content)
        for raw in re.findall(r"\[[^\]\n]*\]\(([^)\n]+)\)", content):
            target = raw.strip().split(' "', 1)[0].strip("<>")
            parsed = urlsplit(target)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            links += 1
            dest = (doc.parent / unquote(parsed.path)).resolve()
            if not dest.is_relative_to(root):
                errors.append(f"{doc.relative_to(root)}: link escapes repo: {target}")
            elif not dest.exists():
                errors.append(f"{doc.relative_to(root)}: missing link target: {target}")

    manifest_path = root / "assets/manifest.json"
    if manifest_path.is_file():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            if not isinstance(manifest, dict):
                raise ValueError("manifest must be an object")
            if manifest.get("schemaVersion") != 1 or not isinstance(manifest.get("assets"), list):
                raise ValueError("expected schemaVersion 1 and an assets array")
            seen: set[str] = set()
            for asset in manifest["assets"]:
                if not isinstance(asset, dict):
                    raise ValueError("asset must be an object")
                key = asset.get("id")
                if not isinstance(key, str) or not key.strip() or key in seen:
                    raise ValueError(f"invalid or duplicate asset id: {key!r}")
                seen.add(key)
                for field in ("runtimePath", "source", "usageTerms"):
                    if not isinstance(asset.get(field), str) or not asset[field].strip():
                        raise ValueError(f"asset {key}: missing {field}")
                runtime = (root / asset["runtimePath"]).resolve()
                if not runtime.is_relative_to(root) or not runtime.is_file():
                    raise ValueError(f"asset {key}: runtimePath is not a local file")
        except (ValueError, OSError) as exc:
            errors.append(f"assets/manifest.json: {exc}")
    return errors, len(documents), links


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    errors, docs, links = check(args.root.resolve())
    if errors:
        print("Documentation checks failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"PASS: {docs} Markdown files, {links} local link paths, asset registry.")
    print("External URLs, heading anchors, YAML semantics and game behavior are not checked.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
