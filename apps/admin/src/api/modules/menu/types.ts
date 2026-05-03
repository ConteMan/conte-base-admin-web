export type MenuNodeType = 'button' | 'menu';

/** 后端多语言翻译 JSONB 字段 */
export type I18nMap = Record<string, string>;

export interface MenuTreeItem {
  apiMethod?: string;
  apiPath?: string;
  children?: MenuTreeItem[];
  component?: string;
  createdAt?: string;
  icon?: string;
  id: number;
  isActive?: boolean;
  isHidden?: boolean;
  parentId?: number | null;
  permissionCode?: string;
  routeName?: string;
  routePath?: string;
  sortOrder?: number;
  title: string;
  titleEn?: string; // DEPRECATED
  titleI18n?: I18nMap;
  type: MenuNodeType;
  updatedAt?: string;
}

export interface CreateMenuRequest {
  apiMethod?: string;
  apiPath?: string;
  component?: string;
  icon?: string;
  isHidden?: boolean;
  parentId?: null | number;
  permissionCode?: string;
  routeName?: string;
  routePath?: string;
  sortOrder?: number;
  title: string;
  titleEn?: string; // DEPRECATED
  titleI18n?: I18nMap;
  type: MenuNodeType;
}

export interface UpdateMenuRequest extends CreateMenuRequest {
  isActive?: boolean;
}

export interface CreateMenuResponse {
  id: number;
}
