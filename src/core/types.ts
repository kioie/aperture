export interface SymbolNode {
  id: string;
  file: string;
  name: string;
  kind: "function" | "class" | "method" | "interface" | "module";
  startLine: number;
  endLine: number;
  tokens: number;
}

export interface SymbolEdge {
  from: string;
  to: string;
  kind: "import" | "call" | "contain";
  weight: number;
}

export interface CodeGraph {
  nodes: Map<string, SymbolNode>;
  edges: SymbolEdge[];
}

export interface FocusBundle {
  task: string;
  budget: number;
  files: BundleFile[];
  tokens: number;
  symbolsSelected: number;
  symbolsTotal: number;
  explain: string[];
}

export interface BundleFile {
  path: string;
  score: number;
  tokens: number;
  ranges: Array<{ start: number; end: number }>;
  reasons: string[];
}

export interface FocusOptions {
  repo: string;
  task: string;
  budget: number;
  include?: string[];
  exclude?: string[];
  seedCount?: number;
}

export interface IndexStats {
  files: number;
  symbols: number;
  edges: number;
}
