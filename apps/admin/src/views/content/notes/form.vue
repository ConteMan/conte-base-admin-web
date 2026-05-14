<script lang="ts" setup>
import type {
  ContentAsset,
  ContentCategory,
  ContentNote,
  ContentNoteStatus,
  ContentTag,
  CreateContentNoteRequest,
} from '#/api';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, DatePicker, Dropdown, Form, Input, Select, Space, Switch, Tag, message } from 'ant-design-vue';

import {
  createContentNote,
  getContentCategories,
  getContentNote,
  getContentTags,
  updateContentNote,
} from '#/api';
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

type MoreActionKey = 'metadata' | 'toggle-advanced';
type SaveAction = 'default' | 'draft' | 'offline' | 'published';

const DATE_VALUE_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ';
const PREVIEW_ROUTE_PREFIX = '/notes/';

const route = useRoute();
const router = useRouter();

const formValues = ref<NoteFormValues>(buildDefaultValues());
const originalValues = ref<NoteFormValues | null>(null);

const loading = ref(false);
const savingAction = ref<SaveAction | null>(null);
const showAdvancedSettings = ref(false);

const categoryOptions = ref<ContentCategory[]>([]);
const tagOptions = ref<ContentTag[]>([]);

const assetPickerOpen = ref(false);
const assetPickerMode = ref<'content' | 'cover'>('cover');
const editorRef = ref<NoteRichEditorExpose | null>(null);
const metadataRef = ref<HTMLElement | null>(null);

const contentHtml = ref('');
const contentDoc = ref('');

const noteId = computed(() => {
  const value = route.params.id;
  return Array.isArray(value) ? value[0] : value;
});

const isEditing = computed(() => Boolean(noteId.value));
const isSaving = computed(() => savingAction.value !== null);

const pageTitle = computed(() =>
  isEditing.value
    ? $t('system.content.notes.actions.edit')
    : $t('system.content.notes.actions.create'),
);

const statusOptions = computed(() => [
  { label: $t('system.content.notes.status.draft'), value: 'draft' },
  { label: $t('system.content.notes.status.published'), value: 'published' },
  { label: $t('system.content.notes.status.offline'), value: 'offline' },
]);

const localeOptions = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
];

const currentStatus = computed(() => {
  const map: Record<ContentNoteStatus, { color: string; text: string }> = {
    draft: {
      color: 'blue',
      text: $t('system.content.notes.status.draft'),
    },
    offline: {
      color: 'default',
      text: $t('system.content.notes.status.offline'),
    },
    published: {
      color: 'green',
      text: $t('system.content.notes.status.published'),
    },
  };

  return map[formValues.value.status || 'draft'];
});

const moreActions = computed(() => [
  {
    key: 'metadata',
    label: $t('system.content.notes.actions.openMetaPanel'),
  },
  {
    key: 'toggle-advanced',
    label: showAdvancedSettings.value
      ? $t('system.content.notes.actions.hideAdvanced')
      : $t('system.content.notes.actions.showAdvanced'),
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

function validateRequiredFields() {
  if (!formValues.value.title.trim()) return false;
  if (!formValues.value.slug.trim()) return false;
  if (!formValues.value.excerpt.trim()) return false;
  if (!contentHtml.value.trim()) return false;
  if (!formValues.value.categoryId) return false;
  return true;
}

function normalizePreviewBaseUrl() {
  const configured =
    ((import.meta.env as Record<string, string | undefined>)
      .VITE_PUBLIC_WEB_BASE_URL || '').trim();
  const base = configured || globalThis.location.origin;
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function openPreview() {
  const slug = formValues.value.slug.trim();
  if (!slug) {
    message.warning($t('system.content.notes.messages.previewNeedSlug'));
    return;
  }
  const previewUrl = `${normalizePreviewBaseUrl()}${PREVIEW_ROUTE_PREFIX}${encodeURIComponent(slug)}`;
  globalThis.open(previewUrl, '_blank', 'noopener,noreferrer');
}

function handleMoreAction(info: { key: number | string }) {
  const key = info.key as MoreActionKey;
  if (key === 'metadata') {
    metadataRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  showAdvancedSettings.value = !showAdvancedSettings.value;
}

function openAssetPickerForContent() {
  assetPickerMode.value = 'content';
  assetPickerOpen.value = true;
}

function openAssetPickerForCover() {
  assetPickerMode.value = 'cover';
  assetPickerOpen.value = true;
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
}

function clearCoverAsset() {
  formValues.value = {
    ...formValues.value,
    coverAssetId: 0,
    coverImage: '',
  };
}

function syncEditorHTML(value: string) {
  contentHtml.value = value;
  formValues.value.content = value;
  formValues.value.contentHtml = value;
}

function syncEditorDoc(value: string) {
  contentDoc.value = value;
  formValues.value.contentDoc = value;
}

async function loadNote() {
  if (!isEditing.value || !noteId.value) {
    const defaults = buildDefaultValues();
    formValues.value = defaults;
    contentHtml.value = defaults.contentHtml;
    contentDoc.value = defaults.contentDoc;
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

async function saveNote(action: SaveAction) {
  if (!validateRequiredFields()) {
    message.error($t('system.content.notes.messages.required'));
    return;
  }

  const payload = buildPayload(formValues.value);

  savingAction.value = action;
  try {
    if (isEditing.value && noteId.value) {
      await updateContentNote(noteId.value, payload);
    } else {
      await createContentNote(payload);
    }

    if (action === 'draft') {
      message.success($t('system.content.notes.messages.saveDraftSuccess'));
    } else if (action === 'published') {
      message.success($t('system.content.notes.messages.publishSuccess'));
    } else if (action === 'offline') {
      message.success($t('system.content.notes.messages.offlineSuccess'));
    } else if (isEditing.value) {
      message.success($t('system.content.notes.messages.updateSuccess'));
    } else {
      message.success($t('system.content.notes.messages.createSuccess'));
    }

    await router.push({ name: 'adminNotes' });
  } finally {
    savingAction.value = null;
  }
}

function goBack() {
  void router.push({ name: 'adminNotes' });
}

function saveDraft() {
  formValues.value.status = 'draft';
  void saveNote('draft');
}

function publishNote() {
  formValues.value.status = 'published';
  void saveNote('published');
}

function offlineNote() {
  formValues.value.status = 'offline';
  void saveNote('offline');
}

onMounted(async () => {
  loading.value = true;
  try {
    await loadTaxonomies();
    await loadNote();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Page
    auto-content-height
    :description="$t('system.content.notes.formDescription')"
    :title="pageTitle"
  >
    <div class="note-editor-workbench" data-test-id="note-editor-workbench">
      <Card class="note-editor-workbench__header" :bordered="false">
        <div class="note-editor-workbench__header-inner">
          <div class="note-editor-workbench__header-left">
            <Button @click="goBack">{{ $t('system.content.notes.actions.cancel') }}</Button>
            <div>
              <div class="note-editor-workbench__headline">{{ pageTitle }}</div>
              <div class="note-editor-workbench__subline">
                {{ $t('system.content.notes.formDescription') }}
              </div>
            </div>
            <Tag :color="currentStatus.color">{{ currentStatus.text }}</Tag>
          </div>
          <div class="note-editor-workbench__header-actions">
            <Button @click="openPreview">{{ $t('system.content.notes.actions.preview') }}</Button>
            <Dropdown :menu="{ items: moreActions, onClick: handleMoreAction }" trigger="click">
              <Button>{{ $t('system.content.notes.actions.moreSettings') }}</Button>
            </Dropdown>
            <Button
              :loading="savingAction === 'draft'"
              :disabled="loading || isSaving"
              @click="saveDraft"
            >
              {{ $t('system.content.notes.actions.saveDraft') }}
            </Button>
            <Button
              :loading="savingAction === 'offline'"
              :disabled="loading || isSaving"
              @click="offlineNote"
            >
              {{ $t('system.content.notes.actions.offline') }}
            </Button>
            <Button
              type="primary"
              :loading="savingAction === 'published'"
              :disabled="loading || isSaving"
              @click="publishNote"
            >
              {{ $t('system.content.notes.actions.publish') }}
            </Button>
          </div>
        </div>
      </Card>

      <div class="note-editor-workbench__body">
        <div class="note-editor-workbench__main">
          <Card :loading="loading" class="note-editor-workbench__main-card">
            <Form layout="vertical">
              <div class="note-editor-workbench__grid-2">
                <Form.Item :label="$t('system.content.notes.fields.title')" required>
                  <Input
                    v-model:value="formValues.title"
                    :placeholder="$t('system.content.notes.fields.titlePlaceholder')"
                    allow-clear
                  />
                </Form.Item>
                <Form.Item :label="$t('system.content.notes.fields.slug')" required>
                  <Input
                    v-model:value="formValues.slug"
                    :placeholder="$t('system.content.notes.fields.slugPlaceholder')"
                    allow-clear
                  />
                </Form.Item>
              </div>

              <Form.Item :label="$t('system.content.notes.fields.content')" required>
                <Space class="note-editor-workbench__editor-tools" wrap>
                  <Button @click="openAssetPickerForContent">
                    {{ $t('system.content.notes.actions.insertImage') }}
                  </Button>
                </Space>
                <NoteRichEditor
                  ref="editorRef"
                  :disabled="loading || isSaving"
                  :doc="contentDoc"
                  :html="contentHtml"
                  :placeholder="$t('system.content.notes.fields.contentPlaceholder')"
                  @update:doc="syncEditorDoc"
                  @update:html="syncEditorHTML"
                />
              </Form.Item>
            </Form>
          </Card>
        </div>

        <div ref="metadataRef" class="note-editor-workbench__side">
          <Card :loading="loading" class="note-editor-workbench__side-card" data-test-id="note-editor-metadata">
            <Form layout="vertical">
              <div class="note-editor-workbench__section-title">
                {{ $t('system.content.notes.sections.publishMeta') }}
              </div>
              <Form.Item :label="$t('system.content.notes.fields.status')" required>
                <Select
                  v-model:value="formValues.status"
                  :options="statusOptions"
                  :placeholder="$t('system.content.notes.filters.status')"
                />
              </Form.Item>
              <Form.Item :label="$t('system.content.notes.fields.locale')">
                <Select v-model:value="formValues.locale" :options="localeOptions" />
              </Form.Item>
              <Form.Item :label="$t('system.content.notes.fields.featured')">
                <Switch v-model:checked="formValues.featured" />
              </Form.Item>

              <div class="note-editor-workbench__section-title">
                {{ $t('system.content.notes.sections.taxonomy') }}
              </div>
              <Form.Item :label="$t('system.content.notes.fields.category')" required>
                <Select
                  v-model:value="formValues.categoryId"
                  :options="categoryOptions.map((item) => ({ label: item.name, value: item.id }))"
                  :placeholder="$t('system.content.notes.fields.categoryPlaceholder')"
                  show-search
                />
              </Form.Item>
              <Form.Item :label="$t('system.content.notes.fields.tags')">
                <Select
                  v-model:value="formValues.tagIds"
                  mode="multiple"
                  :options="tagOptions.map((item) => ({ label: item.name, value: item.id }))"
                  :placeholder="$t('system.content.notes.fields.tagsPlaceholder')"
                  show-search
                />
              </Form.Item>

              <div class="note-editor-workbench__section-title">
                {{ $t('system.content.notes.sections.coverSummary') }}
              </div>
              <Form.Item :label="$t('system.content.notes.fields.coverImage')">
                <Input
                  v-model:value="formValues.coverImage"
                  :placeholder="$t('system.content.notes.fields.coverImagePlaceholder')"
                  allow-clear
                />
                <Space class="note-editor-workbench__cover-actions" wrap>
                  <Button @click="openAssetPickerForCover">
                    {{ $t('system.content.notes.actions.chooseCover') }}
                  </Button>
                  <Button danger ghost @click="clearCoverAsset">
                    {{ $t('system.content.notes.actions.clearCover') }}
                  </Button>
                </Space>
              </Form.Item>
              <Form.Item :label="$t('system.content.notes.fields.excerpt')" required>
                <Input.TextArea
                  v-model:value="formValues.excerpt"
                  :auto-size="{ minRows: 2, maxRows: 4 }"
                  :placeholder="$t('system.content.notes.fields.excerptPlaceholder')"
                  allow-clear
                />
              </Form.Item>

              <div class="note-editor-workbench__section-title">
                {{ $t('system.content.notes.sections.seo') }}
              </div>
              <Form.Item :label="$t('system.content.notes.fields.seoTitle')">
                <Input
                  v-model:value="formValues.seoTitle"
                  :placeholder="$t('system.content.notes.fields.seoTitlePlaceholder')"
                  allow-clear
                />
              </Form.Item>
              <Form.Item :label="$t('system.content.notes.fields.seoDescription')">
                <Input.TextArea
                  v-model:value="formValues.seoDescription"
                  :auto-size="{ minRows: 2, maxRows: 4 }"
                  :placeholder="$t('system.content.notes.fields.seoDescriptionPlaceholder')"
                  allow-clear
                />
              </Form.Item>

              <div class="note-editor-workbench__section-title">
                {{ $t('system.content.notes.sections.schedule') }}
              </div>
              <Form.Item :label="$t('system.content.notes.fields.publishedAt')">
                <DatePicker
                  v-model:value="formValues.publishedAt"
                  class="w-full"
                  format="YYYY-MM-DD HH:mm:ss"
                  :value-format="DATE_VALUE_FORMAT"
                  show-time
                  allow-clear
                />
              </Form.Item>
              <Form.Item :label="$t('system.content.notes.fields.displayAt')">
                <DatePicker
                  v-model:value="formValues.displayAt"
                  class="w-full"
                  format="YYYY-MM-DD HH:mm:ss"
                  :value-format="DATE_VALUE_FORMAT"
                  show-time
                  allow-clear
                />
              </Form.Item>

              <template v-if="showAdvancedSettings">
                <div class="note-editor-workbench__section-title">
                  {{ $t('system.content.notes.sections.advanced') }}
                </div>
                <Form.Item :label="$t('system.content.notes.fields.createdAt')">
                  <DatePicker
                    v-model:value="formValues.createdAt"
                    class="w-full"
                    format="YYYY-MM-DD HH:mm:ss"
                    :value-format="DATE_VALUE_FORMAT"
                    show-time
                    allow-clear
                  />
                </Form.Item>
                <Form.Item :label="$t('system.content.notes.fields.updatedAt')">
                  <DatePicker
                    v-model:value="formValues.updatedAt"
                    class="w-full"
                    format="YYYY-MM-DD HH:mm:ss"
                    :value-format="DATE_VALUE_FORMAT"
                    show-time
                    allow-clear
                  />
                </Form.Item>
              </template>
            </Form>
          </Card>
        </div>
      </div>
    </div>

    <AssetPickerModal
      v-model:open="assetPickerOpen"
      @cancel="assetPickerOpen = false"
      @confirm="chooseCoverAsset"
    />
  </Page>
</template>

<style scoped>
.note-editor-workbench {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.note-editor-workbench__header {
  border-radius: 12px;
}

.note-editor-workbench__header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.note-editor-workbench__header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
}

.note-editor-workbench__headline {
  font-size: 16px;
  font-weight: 600;
}

.note-editor-workbench__subline {
  color: rgb(100 116 139);
  font-size: 12px;
}

.note-editor-workbench__header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.note-editor-workbench__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  align-items: start;
  gap: 16px;
}

.note-editor-workbench__main-card,
.note-editor-workbench__side-card {
  border-radius: 12px;
}

.note-editor-workbench__grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.note-editor-workbench__editor-tools {
  margin-bottom: 8px;
}

.note-editor-workbench__section-title {
  margin: 4px 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: rgb(30 41 59);
}

.note-editor-workbench__cover-actions {
  margin-top: 8px;
}

@media (width <= 1200px) {
  .note-editor-workbench__body {
    grid-template-columns: minmax(0, 1fr);
  }

  .note-editor-workbench__side {
    order: 2;
  }
}

@media (width <= 768px) {
  .note-editor-workbench__grid-2 {
    grid-template-columns: minmax(0, 1fr);
  }

  .note-editor-workbench__header-left {
    min-width: 0;
    width: 100%;
  }
}
</style>
