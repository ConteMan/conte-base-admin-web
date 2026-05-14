<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { Button, Space, Tooltip } from 'ant-design-vue';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import { Editor, EditorContent } from '@tiptap/vue-3';

interface Props {
  disabled?: boolean;
  doc?: string;
  html?: string;
  placeholder?: string;
}

interface InsertAssetImageParams {
  alt?: string;
  caption?: string;
  src: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  doc: '',
  html: '',
  placeholder: '',
});

const emit = defineEmits<{
  'update:doc': [value: string];
  'update:html': [value: string];
}>();

const editor = ref<Editor>();
const editorTick = ref(0);

const imageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: '',
      },
      alt: {
        default: '',
      },
      title: {
        default: '',
      },
      dataAlign: {
        default: 'center',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-align') || 'center',
        renderHTML: (attributes: Record<string, any>) => ({
          'data-align': attributes.dataAlign,
        }),
      },
      dataCaption: {
        default: '',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-caption') || '',
        renderHTML: (attributes: Record<string, any>) =>
          attributes.dataCaption
            ? { 'data-caption': attributes.dataCaption }
            : {},
      },
    };
  },
});

const toolbarActions = computed(() => {
  void editorTick.value;
  return [
    {
      active: editor.value?.isActive('paragraph') ?? false,
      key: 'paragraph',
      label: 'P',
      run: () => editor.value?.chain().focus().setParagraph().run(),
      title: '段落',
    },
    {
      active: editor.value?.isActive('heading', { level: 1 }) ?? false,
      key: 'h1',
      label: 'H1',
      run: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run(),
      title: '标题1',
    },
    {
      active: editor.value?.isActive('heading', { level: 2 }) ?? false,
      key: 'h2',
      label: 'H2',
      run: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
      title: '标题2',
    },
    {
      active: editor.value?.isActive('bold') ?? false,
      key: 'bold',
      label: 'B',
      run: () => editor.value?.chain().focus().toggleBold().run(),
      title: '粗体',
    },
    {
      active: editor.value?.isActive('italic') ?? false,
      key: 'italic',
      label: 'I',
      run: () => editor.value?.chain().focus().toggleItalic().run(),
      title: '斜体',
    },
    {
      active: editor.value?.isActive('strike') ?? false,
      key: 'strike',
      label: 'S',
      run: () => editor.value?.chain().focus().toggleStrike().run(),
      title: '删除线',
    },
    {
      active: editor.value?.isActive('blockquote') ?? false,
      key: 'quote',
      label: '""',
      run: () => editor.value?.chain().focus().toggleBlockquote().run(),
      title: '引用',
    },
    {
      active: editor.value?.isActive('bulletList') ?? false,
      key: 'ul',
      label: 'UL',
      run: () => editor.value?.chain().focus().toggleBulletList().run(),
      title: '无序列表',
    },
    {
      active: editor.value?.isActive('orderedList') ?? false,
      key: 'ol',
      label: 'OL',
      run: () => editor.value?.chain().focus().toggleOrderedList().run(),
      title: '有序列表',
    },
    {
      active: editor.value?.isActive('code') ?? false,
      key: 'code',
      label: '</>',
      run: () => editor.value?.chain().focus().toggleCode().run(),
      title: '行内代码',
    },
    {
      active: editor.value?.isActive('codeBlock') ?? false,
      key: 'code-block',
      label: '{}',
      run: () => editor.value?.chain().focus().toggleCodeBlock().run(),
      title: '代码块',
    },
    {
      active: false,
      key: 'hr',
      label: 'HR',
      run: () => editor.value?.chain().focus().setHorizontalRule().run(),
      title: '分割线',
    },
  ];
});

const showPlaceholder = computed(() => {
  void editorTick.value;
  return (
    !props.disabled &&
    Boolean(props.placeholder) &&
    (editor.value?.isEmpty ?? !(props.html || '').trim())
  );
});

const canUndo = computed(() => {
  void editorTick.value;
  return editor.value?.can().chain().focus().undo().run() ?? false;
});

const canRedo = computed(() => {
  void editorTick.value;
  return editor.value?.can().chain().focus().redo().run() ?? false;
});

const isLinkActive = computed(() => {
  void editorTick.value;
  return editor.value?.isActive('link') ?? false;
});

function parseDoc(doc: string) {
  if (!doc.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(doc);
    if (parsed?.type === 'doc') {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function touchEditor() {
  editorTick.value += 1;
}

function normalizeLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function toggleLink() {
  const current = editor.value?.getAttributes('link')?.href || '';
  const input = globalThis.prompt('请输入链接地址', current || 'https://');
  if (input === null) {
    return;
  }
  const href = normalizeLink(input);
  if (!href) {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor.value
    ?.chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href, rel: 'noopener noreferrer', target: '_blank' })
    .run();
}

function emitContent() {
  const currentEditor = editor.value;
  if (!currentEditor) {
    return;
  }
  emit('update:html', currentEditor.getHTML());
  emit('update:doc', JSON.stringify(currentEditor.getJSON()));
}

function setEditorContentFromProps() {
  if (!editor.value) {
    return;
  }
  const fromDoc = parseDoc(props.doc || '');
  if (fromDoc) {
    editor.value.commands.setContent(fromDoc, false);
    return;
  }
  editor.value.commands.setContent(props.html || '', false);
}

function insertAssetImage(params: InsertAssetImageParams) {
  if (!params.src.trim()) {
    return;
  }
  const src = escapeHTMLAttr(params.src.trim());
  const alt = escapeHTMLAttr(params.alt?.trim() || '');
  const caption = params.caption?.trim() || '';
  const escapedCaption = escapeHTMLAttr(caption);
  const imageHTML = `<img src="${src}" alt="${alt}" title="${escapedCaption}" data-align="center" data-caption="${escapedCaption}" />`;
  editor.value
    ?.chain()
    .focus()
    .insertContent(imageHTML)
    .run();
}

function escapeHTMLAttr(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

defineExpose({
  insertAssetImage,
});

onMounted(() => {
  editor.value = new Editor({
    content: parseDoc(props.doc || '') || props.html || '',
    editable: !props.disabled,
    extensions: [
      StarterKit,
      Link.configure({
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        openOnClick: false,
      }),
      imageExtension,
    ],
    onCreate: () => {
      touchEditor();
      emitContent();
    },
    onSelectionUpdate: touchEditor,
    onTransaction: touchEditor,
    onUpdate: () => {
      touchEditor();
      emitContent();
    },
  });
});

onBeforeUnmount(() => {
  editor.value?.destroy();
  editor.value = undefined;
});

watch(
  () => props.disabled,
  (disabled) => {
    editor.value?.setEditable(!disabled);
  },
);

watch(
  () => [props.doc, props.html],
  () => {
    setEditorContentFromProps();
  },
);
</script>

<template>
  <div class="note-rich-editor" :class="{ 'note-rich-editor--disabled': props.disabled }">
    <div v-if="!props.disabled" class="note-rich-editor__toolbar">
      <Space :size="4" wrap>
        <Tooltip v-for="action in toolbarActions" :key="action.key" :title="action.title">
          <Button
            :aria-label="action.title"
            :type="action.active ? 'primary' : 'default'"
            size="small"
            @click="action.run"
          >
            {{ action.label }}
          </Button>
        </Tooltip>
        <Button
          :type="isLinkActive ? 'primary' : 'default'"
          size="small"
          @click="toggleLink"
        >
          Link
        </Button>
        <Button :disabled="!canUndo" size="small" @click="editor?.chain().focus().undo().run()">
          Undo
        </Button>
        <Button :disabled="!canRedo" size="small" @click="editor?.chain().focus().redo().run()">
          Redo
        </Button>
      </Space>
    </div>
    <EditorContent :editor="editor" class="note-rich-editor__content" />
    <div v-if="showPlaceholder" class="note-rich-editor__placeholder">
      {{ props.placeholder }}
    </div>
  </div>
</template>

<style scoped>
.note-rich-editor {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--ant-color-border, #d9d9d9);
  border-radius: 8px;
  background: var(--ant-color-bg-container, #fff);
}

.note-rich-editor--disabled {
  background: var(--ant-color-fill-quaternary, #fafafa);
}

.note-rich-editor__toolbar {
  border-bottom: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  padding: 8px;
  background: var(--ant-color-fill-quaternary, #fafafa);
}

.note-rich-editor__content {
  min-height: 280px;
  padding: 12px 14px;
}

.note-rich-editor__content :deep(.ProseMirror) {
  min-height: 256px;
  outline: none;
  white-space: pre-wrap;
}

.note-rich-editor__content :deep(.ProseMirror p) {
  margin: 0 0 12px;
}

.note-rich-editor__content :deep(.ProseMirror h1),
.note-rich-editor__content :deep(.ProseMirror h2),
.note-rich-editor__content :deep(.ProseMirror h3) {
  margin: 16px 0 12px;
  font-weight: 600;
}

.note-rich-editor__content :deep(.ProseMirror ul),
.note-rich-editor__content :deep(.ProseMirror ol) {
  margin: 0 0 12px;
  padding-left: 24px;
}

.note-rich-editor__content :deep(.ProseMirror blockquote) {
  margin: 0 0 12px;
  border-left: 3px solid var(--ant-color-primary, #1677ff);
  padding-left: 12px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
}

.note-rich-editor__content :deep(.ProseMirror pre) {
  overflow: auto;
  border-radius: 6px;
  background: #111827;
  padding: 12px;
  color: #f9fafb;
}

.note-rich-editor__content :deep(.ProseMirror a) {
  color: var(--ant-color-primary, #1677ff);
  text-decoration: underline;
}

.note-rich-editor__content :deep(.ProseMirror img) {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 12px auto;
}

.note-rich-editor__content :deep(.ProseMirror hr) {
  margin: 18px 0;
  border: none;
  border-top: 1px solid var(--ant-color-border, #d9d9d9);
}

.note-rich-editor__placeholder {
  pointer-events: none;
  position: absolute;
  top: 52px;
  left: 14px;
  color: var(--ant-color-text-quaternary, rgba(0, 0, 0, 0.25));
}
</style>
