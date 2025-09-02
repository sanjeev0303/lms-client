import { Editor } from '@tiptap/react'

export interface RichTextEditorProps {
    content?: string
    onChange?: (content: string) => void
    placeholder?: string
    className?: string
    editable?: boolean
    maxLength?: number
    minHeight?: number
}

export interface ToolbarButtonProps {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    children: React.ReactNode
    tooltip?: string
}

export interface RichTextEditorRef {
    getHTML: () => string
    getText: () => string
    getJSON: () => any
    setContent: (content: string) => void
    focus: () => void
    blur: () => void
    isEmpty: () => boolean
    getCharacterCount: () => number
    getWordCount: () => number
}

export type EditorCommands = {
    bold: () => void
    italic: () => void
    underline: () => void
    strike: () => void
    code: () => void
    highlight: () => void
    heading: (level: 1 | 2 | 3 | 4 | 5 | 6) => void
    paragraph: () => void
    bulletList: () => void
    orderedList: () => void
    blockquote: () => void
    codeBlock: () => void
    horizontalRule: () => void
    alignLeft: () => void
    alignCenter: () => void
    alignRight: () => void
    alignJustify: () => void
    undo: () => void
    redo: () => void
    link: (url?: string) => void
    unlink: () => void
    image: (src: string, alt?: string) => void
}

export const getEditorCommands = (editor: Editor | null): EditorCommands => {
    if (!editor) {
        // Return no-op functions if editor is null
        const noop = () => { };
        return {
            bold: noop,
            italic: noop,
            underline: noop,
            strike: noop,
            code: noop,
            highlight: noop,
            heading: noop,
            paragraph: noop,
            bulletList: noop,
            orderedList: noop,
            blockquote: noop,
            codeBlock: noop,
            horizontalRule: noop,
            alignLeft: noop,
            alignCenter: noop,
            alignRight: noop,
            alignJustify: noop,
            undo: noop,
            redo: noop,
            link: noop,
            unlink: noop,
            image: noop,
        }
    }

    return {
        bold: () => editor.chain().focus().toggleBold().run(),
        italic: () => editor.chain().focus().toggleItalic().run(),
        underline: () => editor.chain().focus().toggleUnderline().run(),
        strike: () => editor.chain().focus().toggleStrike().run(),
        code: () => editor.chain().focus().toggleCode().run(),
        highlight: () => editor.chain().focus().toggleHighlight().run(),
        heading: (level) => editor.chain().focus().toggleHeading({ level }).run(),
        paragraph: () => editor.chain().focus().setParagraph().run(),
        bulletList: () => editor.chain().focus().toggleBulletList().run(),
        orderedList: () => editor.chain().focus().toggleOrderedList().run(),
        blockquote: () => editor.chain().focus().toggleBlockquote().run(),
        codeBlock: () => editor.chain().focus().toggleCodeBlock().run(),
        horizontalRule: () => editor.chain().focus().setHorizontalRule().run(),
        alignLeft: () => editor.chain().focus().setTextAlign('left').run(),
        alignCenter: () => editor.chain().focus().setTextAlign('center').run(),
        alignRight: () => editor.chain().focus().setTextAlign('right').run(),
        alignJustify: () => editor.chain().focus().setTextAlign('justify').run(),
        undo: () => editor.chain().focus().undo().run(),
        redo: () => editor.chain().focus().redo().run(),
        link: (url) => {
            if (url === null || url === '') {
                editor.chain().focus().extendMarkRange('link').unsetLink().run()
            } else if (url) {
                editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
            }
        },
        unlink: () => editor.chain().focus().unsetLink().run(),
        image: (src, alt) => editor.chain().focus().setImage({ src, alt }).run(),
    }
}

export const getEditorStats = (editor: Editor | null) => {
    if (!editor) return { characters: 0, words: 0, isEmpty: true }

    const text = editor.getText()
    const characters = text.length
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
    const isEmpty = editor.isEmpty

    return { characters, words, isEmpty }
}

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const validateImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = url
    })
}

export const extractTextFromHTML = (html: string): string => {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
}

export const sanitizeHTML = (html: string): string => {
    // Basic HTML sanitization - in production, use a proper sanitization library
    const div = document.createElement('div')
    div.innerHTML = html

    // Remove script tags and other potentially dangerous elements
    const scripts = div.querySelectorAll('script')
    scripts.forEach(script => script.remove())

    const dangerousElements = div.querySelectorAll('iframe, object, embed, applet, form')
    dangerousElements.forEach(el => el.remove())

    return div.innerHTML
}

export const DEFAULT_CONTENT = `
<h2>Welcome to Your Course</h2>
<p>Start creating amazing educational content with our rich text editor!</p>
<p>You can use various formatting options:</p>
<ul>
  <li><strong>Bold text</strong> for emphasis</li>
  <li><em>Italic text</em> for subtle highlighting</li>
  <li><code>Code snippets</code> for technical content</li>
  <li><mark>Highlighted text</mark> for important notes</li>
</ul>
<blockquote>
  <p>Remember: Great courses are built with clear, engaging content that helps students learn effectively.</p>
</blockquote>
`

export const EDITOR_SHORTCUTS = {
    'Ctrl+B': 'Bold',
    'Ctrl+I': 'Italic',
    'Ctrl+U': 'Underline',
    'Ctrl+Shift+S': 'Strikethrough',
    'Ctrl+Shift+C': 'Code',
    'Ctrl+Shift+H': 'Highlight',
    'Ctrl+Alt+1': 'Heading 1',
    'Ctrl+Alt+2': 'Heading 2',
    'Ctrl+Alt+3': 'Heading 3',
    'Ctrl+Alt+4': 'Heading 4',
    'Ctrl+Alt+5': 'Heading 5',
    'Ctrl+Alt+6': 'Heading 6',
    'Ctrl+Shift+8': 'Bullet List',
    'Ctrl+Shift+7': 'Ordered List',
    'Ctrl+Shift+B': 'Blockquote',
    'Ctrl+Z': 'Undo',
    'Ctrl+Y': 'Redo',
    'Ctrl+Shift+Z': 'Redo',
    'Ctrl+K': 'Add Link',
}
