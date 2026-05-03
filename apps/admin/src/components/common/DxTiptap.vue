<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { Button, Input, Popover, Space, Tooltip } from 'ant-design-vue';
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import { Editor, EditorContent } from '@tiptap/vue-3';

import { $t } from '#/locales';

interface Props {
  disabled?: boolean;
  modelValue?: string;
  placeholder?: string;
}

interface LinkSelection {
  from: number;
  to: number;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  modelValue: '',
  placeholder: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editor = ref<Editor>();
const editorStateTick = ref(0);
const linkPopoverOpen = ref(false);
const linkDraft = ref('https://');
const linkSelection = ref<LinkSelection | null>(null);

function touchEditorState() {
  editorStateTick.value += 1;
}

function normalizeLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('/') || /^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function cacheLinkSelection() {
  const selection = editor.value?.state.selection;
  if (!selection) {
    linkSelection.value = null;
    return;
  }

  linkSelection.value = {
    from: selection.from,
    to: selection.to,
  };

  const currentHref = editor.value?.getAttributes('link').href || 'https://';
  linkDraft.value = currentHref;
}

function handleLinkPopoverOpenChange(open: boolean) {
  if (open) {
    cacheLinkSelection();
  }
  linkPopoverOpen.value = open;
}

function applyLink() {
  const href = normalizeLink(linkDraft.value);
  if (!href) {
    linkPopoverOpen.value = false;
    return;
  }

  const chain = editor.value?.chain().focus();
  if (!chain) {
    return;
  }

  if (linkSelection.value) {
    chain.setTextSelection(linkSelection.value);
  }

  const hasSelection =
    !!linkSelection.value &&
    linkSelection.value.from !== linkSelection.value.to;

  if (hasSelection || (editor.value?.isActive('link') ?? false)) {
    chain.extendMarkRange('link').setLink({
      href,
      rel: 'noopener noreferrer',
      target: '_blank',
    });
  } else {
    chain.insertContent(
      `<a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>`,
    );
  }

  chain.run();
  linkPopoverOpen.value = false;
}

function clearLink() {
  editor.value?.chain().focus().extendMarkRange('link').unsetLink().run();
  linkPopoverOpen.value = false;
}

const toolbarActions = computed(() => {
  void editorStateTick.value;

  return [
    {
      active: editor.value?.isActive('bold') ?? false,
      icon: 'B',
      key: 'bold',
      label: $t('system.legal.editor.bold'),
      run: () => editor.value?.chain().focus().toggleBold().run(),
    },
    {
      active: editor.value?.isActive('italic') ?? false,
      icon: 'I',
      key: 'italic',
      label: $t('system.legal.editor.italic'),
      run: () => editor.value?.chain().focus().toggleItalic().run(),
    },
    {
      active: editor.value?.isActive('strike') ?? false,
      icon: 'S',
      key: 'strike',
      label: $t('system.legal.editor.strike'),
      run: () => editor.value?.chain().focus().toggleStrike().run(),
    },
    {
      active: editor.value?.isActive('blockquote') ?? false,
      icon: '""',
      key: 'blockquote',
      label: $t('system.legal.editor.quote'),
      run: () => editor.value?.chain().focus().toggleBlockquote().run(),
    },
    {
      active: editor.value?.isActive('bulletList') ?? false,
      icon: '•',
      key: 'bullet-list',
      label: $t('system.legal.editor.bulletList'),
      run: () => editor.value?.chain().focus().toggleBulletList().run(),
    },
    {
      active: editor.value?.isActive('orderedList') ?? false,
      icon: '1.',
      key: 'ordered-list',
      label: $t('system.legal.editor.orderedList'),
      run: () => editor.value?.chain().focus().toggleOrderedList().run(),
    },
    {
      active: editor.value?.isActive('codeBlock') ?? false,
      icon: '{}',
      key: 'code-block',
      label: $t('system.legal.editor.codeBlock'),
      run: () => editor.value?.chain().focus().toggleCodeBlock().run(),
    },
  ];
});

const canUnsetLink = computed(() => {
  void editorStateTick.value;
  return editor.value?.isActive('link') ?? false;
});

const canUndo = computed(() => {
  void editorStateTick.value;
  return editor.value?.can().chain().focus().undo().run() ?? false;
});

const canRedo = computed(() => {
  void editorStateTick.value;
  return editor.value?.can().chain().focus().redo().run() ?? false;
});

const showPlaceholder = computed(() => {
  void editorStateTick.value;
  return (
    !props.disabled &&
    Boolean(props.placeholder) &&
    (editor.value?.isEmpty ?? !props.modelValue?.trim())
  );
});

onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue || '',
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
    ],
    onCreate: touchEditorState,
    onSelectionUpdate: touchEditorState,
    onTransaction: touchEditorState,
    onUpdate: ({ editor: currentEditor }) => {
      touchEditorState();
      emit('update:modelValue', currentEditor.getHTML());
    },
  });
});

onBeforeUnmount(() => {
  editor.value?.destroy();
  editor.value = undefined;
});

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) {
      return;
    }

    const nextValue = value ?? '';
    if (nextValue !== editor.value.getHTML()) {
      editor.value.commands.setContent(nextValue, false);
    }
  },
);

watch(
  () => props.disabled,
  (disabled) => {
    editor.value?.setEditable(!disabled);
  },
);
</script>

<template>
  <div class="dx-tiptap" :class="{ 'dx-tiptap--disabled': props.disabled }">
    <div v-if="!props.disabled" class="dx-tiptap__toolbar">
      <Space :size="4" wrap>
        <Tooltip
          v-for="action in toolbarActions"
          :key="action.key"
          :title="action.label"
        >
          <Button
            :type="action.active ? 'primary' : 'default'"
            :aria-label="action.label"
            size="small"
            @click="action.run"
          >
            {{ action.icon }}
          </Button>
        </Tooltip>
        <Popover
          :open="linkPopoverOpen"
          placement="bottomLeft"
          trigger="click"
          @open-change="handleLinkPopoverOpenChange"
        >
          <template #content>
            <div class="dx-tiptap__link-popover">
              <div class="dx-tiptap__link-title">
                {{ $t('system.legal.editor.link') }}
              </div>
              <Input
                v-model:value="linkDraft"
                :placeholder="$t('system.legal.editor.linkPlaceholder')"
                size="small"
                @press-enter="applyLink"
              />
              <div class="dx-tiptap__link-hint">
                {{ $t('system.legal.editor.linkHelp') }}
              </div>
              <Space :size="8">
                <Button size="small" @click="linkPopoverOpen = false">
                  {{ $t('system.legal.actions.close') }}
                </Button>
                <Button
                  :disabled="!canUnsetLink"
                  size="small"
                  @click="clearLink"
                >
                  {{ $t('system.legal.editor.unlink') }}
                </Button>
                <Button size="small" type="primary" @click="applyLink">
                  {{ $t('system.legal.editor.applyLink') }}
                </Button>
              </Space>
            </div>
          </template>
          <Tooltip :title="$t('system.legal.editor.link')">
            <Button
              :type="editor?.isActive('link') ? 'primary' : 'default'"
              :aria-label="$t('system.legal.editor.link')"
              size="small"
              @mousedown.prevent="cacheLinkSelection"
            >
              Link
            </Button>
          </Tooltip>
        </Popover>
        <Button
          :disabled="!canUndo"
          size="small"
          @click="editor?.chain().focus().undo().run()"
        >
          {{ $t('system.legal.editor.undo') }}
        </Button>
        <Button
          :disabled="!canRedo"
          size="small"
          @click="editor?.chain().focus().redo().run()"
        >
          {{ $t('system.legal.editor.redo') }}
        </Button>
      </Space>
    </div>
    <EditorContent :editor="editor" class="dx-tiptap__content" />
    <div v-if="showPlaceholder" class="dx-tiptap__placeholder">
      {{ props.placeholder }}
    </div>
  </div>
</template>

<style scoped>
.dx-tiptap {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--ant-color-border, #d9d9d9);
  border-radius: 8px;
  background: var(--ant-color-bg-container, #fff);
}

.dx-tiptap--disabled {
  background: var(--ant-color-fill-quaternary, #fafafa);
}

.dx-tiptap__toolbar {
  border-bottom: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  padding: 8px;
  background: var(--ant-color-fill-quaternary, #fafafa);
}

.dx-tiptap__link-popover {
  display: flex;
  width: 280px;
  flex-direction: column;
  gap: 10px;
}

.dx-tiptap__link-title {
  font-weight: 600;
}

.dx-tiptap__link-hint {
  color: var(--ant-color-text-tertiary, rgba(0, 0, 0, 0.45));
  font-size: 12px;
  line-height: 1.5;
}

.dx-tiptap__content {
  min-height: 240px;
  padding: 12px 14px;
}

.dx-tiptap__content :deep(.ProseMirror) {
  min-height: 216px;
  outline: none;
  white-space: pre-wrap;
}

.dx-tiptap__content :deep(.ProseMirror p) {
  margin: 0 0 12px;
}

.dx-tiptap__content :deep(.ProseMirror h1),
.dx-tiptap__content :deep(.ProseMirror h2),
.dx-tiptap__content :deep(.ProseMirror h3) {
  margin: 16px 0 12px;
  font-weight: 600;
}

.dx-tiptap__content :deep(.ProseMirror ul),
.dx-tiptap__content :deep(.ProseMirror ol) {
  margin: 0 0 12px;
  padding-left: 24px;
}

.dx-tiptap__content :deep(.ProseMirror blockquote) {
  margin: 0 0 12px;
  border-left: 3px solid var(--ant-color-primary, #1677ff);
  padding-left: 12px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
}

.dx-tiptap__content :deep(.ProseMirror pre) {
  overflow: auto;
  border-radius: 6px;
  background: #111827;
  padding: 12px;
  color: #f9fafb;
}

.dx-tiptap__content :deep(.ProseMirror a) {
  color: var(--ant-color-primary, #1677ff);
  text-decoration: underline;
}

.dx-tiptap__placeholder {
  pointer-events: none;
  position: absolute;
  top: 56px;
  left: 15px;
  color: var(--ant-color-text-tertiary, rgba(0, 0, 0, 0.25));
}
</style>
