import type { RouteRecordRaw } from 'vue-router';

import { SYSTEM_PERMISSION_CODES } from '#/constants';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 100,
      title: '系统管理',
    },
    name: 'System',
    path: '/system',
    children: [
      {
        component: () => import('#/views/system/menu/index.vue'),
        meta: {
          authority: [SYSTEM_PERMISSION_CODES.menuManage],
          icon: 'lucide:list-tree',
          title: '菜单管理',
        },
        name: 'MenuManage',
        path: '/system/menu',
      },
      {
        component: () => import('#/views/system/role/index.vue'),
        meta: {
          authority: [SYSTEM_PERMISSION_CODES.roleManage],
          icon: 'lucide:shield',
          title: '角色管理',
        },
        name: 'RoleManage',
        path: '/system/role',
      },
      {
        component: () => import('#/views/system/admin/index.vue'),
        meta: {
          authority: [SYSTEM_PERMISSION_CODES.adminManage],
          icon: 'lucide:users',
          title: '用户管理',
        },
        name: 'AdminManage',
        path: '/system/admin',
      },
      {
        component: () => import('#/views/system/reference-data/index.vue'),
        meta: {
          authority: [SYSTEM_PERMISSION_CODES.referenceQuery],
          icon: 'lucide:book-open-text',
          title: '标准数据',
        },
        name: 'ReferenceDataManage',
        path: '/system/reference-data',
      },
      {
        component: () => import('#/views/system/enum-registry/index.vue'),
        meta: {
          authority: [SYSTEM_PERMISSION_CODES.metaEnumQuery],
          icon: 'lucide:code-2',
          title: '统一枚举',
        },
        name: 'EnumRegistryManage',
        path: '/system/enum-registry',
      },
      {
        component: () => import('#/views/system/config/index.vue'),
        meta: {
          authority: [SYSTEM_PERMISSION_CODES.configManage],
          icon: 'lucide:sliders-horizontal',
          title: '系统配置',
        },
        name: 'SystemConfigManage',
        path: '/system/config',
      },
      {
        component: () => import('#/views/system/dictionary/index.vue'),
        meta: {
          authority: [SYSTEM_PERMISSION_CODES.dictQuery],
          icon: 'lucide:book-key',
          title: '数据字典',
        },
        name: 'DictionaryManage',
        path: '/system/dictionary',
      },
      {
        component: () => import('#/views/system/legal/index.vue'),
        meta: {
          authority: [SYSTEM_PERMISSION_CODES.legalContentManage],
          icon: 'lucide:scale',
          title: '法务内容',
        },
        name: 'LegalContentManage',
        path: '/system/legal',
      },
      {
        component: () => import('#/views/system/audit-log/index.vue'),
        meta: {
          authority: [SYSTEM_PERMISSION_CODES.auditView],
          icon: 'lucide:scroll-text',
          title: '操作日志',
        },
        name: 'AuditLog',
        path: '/system/audit-log',
      },
    ],
  },
];

export default routes;
