import productIndex from "../../../data/product_index.json";

type ProductRecord = {
  code?: string;
  name: string;
  brand?: string;
  categories?: string[];
  categoryTags?: string[];
  countries?: string[];
  ingredients?: string;
  labels?: string[];
  nutriscore?: string | null;
  environmentalScore?: string | null;
};

type ProductIndex = {
  source: string;
  rows: number;
  categoryHints: Array<{ category: string; count: number }>;
  products: ProductRecord[];
};

const index = productIndex as ProductIndex;

const stopWords = new Set([
  "about",
  "should",
  "could",
  "would",
  "carbon",
  "footprint",
  "this",
  "that",
  "with",
  "from",
  "have",
  "want",
  "need",
  "buy",
  "cook",
  "eat",
  "meal",
  "meals",
  "month",
  "week",
  "tonight",
]);

function tokensFor(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !stopWords.has(token));
}

function scoreProduct(product: ProductRecord, tokens: string[]): number {
  const haystack = [
    product.name,
    product.brand,
    product.ingredients,
    ...(product.categories ?? []),
    ...(product.categoryTags ?? []),
    ...(product.labels ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return tokens.reduce((score, token) => {
    if (product.name.toLowerCase().includes(token)) return score + 5;
    if (haystack.includes(token)) return score + 1;
    return score;
  }, 0);
}

export function productKnowledgeForMessage(message: string) {
  const tokens = tokensFor(message);
  if (tokens.length === 0 || index.products.length === 0) {
    return {
      source: index.source,
      rowsAvailable: index.rows,
      matches: [],
      categoryHints: index.categoryHints.slice(0, 12),
    };
  }

  const matches = index.products
    .map((product) => ({ product, score: scoreProduct(product, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => item.product);

  return {
    source: index.source,
    rowsAvailable: index.rows,
    queryTokens: tokens,
    matches,
    categoryHints: index.categoryHints.slice(0, 12),
  };
}
