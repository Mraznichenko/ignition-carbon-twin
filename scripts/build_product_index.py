#!/usr/bin/env python3
"""Build a compact product index from raw Open Food Facts parquet exports.

Raw exports are huge and stay in raw-data/. This script extracts a small,
browser/server-friendly JSON file that Kimi can use as retrieved context.
"""

from __future__ import annotations

import json
import os
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pyarrow.parquet as pq


ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "raw-data" / "openfood" / "food.parquet"
OUT_PATH = ROOT / "data" / "product_index.json"
LIMIT = int(os.environ.get("PRODUCT_INDEX_LIMIT", "2500"))
COUNTRY_TAGS = {"en:switzerland", "en:france", "en:germany", "en:italy"}


def text_from_multilang(value: Any) -> str:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        for preferred in ("en", "fr", "main"):
            for item in value:
                if isinstance(item, dict) and item.get("lang") == preferred and item.get("text"):
                    return str(item["text"]).strip()
        for item in value:
            if isinstance(item, dict) and item.get("text"):
                return str(item["text"]).strip()
    return ""


def list_from(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value if item]
    if isinstance(value, str) and value:
        return [part.strip() for part in value.split(",") if part.strip()]
    return []


def compact_category(tag: str) -> str:
    return tag.replace("en:", "").replace("fr:", "").replace("-", " ").strip()


def row_to_product(row: dict[str, Any]) -> dict[str, Any] | None:
    name = text_from_multilang(row.get("product_name"))
    if not name:
        return None

    countries = list_from(row.get("countries_tags"))
    categories = list_from(row.get("categories_tags"))
    if countries and not COUNTRY_TAGS.intersection(countries):
        return None
    if not categories:
        return None

    ingredients = text_from_multilang(row.get("ingredients_text"))
    labels = list_from(row.get("labels_tags"))[:8]

    return {
        "code": str(row.get("code") or ""),
        "name": name[:140],
        "brand": str(row.get("brands") or "")[:80],
        "categories": [compact_category(tag) for tag in categories[:8]],
        "categoryTags": categories[:8],
        "countries": countries[:6],
        "ingredients": ingredients[:320],
        "labels": labels,
        "nutriscore": row.get("nutriscore_grade") or None,
        "environmentalScore": row.get("environmental_score_grade") or None,
    }


def main() -> None:
    if not RAW_PATH.exists():
        raise SystemExit(f"Missing {RAW_PATH}. Put Open Food Facts food.parquet there first.")

    parquet = pq.ParquetFile(RAW_PATH)
    columns = [
        "code",
        "product_name",
        "brands",
        "categories_tags",
        "countries_tags",
        "ingredients_text",
        "labels_tags",
        "nutriscore_grade",
        "environmental_score_grade",
    ]

    products: list[dict[str, Any]] = []
    category_counts: Counter[str] = Counter()

    for group_index in range(parquet.metadata.num_row_groups):
        table = parquet.read_row_group(group_index, columns=columns)
        for row in table.to_pylist():
            product = row_to_product(row)
            if not product:
                continue
            products.append(product)
            category_counts.update(product["categories"])
            if len(products) >= LIMIT:
                break
        if len(products) >= LIMIT:
            break

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(
            {
                "source": "Open Food Facts food.parquet",
                "generatedAt": datetime.now(timezone.utc).isoformat(),
                "limit": LIMIT,
                "rows": len(products),
                "categoryHints": [
                    {"category": category, "count": count}
                    for category, count in category_counts.most_common(80)
                ],
                "products": products,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Wrote {OUT_PATH} with {len(products)} products")


if __name__ == "__main__":
    main()
