import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Unlink,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ColorPicker } from '../ui/color-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface RichTextEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  editable?: boolean;
  showToolbar?: boolean;
  language?: 'en' | 'fr';
  onLanguageChange?: (language: 'en' | 'fr') => void;
  showLanguageToggle?: boolean;
  minHeight?: string;
}

interface LinkDialogState {
  isOpen: boolean;
  url: string;
  text: string;
}

const ToolbarButton = ({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <Button
    type="button"
    size="icon"
    variant="ghost"
    className={cn(
      'h-8 w-8',
      isActive && 'bg-gray-200 dark:bg-gray-700',
      disabled && 'opacity-50 cursor-not-allowed',
    )}
    onClick={onClick}
    disabled={disabled}
    title={title}
  >
    {children}
  </Button>
);

const ToolbarDivider = () => <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />;

export function RichTextEditor({
  content,
  onUpdate,
  placeholder = 'Start typing...',
  maxLength,
  className,
  editable = true,
  showToolbar = true,
  language = 'en',
  onLanguageChange,
  showLanguageToggle = false,
  minHeight = '100px',
}: RichTextEditorProps) {
  const [linkDialog, setLinkDialog] = useState<LinkDialogState>({
    isOpen: false,
    url: '',
    text: '',
  });
  const [characterCount, setCharacterCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      setCharacterCount(text.length);
      onUpdate(html);
    },
    editorProps: {
      attributes: {
        class: cn('prose prose-sm dark:prose-invert max-w-none focus:outline-none', 'px-4 py-3'),
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      setCharacterCount(editor.getText().length);
    }
  }, [editor]);

  const openLinkDialog = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const previousUrl = editor?.getAttributes('link').href || '';
    const selectedText = editor?.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' ',
    );

    setLinkDialog({
      isOpen: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      url: previousUrl,
      text: selectedText || '',
    });
  };

  const insertLink = () => {
    if (!editor) return;

    if (linkDialog.url) {
      if (linkDialog.text && editor.state.selection.empty) {
        // Insert new text with link
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'text',
            text: linkDialog.text,
            marks: [{ type: 'link', attrs: { href: linkDialog.url } }],
          })
          .run();
      } else {
        // Apply link to selected text
        editor.chain().focus().setLink({ href: linkDialog.url }).run();
      }
    }

    setLinkDialog({ isOpen: false, url: '', text: '' });
  };

  const removeLink = () => {
    editor?.chain().focus().unsetLink().run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border border-gray-300 dark:border-gray-600 rounded-lg', className)}>
      {/* Toolbar */}
      {showToolbar && editable && (
        <div className="border-b border-gray-300 dark:border-gray-600 p-2 flex flex-wrap gap-1 items-center bg-gray-50 dark:bg-gray-800 rounded-t-lg">
          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Cmd+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Cmd+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline (Cmd+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Links */}
          <ToolbarButton
            onClick={openLinkDialog}
            isActive={editor.isActive('link')}
            title="Insert Link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          {editor.isActive('link') && (
            <ToolbarButton onClick={removeLink} title="Remove Link">
              <Unlink className="h-4 w-4" />
            </ToolbarButton>
          )}

          <ToolbarDivider />

          {/* Text Color */}
          <div className="ml-1">
            <ColorPicker
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              value={editor.getAttributes('textStyle').color || '#000000'}
              onChange={(color) => editor.chain().focus().setColor(color).run()}
              className="h-8 w-24 text-xs"
            />
          </div>

          {/* Language Toggle */}
          {showLanguageToggle && onLanguageChange && (
            <>
              <ToolbarDivider />
              <Select value={language} onValueChange={onLanguageChange}>
                <SelectTrigger className="h-8 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="fr">FR</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      )}

      {/* Editor Content */}
      <div className={cn('overflow-y-auto')} style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>

      {/* Character Counter */}
      {maxLength && editable && (
        <div className="border-t border-gray-300 dark:border-gray-600 px-4 py-2 text-xs text-right">
          <span
            className={cn(
              characterCount > maxLength
                ? 'text-red-600 dark:text-red-400 font-semibold'
                : 'text-gray-600 dark:text-gray-400',
            )}
          >
            {characterCount} / {maxLength}
          </span>
        </div>
      )}

      {/* Link Dialog */}
      <Dialog
        open={linkDialog.isOpen}
        onOpenChange={(open: boolean) => setLinkDialog({ ...linkDialog, isOpen: open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>Add a link to your content</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkDialog.url}
                onChange={(e) => setLinkDialog({ ...linkDialog, url: e.target.value })}
              />
            </div>
            {editor.state.selection.empty && (
              <div className="space-y-2">
                <Label htmlFor="link-text">Link Text</Label>
                <Input
                  id="link-text"
                  type="text"
                  placeholder="Click here"
                  value={linkDialog.text}
                  onChange={(e) => setLinkDialog({ ...linkDialog, text: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkDialog({ isOpen: false, url: '', text: '' })}
            >
              Cancel
            </Button>
            <Button onClick={insertLink} disabled={!linkDialog.url}>
              Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
