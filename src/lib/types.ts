export type Kind = "character" | "location";

export interface Project {
  id: string;
  title: string;
  story: string;
  created_at: string;
  analysed_at: string | null;
  analyser: string | null;
  catalog_approved_at: string | null;
}

export interface CatalogRow {
  id: string;
  project_id: string;
  kind: Kind;
  parent_id: string | null;
  name: string;
  description: string;
  visual: string;
  approved: number;
  excluded: number;
  sort: number;
}

export interface CatalogItem extends CatalogRow {
  image: ImageRow | null;
  variants: CatalogItem[];
}

export interface ChapterRow {
  id: string;
  project_id: string;
  idx: number;
  title: string;
  source: string;
  status: "new" | "planned" | "approved";
  planned_at: string | null;
  approved_at: string | null;
}

export interface PageRow {
  id: string;
  chapter_id: string;
  idx: number;
  prompt: string;
  note: string;
  status: "planned" | "drawn" | "approved";
  approved_at: string | null;
}

export interface Dialogue {
  speaker: string;
  text: string;
}

export interface PanelRow {
  id: string;
  page_id: string;
  idx: number;
  shot: string;
  action: string;
  dialogue: string;
  refs: string;
  image_id: string | null;
  row: number;
  col: number;
  span: number;
}

export interface Panel extends Omit<PanelRow, "dialogue" | "refs"> {
  dialogue: Dialogue[];
  refs: string[];
  image: ImageRow | null;
}

export interface ImageRow {
  id: string;
  project_id: string;
  owner: "catalog" | "panel";
  owner_id: string;
  path: string;
  /** Where the browser reads it: `/media/<file>`. */
  href: string;
  prompt: string;
  provider: string;
  created_at: string;
}

export interface Page extends PageRow {
  panels: Panel[];
}

export interface Chapter extends ChapterRow {
  pages: Page[];
}

export interface PanelDraft {
  shot: string;
  action: string;
  dialogue: Dialogue[];
  /** Catalog item names, resolved to ids when the page is saved. */
  refs: string[];
  row: number;
  col: number;
  span: number;
}

export interface PageDraft {
  panels: PanelDraft[];
}

export interface VariantDraft {
  name: string;
  description: string;
  visual: string;
}

export interface CatalogDraft {
  name: string;
  description: string;
  visual: string;
  variants: VariantDraft[];
}

export interface ChapterDraft {
  title: string;
  text: string;
}

export interface Analysis {
  characters: CatalogDraft[];
  locations: CatalogDraft[];
  chapters: ChapterDraft[];
}
