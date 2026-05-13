<script lang="ts" setup>
import type {
  ContentNote,
  ContentNoteStatus,
  CreateContentNoteRequest,
} from '#/api';
import type { DxFormSchema, DxSchemaFormExpose } from '#/components/common';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, Space, message } from 'ant-design-vue';

import { z } from '#/adapter/form';
import {
  createContentNote,
  getContentNote,
  updateContentNote,
} from '#/api';
import { DxSchemaForm } from '#/components/common';
import { $t } from '#/locales';

interface NoteFormValues {
  category: string;
  content: string;
  coverImage: string;
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
  tagsText: string;
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
    rules: z.string().trim().min(1, {
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
    rules: z.string().trim().min(1, {
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
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: $t('system.content.notes.fields.categoryPlaceholder'),
    },
    fieldName: 'category',
    label: $t('system.content.notes.fields.category'),
  },
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: $t('system.content.notes.fields.tagsPlaceholder'),
    },
    fieldName: 'tagsText',
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
    rules: z.string().trim().min(1, {
      message: $t('system.content.notes.messages.required'),
    }),
  },
  {
    component: 'Textarea',
    componentProps: {
      allowClear: true,
      autoSize: { maxRows: 18, minRows: 10 },
      placeholder: $t('system.content.notes.fields.contentPlaceholder'),
    },
    fieldName: 'content',
    formItemClass: 'col-span-2',
    label: $t('system.content.notes.fields.content'),
    required: true,
    rules: z.string().trim().min(1, {
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
    category: '',
    content: '',
    coverImage: '',
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
    tagsText: '',
    title: '',
    updatedAt: '',
  };
}

function toFormValues(note: ContentNote): NoteFormValues {
  return {
    category: note.category || '',
    content: note.content || '',
    coverImage: note.coverImage || '',
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
    tagsText: (note.tags || []).join(', '),
    title: note.title,
    updatedAt: note.updatedAt || '',
  };
}

function parseTags(value: string) {
  const seen = new Set<string>();
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => {
      if (!tag || seen.has(tag)) {
        return false;
      }
      seen.add(tag);
      return true;
    });
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
  return value !== optionalDate(originalValues.value?.[field]) ? value : undefined;
}

function buildPayload(values: NoteFormValues): CreateContentNoteRequest {
  const payload: CreateContentNoteRequest = {
    category: values.category?.trim() || '',
    content: values.content.trim(),
    coverImage: values.coverImage?.trim() || '',
    excerpt: values.excerpt.trim(),
    featured: Boolean(values.featured),
    locale: values.locale || 'zh-CN',
    seoDescription: values.seoDescription?.trim() || '',
    seoTitle: values.seoTitle?.trim() || '',
    slug: values.slug.trim(),
    status: values.status || 'draft',
    tags: parseTags(values.tagsText || ''),
    title: values.title.trim(),
  };
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

async function loadNote() {
  if (!isEditing.value || !noteId.value) {
    formValues.value = buildDefaultValues();
    originalValues.value = null;
    return;
  }
  loading.value = true;
  try {
    const note = await getContentNote(noteId.value);
    const nextValues = toFormValues(note);
    formValues.value = nextValues;
    originalValues.value = nextValues;
  } finally {
    loading.value = false;
  }
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
  void loadNote();
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
  </Page>
</template>
