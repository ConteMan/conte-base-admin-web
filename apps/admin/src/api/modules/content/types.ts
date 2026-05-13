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
  categoryId: number;
  categoryRef?: TaxonomyReference;
  content: string;
  coverImage: string;
  coverAssetId: number;
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
  tagIds: number[];
  tagRefs?: TaxonomyReference[];
  tags: string[];
  title: string;
  updatedAt: null | string;
}

export interface TaxonomyReference {
  id: number;
  slug: string;
  name: string;
}

export interface ContentCategory {
  id: number;
  parentId?: number;
  slug: string;
  name: string;
  description: string;
  locale: string;
  displayRank: number;
  status: 'active' | 'disabled';
}

export interface ContentTag {
  id: number;
  slug: string;
  name: string;
  description: string;
  locale: string;
  status: 'active' | 'disabled';
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
  categoryId: number;
  content: string;
  coverImage?: string;
  coverAssetId?: number;
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
  tagIds: number[];
  tags: string[];
  title: string;
  updatedAt?: string;
}

export interface UpdateContentNoteRequest extends CreateContentNoteRequest {}

export interface CreateContentCategoryRequest {
  parentId?: number;
  slug: string;
  name: string;
  description?: string;
  locale: string;
  displayRank: number;
  status: 'active' | 'disabled';
}

export interface UpdateContentCategoryRequest extends CreateContentCategoryRequest {}

export interface CreateContentTagRequest {
  slug: string;
  name: string;
  description?: string;
  locale: string;
  status: 'active' | 'disabled';
}

export interface UpdateContentTagRequest extends CreateContentTagRequest {}

export type AssetStatus = 'deleted' | 'failed' | 'ready' | 'uploading';

export interface ContentAsset {
  alt: string;
  bucket: string;
  caption: string;
  createdAt: string;
  createdBy: number;
  deletedAt?: null | string;
  height?: number;
  id: number;
  mimeType: string;
  objectKey: string;
  originalFilename: string;
  publicUrl: string;
  readyAt?: null | string;
  sha256: string;
  sizeBytes: number;
  status: AssetStatus;
  updatedAt: string;
  width?: number;
  etag: string;
}

export interface CreateAssetUploadIntentRequest {
  mimeType: string;
  originalFilename: string;
  sha256?: string;
  sizeBytes: number;
}

export interface CreateAssetUploadIntentResponse {
  asset: ContentAsset;
  assetId: number;
  bucket: string;
  expiresIn: number;
  headers: Record<string, string>;
  objectKey: string;
  publicUrl: string;
  uploadUrl: string;
}

export interface CompleteAssetUploadRequest {
  height?: number;
  width?: number;
}

export interface UpdateAssetRequest {
  alt: string;
  caption: string;
}
