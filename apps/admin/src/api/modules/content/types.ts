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
