/** One block of documentation body (portable, no MDX runtime). */
export type DocBlock =
  | { readonly type: 'h2'; readonly text: string }
  | { readonly type: 'h3'; readonly text: string }
  | { readonly type: 'p'; readonly text: string }
  | { readonly type: 'ul'; readonly items: readonly string[] }
  | { readonly type: 'ol'; readonly items: readonly string[] }
  | { readonly type: 'pre'; readonly text: string }
  | { readonly type: 'callout'; readonly variant: 'info' | 'warning'; readonly text: string }
  | {
      readonly type: 'links';
      readonly items: readonly { readonly href: string; readonly label: string }[];
    };

export interface DocDefinition {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: 'Start' | 'Guides' | 'Reference' | 'Operations' | 'Launch';
  readonly lastUpdated: string;
  readonly tags?: readonly string[];
  readonly relatedSlugs?: readonly string[];
  readonly blocks: readonly DocBlock[];
}

/** Sidebar + index (excludes special interactive-only slugs if any). */
export interface DocNavItem {
  readonly slug: string;
  readonly title: string;
  readonly category: DocDefinition['category'];
}
