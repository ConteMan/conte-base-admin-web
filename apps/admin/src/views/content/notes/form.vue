<script lang="ts" setup>
import type {
  ContentAsset,
  ContentCategory,
  ContentNote,
  ContentNoteStatus,
  ContentTag,
  CreateContentNoteRequest,
} from '#/api';
import type { DxFormSchema, DxSchemaFormExpose } from '#/components/common';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, message, Space } from 'ant-design-vue';

import { z } from '#/adapter/form';
import {
  createContentNote,
  getContentCategories,
  getContentNote,
  getContentTags,
  updateContentNote,
} from '#/api';
import { DxSchemaForm } from '#/components/common';
import { $t } from '#/locales';
import AssetPickerModal from '../assets/components/AssetPickerModal.vue';
import NoteRichEditor from './components/NoteRichEditor.vue';

interface NoteRichEditorExpose {
  insertAssetImage: (params: {
    alt?: string;
    caption?: string;
    src: string;
  }) => void;
}

interface NoteFormValues {
  categoryId: number;
  content: string;
  contentDoc: string;
  contentHtml: string;
  coverImage: string;
  coverAssetId: number;
  createdAt: string;
  displayAt: string;
  excerpt: string;
  featured: boolean;
  locale: string;
  publishedAt: string;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  status: ContentNoteStatus;
  tagIds: number[];
  title: string;
  updatedAt: string;
}

const route = useRoute();
const router = useRouter();
const formRef = ref<DxSchemaFormExpose | null>(null);
const formValues = ref<NoteFormValues>(buildDefaultValues());
const originalValues = ref<NoteFormValues | null>(null);
const loading = ref(false);
const saving = ref(false);
const categoryOptions = ref<ContentCategory[]>([]);
const tagOptions = ref<ContentTag[]>([]);
const assetPickerOpen = ref(false);
const editorRef = ref<NoteRichEditorExpose | null>(null);
const contentHtml = ref('');
const contentDoc = ref('');
const assetPickerMode = ref<'content' | 'cover'>('cover');

const noteId = computed(() => {
  const value = route.params.id;
  return Array.isArray(value) ? value[0] : value;
});
const isEditing = computed(() => Boolean(noteId.value));

const statusOptions = computed(() => [
  { label: $t('system.content.notes.status.draft'), value: 'draft' },
  { label: $t('system.content.notes.status.published'), value: 'published' },
  { label: $t('system.content.notes.status.offline'), value: 'offline' },
]);

const localeOptions = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
];

const featuredOptions = computed(() => [
  { label: $t('system.common.trueText'), value: true },
  { label: $t('system.common.falseText'), value: false },
]);

const pageTitle = computed(() =>
  isEditing.value
    ? $t('system.content.notes.actions.edit')
    : $t('system.content.notes.actions.create'),
);

const schema = computed<DxFormSchema[]>(() => [
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: $t('system.content.notes.fields.titlePlaceholder'),
    },
    fieldName: 'title',
    label: $t('system.content.notes.fields.title'),
    required: true,
    rules: z
      .string()
      .trim()
      .min(1, {
        message: $t('system.content.notes.messages.required'),
      }),
  },
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: $t('system.content.notes.fields.slugPlaceholder'),
    },
    fieldName: 'slug',
    label: $t('system.content.notes.fields.slug'),
    required: true,
    rules: z
      .string()
      .trim()
      .min(1, {
        message: $t('system.content.notes.messages.required'),
      }),
  },
  {
    component: 'Select',
    componentProps: {
      options: statusOptions.value,
      placeholder: $t('system.content.notes.filters.status'),
    },
    fieldName: 'status',
    label: $t('system.content.notes.fields.status'),
    required: true,
    rules: z.enum(['draft', 'published', 'offline']),
  },
  {
    component: 'Select',
    componentProps: {
      options: localeOptions,
    },
    fieldName: 'locale',
    label: $t('system.content.notes.fields.locale'),
    required: true,
    rules: z.string().trim().min(1),
  },
  {
    component: 'DatePicker',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      format: 'YYYY-MM-DD HH:mm:ss',
      showTime: true,
      valueFormat: 'YYYY-MM-DDTHH:mm:ssZ',
    },
    fieldName: 'publishedAt',
    help: $t('system.content.notes.fieldHelp.publishedAt'),
    label: $t('system.content.notes.fields.publishedAt'),
  },
  {
    component: 'DatePicker',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      format: 'YYYY-MM-DD HH:mm:ss',
      showTime: true,
      valueFormat: 'YYYY-MM-DDTHH:mm:ssZ',
    },
    fieldName: 'displayAt',
    help: $t('system.content.notes.fieldHelp.displayAt'),
    label: $t('system.content.notes.fields.displayAt'),
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: false,
      options: categoryOptions.value.map((item) => ({
        label: item.name,
        value: item.id,
      })),
      placeholder: $t('system.content.notes.fields.categoryPlaceholder'),
    },
    fieldName: 'categoryId',
    label: $t('system.content.notes.fields.category'),
    required: true,
    rules: z.number().int().positive(),
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      mode: 'multiple',
      options: tagOptions.value.map((item) => ({
        label: item.name,
        value: item.id,
      })),
      placeholder: $t('system.content.notes.fields.tagsPlaceholder'),
    },
    fieldName: 'tagIds',
    label: $t('system.content.notes.fields.tags'),
  },
  {
    component: 'Textarea',
    componentProps: {
      allowClear: true,
      autoSize: { maxRows: 4, minRows: 2 },
      placeholder: $t('system.content.notes.fields.excerptPlaceholder'),
    },
    fieldName: 'excerpt',
    formItemClass: 'col-span-2',
    label: $t('system.content.notes.fields.excerpt'),
    required: true,
    rules: z
      .string()
      .trim()
      .min(1, {
        message: $t('system.content.notes.messages.required'),
      }),
  },
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: $t('system.content.notes.fields.coverImagePlaceholder'),
    },
    fieldName: 'coverImage',
    label: $t('system.content.notes.fields.coverImage'),
  },
  {
    component: 'Select',
    componentProps: {
      options: featuredOptions.value,
    },
    fieldName: 'featured',
    label: $t('system.content.notes.fields.featured'),
  },
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: $t('system.content.notes.fields.seoTitlePlaceholder'),
    },
    fieldName: 'seoTitle',
    formItemClass: 'col-span-2',
    label: $t('system.content.notes.fields.seoTitle'),
  },
  {
    component: 'Textarea',
    componentProps: {
      allowClear: true,
      autoSize: { maxRows: 4, minRows: 2 },
      placeholder: $t('system.content.notes.fields.seoDescriptionPlaceholder'),
    },
    fieldName: 'seoDescription',
    formItemClass: 'col-span-2',
    label: $t('system.content.notes.fields.seoDescription'),
  },
  {
    component: 'DatePicker',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      format: 'YYYY-MM-DD HH:mm:ss',
      showTime: true,
      valueFormat: 'YYYY-MM-DDTHH:mm:ssZ',
    },
    fieldName: 'createdAt',
    help: $t('system.content.notes.fieldHelp.createdAt'),
    label: $t('system.content.notes.fields.createdAt'),
  },
  {
    component: 'DatePicker',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      format: 'YYYY-MM-DD HH:mm:ss',
      showTime: true,
      valueFormat: 'YYYY-MM-DDTHH:mm:ssZ',
    },
    fieldName: 'updatedAt',
    help: $t('system.content.notes.fieldHelp.updatedAt'),
    label: $t('system.content.notes.fields.updatedAt'),
  },
]);

function buildDefaultValues(): NoteFormValues {
  return {
    categoryId: 0,
    content: '',
    contentDoc: '',
    contentHtml: '',
    coverImage: '',
    coverAssetId: 0,
    createdAt: '',
    displayAt: '',
    excerpt: '',
    featured: false,
    locale: 'zh-CN',
    publishedAt: '',
    seoDescription: '',
    seoTitle: '',
    slug: '',
    status: 'draft',
    tagIds: [],
    title: '',
    updatedAt: '',
  };
}

function toFormValues(note: ContentNote): NoteFormValues {
  const nextContentHtml = note.contentHtml || note.content || '';
  const nextContentDoc = note.contentDoc
    ? JSON.stringify(note.contentDoc)
    : '';
  return {
    categoryId: note.categoryId || note.categoryRef?.id || 0,
    content: nextContentHtml,
    contentDoc: nextContentDoc,
    contentHtml: nextContentHtml,
    coverImage: note.coverImage || '',
    coverAssetId: note.coverAssetId || 0,
    createdAt: note.createdAt || '',
    displayAt: note.displayAt || '',
    excerpt: note.excerpt || '',
    featured: note.featured,
    locale: note.locale || 'zh-CN',
    publishedAt: note.publishedAt || '',
    seoDescription: note.seoDescription || '',
    seoTitle: note.seoTitle || '',
    slug: note.slug,
    status: note.status,
    tagIds: note.tagIds || note.tagRefs?.map((item) => item.id) || [],
    title: note.title,
    updatedAt: note.updatedAt || '',
  };
}

function resolveCategoryName(categoryId: number) {
  return (
    categoryOptions.value.find((item) => item.id === categoryId)?.name || ''
  );
}

function resolveTagNames(tagIds: number[]) {
  const names = new Set<string>();
  for (const id of tagIds) {
    const name = tagOptions.value.find((item) => item.id === id)?.name;
    if (name) {
      names.add(name);
    }
  }
  return [...names];
}

function optionalDate(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function changedDate(
  values: NoteFormValues,
  field: 'createdAt' | 'displayAt' | 'publishedAt' | 'updatedAt',
) {
  const value = optionalDate(values[field]);
  if (!isEditing.value) {
    return value;
  }
  return value === optionalDate(originalValues.value?.[field])
    ? undefined
    : value;
}

function buildPayload(values: NoteFormValues): CreateContentNoteRequest {
  const trimmedHtml = contentHtml.value.trim();
  const payload: CreateContentNoteRequest = {
    category: resolveCategoryName(values.categoryId),
    categoryId: values.categoryId,
    content: trimmedHtml,
    contentHtml: trimmedHtml,
    coverImage: values.coverImage?.trim() || '',
    coverAssetId: values.coverAssetId > 0 ? values.coverAssetId : undefined,
    excerpt: values.excerpt.trim(),
    featured: Boolean(values.featured),
    locale: values.locale || 'zh-CN',
    seoDescription: values.seoDescription?.trim() || '',
    seoTitle: values.seoTitle?.trim() || '',
    slug: values.slug.trim(),
    status: values.status || 'draft',
    tagIds: [...new Set((values.tagIds || []).filter((id) => Number(id) > 0))],
    tags: resolveTagNames(values.tagIds || []),
    title: values.title.trim(),
  };
  const trimmedDoc = contentDoc.value.trim();
  if (trimmedDoc) {
    try {
      payload.contentDoc = JSON.parse(trimmedDoc);
    } catch {
      payload.contentDoc = undefined;
    }
  }
  const publishedAt = changedDate(values, 'publishedAt');
  const displayAt = changedDate(values, 'displayAt');
  const createdAt = changedDate(values, 'createdAt');
  const updatedAt = changedDate(values, 'updatedAt');
  if (publishedAt) payload.publishedAt = publishedAt;
  if (displayAt) payload.displayAt = displayAt;
  if (createdAt) payload.createdAt = createdAt;
  if (updatedAt) payload.updatedAt = updatedAt;
  return payload;
}

async function chooseCoverAsset(asset: ContentAsset) {
  if (assetPickerMode.value === 'content') {
    editorRef.value?.insertAssetImage({
      alt: asset.alt,
      caption: asset.caption,
      src: asset.publicUrl,
    });
    assetPickerOpen.value = false;
    return;
  }
  assetPickerOpen.value = false;
  formValues.value = {
    ...formValues.value,
    coverAssetId: asset.id,
    coverImage: asset.publicUrl,
  };
  await formRef.value?.setValues({
    coverAssetId: asset.id,
    coverImage: asset.publicUrl,
  });
}

async function clearCoverAsset() {
  formValues.value = {
    ...formValues.value,
    coverAssetId: 0,
    coverImage: '',
  };
  await formRef.value?.setValues({
    coverAssetId: 0,
    coverImage: '',
  });
}

async function loadNote() {
  if (!isEditing.value || !noteId.value) {
    formValues.value = buildDefaultValues();
    contentHtml.value = '';
    contentDoc.value = '';
    originalValues.value = null;
    return;
  }
  loading.value = true;
  try {
    const note = await getContentNote(noteId.value);
    const nextValues = toFormValues(note);
    formValues.value = nextValues;
    contentHtml.value = nextValues.contentHtml;
    contentDoc.value = nextValues.contentDoc;
    originalValues.value = nextValues;
  } finally {
    loading.value = false;
  }
}

async function loadTaxonomies() {
  const [categories, tags] = await Promise.all([
    getContentCategories(),
    getContentTags(),
  ]);
  categoryOptions.value = categories.items || [];
  tagOptions.value = tags.items || [];
}

async function saveNote() {
  const validation = await formRef.value?.validate();
  if (!validation) {
    return;
  }
  const values = await formRef.value?.getValues<NoteFormValues>();
  if (!values) {
    return;
  }
  if (!contentHtml.value.trim()) {
    message.error($t('system.content.notes.messages.required'));
    return;
  }
  values.coverAssetId = formValues.value.coverAssetId;
  if (!values.coverImage?.trim() && formValues.value.coverImage) {
    values.coverImage = formValues.value.coverImage;
  }
  const payload = buildPayload(values);

  saving.value = true;
  try {
    if (isEditing.value && noteId.value) {
      await updateContentNote(noteId.value, payload);
      message.success($t('system.content.notes.messages.updateSuccess'));
    } else {
      await createContentNote(payload);
      message.success($t('system.content.notes.messages.createSuccess'));
    }
    await router.push({ name: 'adminNotes' });
  } finally {
    saving.value = false;
  }
}

function goBack() {
  void router.push({ name: 'adminNotes' });
}

onMounted(() => {
  void loadTaxonomies().then(loadNote);
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.content.notes.formDescription')"
    :title="pageTitle"
  >
    <Card :loading="loading">
      <DxSchemaForm
        ref="formRef"
        :reset-values="formValues"
        :schema="schema"
        wrapper-class="grid-cols-1 md:grid-cols-2"
      />
      <div class="mt-4 flex items-center gap-2">
        <Button
          @click="
            assetPickerMode = 'content';
            assetPickerOpen = true;
          "
        >
          从媒体库插入正文图片
        </Button>
      </div>
      <div class="mt-3 text-sm text-[var(--ant-color-text-secondary)]">
        {{ $t('system.content.notes.fields.content') }}
      </div>
      <div class="mt-2">
        <NoteRichEditor
          ref="editorRef"
          v-model:doc="contentDoc"
          v-model:html="contentHtml"
          :placeholder="$t('system.content.notes.fields.contentPlaceholder')"
        />
      </div>
      <div class="mt-4 flex items-center gap-2">
        <Button
          @click="
            assetPickerMode = 'cover';
            assetPickerOpen = true;
          "
        >
          从媒体库选择封面
        </Button>
        <Button @click="clearCoverAsset">清空封面</Button>
      </div>
      <div class="mt-6 flex justify-end">
        <Space>
          <Button @click="goBack">
            {{ $t('system.content.notes.actions.cancel') }}
          </Button>
          <Button :loading="saving" type="primary" @click="saveNote">
            {{ $t('system.content.actions.save') }}
          </Button>
        </Space>
      </div>
    </Card>
    <AssetPickerModal
      :open="assetPickerOpen"
      @cancel="assetPickerOpen = false"
      @select="chooseCoverAsset"
    />
  </Page>
</template>
