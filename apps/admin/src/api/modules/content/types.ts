export interface ContentProfile {
  name: string;
  title: string;
  summary: string;
}

export interface UpdateContentProfileRequest extends ContentProfile {}

export interface ContentNow {
  title: string;
  description: string;
}

export interface UpdateContentNowRequest extends ContentNow {}

export interface ContentSiteSettings {
  siteName: string;
  defaultLocale: string;
}

export interface UpdateContentSiteSettingsRequest extends ContentSiteSettings {}

export interface ContentProject {
  id: number;
  slug: string;
  name: string;
  summary: string;
  isVisible: boolean;
  displayRank: number;
}

export interface ContentLink {
  id: number;
  label: string;
  url: string;
  group: string;
  displayRank: number;
  isVisible: boolean;
  openInNewTab: boolean;
}

export type ContentNoteStatus = 'draft' | 'offline' | 'published';

export interface ContentNote {
  category: string;
  content: string;
  coverImage: string;
  createdAt: null | string;
  displayAt: null | string;
  excerpt: string;
  featured: boolean;
  id: number;
  locale: string;
  publishedAt: null | string;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  status: ContentNoteStatus;
  tags: string[];
  title: string;
  updatedAt: null | string;
}

export interface CreateContentProjectRequest {
  slug: string;
  name: string;
  summary: string;
  isVisible: boolean;
  displayRank: number;
}

export interface UpdateContentProjectRequest extends CreateContentProjectRequest {}

export interface CreateContentLinkRequest {
  label: string;
  url: string;
  group: string;
  displayRank: number;
  isVisible: boolean;
  openInNewTab: boolean;
}

export interface UpdateContentLinkRequest extends CreateContentLinkRequest {}

export interface CreateContentNoteRequest {
  category: string;
  content: string;
  coverImage?: string;
  createdAt?: string;
  displayAt?: string;
  excerpt: string;
  featured: boolean;
  locale: string;
  publishedAt?: string;
  seoDescription?: string;
  seoTitle?: string;
  slug: string;
  status: ContentNoteStatus;
  tags: string[];
  title: string;
  updatedAt?: string;
}

export interface UpdateContentNoteRequest extends CreateContentNoteRequest {}
