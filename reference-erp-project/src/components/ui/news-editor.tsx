'use client';
import { EditorContent, useEditor } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import StarterKit from '@tiptap/starter-kit';
import { Heading } from '@tiptap/extension-heading';
import { Paragraph } from '@tiptap/extension-paragraph';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import { Blockquote } from '@tiptap/extension-blockquote';
import { Code } from '@tiptap/extension-code';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Bold } from '@tiptap/extension-bold';
import { Italic } from '@tiptap/extension-italic';
import { Strike } from '@tiptap/extension-strike';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import {
    Bold as BoldIcon,
    Italic as ItalicIcon,
    Strikethrough,
    Code as CodeIcon,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Image as ImageIcon,
    Link as LinkIcon,
    Loader2,
    ExternalLink,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Maximize2,
    Minimize2,
    MoreHorizontal,
    Circle,
    Square,
    CornerUpRight,
    RectangleHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrg } from '@/app/contexts/OrgContext';
import { uploadFile } from '@/utils/aws';
import { toast } from 'sonner';
import { postOrgFilesUploader } from '@/api/orgs/files/files';
import '@/styles/news-editor.css';

interface NewsEditorProps {
    content?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
    editable?: boolean;
    className?: string;
    innerClassName?: string;
}

function NewsEditor({
    content = '',
    onChange,
    placeholder = 'Start writing your blog post...',
    editable = true,
    className,
    innerClassName,
}: NewsEditorProps) {
    const { org } = useOrg();
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [selectedImageNode, setSelectedImageNode] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Disable extensions we'll configure individually
                heading: false,
                paragraph: false,
                bulletList: false,
                orderedList: false,
                listItem: false,
                blockquote: false,
                code: false,
                codeBlock: false,
                bold: false,
                italic: false,
                strike: false,
            }),
            // Configure each extension with proper Tailwind classes
            Heading.configure({
                levels: [1, 2, 3],
                HTMLAttributes: {
                    class: 'min-h-[1rem]',
                },
            }).extend({
                renderHTML({ node, HTMLAttributes }) {
                    const level = node.attrs.level as 1 | 2 | 3;
                    const classes: Record<1 | 2 | 3, string> = {
                        1: 'text-2xl font-bold mb-6 mt-8 first:mt-0',
                        2: 'text-xl font-semibold mb-4 mt-6 first:mt-0',
                        3: 'text-lg font-medium mb-3 mt-4 first:mt-0',
                    };

                    return [
                        `h${level}`,
                        {
                            ...HTMLAttributes,
                            class: `${HTMLAttributes.class || ''} ${classes[level] || ''}`.trim(),
                        },
                        0,
                    ];
                },
            }),
            Paragraph.configure({
                HTMLAttributes: {
                    class: 'text-sm',
                },
            }),
            Bold.configure({
                HTMLAttributes: {
                    class: 'font-bold',
                },
            }),
            Italic.configure({
                HTMLAttributes: {
                    class: 'italic',
                },
            }),
            Strike.configure({
                HTMLAttributes: {
                    class: 'line-through opacity-75',
                },
            }),
            Code.configure({
                HTMLAttributes: {
                    class: 'bg-muted px-2 py-1 rounded-md text-sm font-mono',
                },
            }),
            CodeBlock.configure({
                HTMLAttributes: {
                    class: 'bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto',
                },
            }),
            BulletList.configure({
                HTMLAttributes: {
                    class: 'list-disc pl-6 space-y-2',
                },
            }),
            OrderedList.configure({
                HTMLAttributes: {
                    class: 'list-decimal pl-6 space-y-2',
                },
            }),
            ListItem.configure({
                HTMLAttributes: {
                    class: 'text-sm',
                },
            }),
            Blockquote.configure({
                HTMLAttributes: {
                    class: 'border-l-4 border-muted-foreground/25 pl-6 italic text-muted-foreground',
                },
            }),
            Link.configure({
                HTMLAttributes: {
                    class: 'text-blue-500 underline underline-offset-4 hover:text-blue-500/80 transition-colors',
                },
                openOnClick: false,
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'blog-editor-image',
                },
                inline: false,
                allowBase64: true,
            }).extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        width: {
                            default: null,
                            parseHTML: element => {
                                const width = element.getAttribute('width') || element.getAttribute('data-width');
                                return width ? width.replace('px', '') : null;
                            },
                            renderHTML: attributes => {
                                if (!attributes.width) return {};
                                return {
                                    'data-width': attributes.width,
                                };
                            },
                        },
                        align: {
                            default: 'center',
                            parseHTML: element => element.getAttribute('data-align') || 'center',
                            renderHTML: attributes => {
                                return { 'data-align': attributes.align };
                            },
                        },
                        radius: {
                            default: 'lg',
                            parseHTML: element => element.getAttribute('data-radius') || 'lg',
                            renderHTML: attributes => {
                                return { 'data-radius': attributes.radius };
                            },
                        },
                        aspectRatio: {
                            default: null,
                            parseHTML: element => element.getAttribute('data-aspect-ratio'),
                            renderHTML: attributes => {
                                if (!attributes.aspectRatio) return {};
                                return { 'data-aspect-ratio': attributes.aspectRatio };
                            },
                        },
                    };
                },
                renderHTML({ HTMLAttributes }) {
                    // Return only the data attributes - let CSS handle the styling
                    return [
                        'img',
                        {
                            ...HTMLAttributes,
                            class: 'blog-editor-image',
                        },
                    ];
                },
            }),
            Placeholder.configure({
                placeholder,
                showOnlyWhenEditable: true,
                showOnlyCurrent: false,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
                defaultAlignment: 'left',
            }),
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[400px] p-3 pt-2',
            },
            handleClick: (view, pos) => {
                const node = view.state.doc.nodeAt(pos);
                if (node && node.type.name === 'image') {
                    setSelectedImageNode({ node, pos });
                    return true; // Prevent default behavior
                } else {
                    setSelectedImageNode(null); // Clear selection when clicking elsewhere
                }
                return false;
            },
        },
    });

    // Update editor content when the content prop changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    // Listen for selection changes to track image selection
    useEffect(() => {
        if (!editor) return;

        const handleSelectionUpdate = () => {
            const { selection } = editor.state;
            const { from, to } = selection;

            // Check if a single node is selected and it's an image
            if (from === to - 1) {
                const node = editor.state.doc.nodeAt(from);
                if (node && node.type.name === 'image') {
                    setSelectedImageNode({ node, pos: from });
                    return;
                }
            }

            // If no image is selected, clear the selection
            setSelectedImageNode(null);
        };

        editor.on('selectionUpdate', handleSelectionUpdate);

        return () => {
            editor.off('selectionUpdate', handleSelectionUpdate);
        };
    }, [editor]);

    const handleImageUpload = useCallback(async (file: File) => {
        if (!org?.id || !editor) return;

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error('File size must be less than 10MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        setUploading(true);
        try {
            const response = await postOrgFilesUploader(org.id, {
                path: null,
                entity_id: "news",
                name: file.name,
                content_type: file.type,
                content_length: file.size
            });

            if (response.success) {
                const url = await uploadFile(response.success.uploader, file, (progress: number) => {
                    console.log('Upload progress:', progress);
                });
                if (url) {
                    editor.chain().focus().setImage({ src: url as string }).run();
                    toast.success('Image uploaded successfully');
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    }, [org?.id, editor, postOrgFilesUploader]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
        // Reset the input value so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const insertImageFromUrl = () => {
        if (imageUrl && editor) {
            editor.chain().focus().setImage({ src: imageUrl }).run();
            setImageUrl('');
            setIsImageDialogOpen(false);
        }
    };

    const insertLink = () => {
        if (linkUrl && editor) {
            if (linkText) {
                // Insert new text with link
                editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
            } else {
                // Apply link to selected text
                editor.chain().focus().setLink({ href: linkUrl }).run();
            }
            setLinkUrl('');
            setLinkText('');
            setIsLinkDialogOpen(false);
        }
    };

    const openLinkDialog = () => {
        const { from, to } = editor?.state.selection || {};
        const selectedText = editor?.state.doc.textBetween(from || 0, to || 0) || '';
        setLinkText(selectedText);
        setIsLinkDialogOpen(true);
    };

    const handleImageAlign = (align: 'left' | 'center' | 'right') => {
        if (selectedImageNode && editor) {
            const { node, pos } = selectedImageNode;
            // Get current attributes and update align
            const newAttrs = { ...node.attrs, align };
            // Replace the node with updated attributes
            const tr = editor.view.state.tr.setNodeMarkup(pos, null, newAttrs);
            editor.view.dispatch(tr);
        }
    };

    const handleImageWidth = (width: number | null) => {
        if (selectedImageNode && editor) {
            const { node, pos } = selectedImageNode;
            // Get current attributes and update width
            const newAttrs = { ...node.attrs, width: width ? width.toString() : null };
            // Replace the node with updated attributes
            const tr = editor.view.state.tr.setNodeMarkup(pos, null, newAttrs);
            editor.view.dispatch(tr);
        }
    };

    const handleImageRadius = (radius: string) => {
        if (selectedImageNode && editor) {
            const { node, pos } = selectedImageNode;
            // Get current attributes and update radius
            const newAttrs = { ...node.attrs, radius };
            // Replace the node with updated attributes
            const tr = editor.view.state.tr.setNodeMarkup(pos, null, newAttrs);
            editor.view.dispatch(tr);
        }
    };

    const handleImageAspectRatio = (aspectRatio: string | null) => {
        if (selectedImageNode && editor) {
            const { node, pos } = selectedImageNode;
            // Get current attributes and update aspectRatio
            const newAttrs = { ...node.attrs, aspectRatio };
            // Replace the node with updated attributes
            const tr = editor.view.state.tr.setNodeMarkup(pos, null, newAttrs);
            editor.view.dispatch(tr);
        }
    };

    const handleImageContextMenu = (event: React.MouseEvent) => {
        const target = event.target as HTMLElement;

        if (target.tagName === 'IMG') {
            // Don't prevent default - let the context menu show
            // Find the image node in the editor
            if (editor) {
                try {
                    const pos = editor.view.posAtDOM(target, 0);
                    const node = editor.view.state.doc.nodeAt(pos);

                    if (node && node.type.name === 'image') {
                        setSelectedImageNode({ node, pos });
                    }
                } catch (error) {
                    console.warn('Error finding image node:', error);
                }
            }
        }
    };

    if (!editor) {
        return null;
    }

    return (
        <>
            <div className={cn('border rounded-lg overflow-hidden bg-background', className)}>
                <div className="border-b p-2 py-1 flex flex-wrap items-center gap-1 sticky top-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                    {/* Text formatting */}
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('bold')}
                        onPressedChange={() => editor.chain().focus().toggleBold().run()}
                        disabled={!editor.can().chain().focus().toggleBold().run()}
                    >
                        <BoldIcon className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        size="sm"
                        pressed={editor.isActive('italic')}
                        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                        disabled={!editor.can().chain().focus().toggleItalic().run()}
                    >
                        <ItalicIcon className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        size="sm"
                        pressed={editor.isActive('strike')}
                        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                        disabled={!editor.can().chain().focus().toggleStrike().run()}
                    >
                        <Strikethrough className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        size="sm"
                        pressed={editor.isActive('code')}
                        onPressedChange={() => editor.chain().focus().toggleCode().run()}
                        disabled={!editor.can().chain().focus().toggleCode().run()}
                    >
                        <CodeIcon className="h-4 w-4" />
                    </Toggle>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Headings */}
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('heading', { level: 1 })}
                        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    >
                        <Heading1 className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        size="sm"
                        pressed={editor.isActive('heading', { level: 2 })}
                        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    >
                        <Heading2 className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        size="sm"
                        pressed={editor.isActive('heading', { level: 3 })}
                        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    >
                        <Heading3 className="h-4 w-4" />
                    </Toggle>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Text Alignment */}
                    <Toggle
                        size="sm"
                        pressed={editor.isActive({ textAlign: 'left' })}
                        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
                    >
                        <AlignLeft className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        size="sm"
                        pressed={editor.isActive({ textAlign: 'center' })}
                        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
                    >
                        <AlignCenter className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        size="sm"
                        pressed={editor.isActive({ textAlign: 'right' })}
                        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
                    >
                        <AlignRight className="h-4 w-4" />
                    </Toggle>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Lists */}
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('bulletList')}
                        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                    >
                        <List className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        size="sm"
                        pressed={editor.isActive('orderedList')}
                        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        size="sm"
                        pressed={editor.isActive('blockquote')}
                        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                    >
                        <Quote className="h-4 w-4" />
                    </Toggle>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Media and Links */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        title="Upload image"
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ImageIcon className="h-4 w-4" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsImageDialogOpen(true)}
                        title="Insert image from URL"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={openLinkDialog}
                    >
                        <LinkIcon className="h-4 w-4" />
                    </Button>

                    <Separator orientation="vertical" className="h-6" />

                    {/* History */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().chain().focus().undo().run()}
                    >
                        <Undo className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().chain().focus().redo().run()}
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                </div>

                <ScrollArea className={innerClassName}>
                    <ContextMenu>
                        <ContextMenuTrigger asChild>
                            <div onContextMenu={handleImageContextMenu}>
                                <EditorContent

                                    editor={editor}
                                    placeholder={placeholder}
                                />
                            </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-56">
                            {selectedImageNode ? (
                                <>
                                    <ContextMenuSub>
                                        <ContextMenuSubTrigger>
                                            <AlignCenter className="mr-2 h-4 w-4" />
                                            Align Image
                                        </ContextMenuSubTrigger>
                                        <ContextMenuSubContent>
                                            <ContextMenuItem onClick={() => handleImageAlign('left')}>
                                                <AlignLeft className="mr-2 h-4 w-4" />
                                                Left
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageAlign('center')}>
                                                <AlignCenter className="mr-2 h-4 w-4" />
                                                Center
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageAlign('right')}>
                                                <AlignRight className="mr-2 h-4 w-4" />
                                                Right
                                            </ContextMenuItem>
                                        </ContextMenuSubContent>
                                    </ContextMenuSub>
                                    <ContextMenuSeparator />
                                    <ContextMenuSub>
                                        <ContextMenuSubTrigger>
                                            <Maximize2 className="mr-2 h-4 w-4" />
                                            Resize Image
                                        </ContextMenuSubTrigger>
                                        <ContextMenuSubContent>
                                            <ContextMenuItem onClick={() => handleImageWidth(200)}>
                                                <Minimize2 className="mr-2 h-4 w-4" />
                                                Small (200px)
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageWidth(400)}>
                                                <ImageIcon className="mr-2 h-4 w-4" />
                                                Medium (400px)
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageWidth(600)}>
                                                <Maximize2 className="mr-2 h-4 w-4" />
                                                Large (600px)
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageWidth(null)}>
                                                <MoreHorizontal className="mr-2 h-4 w-4" />
                                                Original Size
                                            </ContextMenuItem>
                                        </ContextMenuSubContent>
                                    </ContextMenuSub>
                                    <ContextMenuSeparator />
                                    <ContextMenuSub>
                                        <ContextMenuSubTrigger>
                                            <CornerUpRight className="mr-2 h-4 w-4" />
                                            Border Radius
                                        </ContextMenuSubTrigger>
                                        <ContextMenuSubContent>
                                            <ContextMenuItem onClick={() => handleImageRadius('none')}>
                                                <Square className="mr-2 h-4 w-4" />
                                                None
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageRadius('sm')}>
                                                <Square className="mr-2 h-4 w-4" />
                                                Small
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageRadius('md')}>
                                                <Square className="mr-2 h-4 w-4" />
                                                Medium
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageRadius('lg')}>
                                                <CornerUpRight className="mr-2 h-4 w-4" />
                                                Large
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageRadius('xl')}>
                                                <CornerUpRight className="mr-2 h-4 w-4" />
                                                Extra Large
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageRadius('full')}>
                                                <Circle className="mr-2 h-4 w-4" />
                                                Full (Circle)
                                            </ContextMenuItem>
                                        </ContextMenuSubContent>
                                    </ContextMenuSub>
                                    <ContextMenuSeparator />
                                    <ContextMenuSub>
                                        <ContextMenuSubTrigger>
                                            <RectangleHorizontal className="mr-2 h-4 w-4" />
                                            Aspect Ratio
                                        </ContextMenuSubTrigger>
                                        <ContextMenuSubContent>
                                            <ContextMenuItem onClick={() => handleImageAspectRatio(null)}>
                                                <MoreHorizontal className="mr-2 h-4 w-4" />
                                                Original
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageAspectRatio('square')}>
                                                <Square className="mr-2 h-4 w-4" />
                                                Square (1:1)
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageAspectRatio('4/3')}>
                                                <RectangleHorizontal className="mr-2 h-4 w-4" />
                                                Standard (4:3)
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageAspectRatio('3/2')}>
                                                <RectangleHorizontal className="mr-2 h-4 w-4" />
                                                Classic (3:2)
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageAspectRatio('16/9')}>
                                                <RectangleHorizontal className="mr-2 h-4 w-4" />
                                                Widescreen (16:9)
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageAspectRatio('21/9')}>
                                                <RectangleHorizontal className="mr-2 h-4 w-4" />
                                                Ultrawide (21:9)
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageAspectRatio('3/4')}>
                                                <RectangleHorizontal className="mr-2 h-4 w-4" />
                                                Portrait (3:4)
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageAspectRatio('2/3')}>
                                                <RectangleHorizontal className="mr-2 h-4 w-4" />
                                                Tall (2:3)
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleImageAspectRatio('9/16')}>
                                                <RectangleHorizontal className="mr-2 h-4 w-4" />
                                                Mobile (9:16)
                                            </ContextMenuItem>
                                        </ContextMenuSubContent>
                                    </ContextMenuSub>
                                </>
                            ) : (
                                <ContextMenuItem disabled>
                                    Select an image to see options
                                </ContextMenuItem>
                            )}
                        </ContextMenuContent>
                    </ContextMenu>
                </ScrollArea>

                {/* Hidden file input for image upload */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Image URL Dialog */}
            <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>Insert Image</DialogTitle>
                        <DialogDescription>
                            Enter the URL of the image you want to insert.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="image-url">Image URL</Label>
                            <Input
                                id="image-url"
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        insertImageFromUrl();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={insertImageFromUrl} disabled={!imageUrl}>
                            Insert Image
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Link Dialog */}
            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>Insert Link</DialogTitle>
                        <DialogDescription>
                            {linkText ? `Add a link to "${linkText}"` : 'Enter the URL and optional text for the link.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="link-url">URL</Label>
                            <Input
                                id="link-url"
                                placeholder="https://example.com"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="link-text">Link Text (optional)</Label>
                            <Input
                                id="link-text"
                                placeholder="Click here"
                                value={linkText}
                                onChange={(e) => setLinkText(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={insertLink} disabled={!linkUrl}>
                            Insert Link
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export { NewsEditor, type NewsEditorProps };
