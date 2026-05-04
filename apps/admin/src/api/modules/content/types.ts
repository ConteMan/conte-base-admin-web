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
