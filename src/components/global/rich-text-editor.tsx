"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Code,
    Eye,
    Heading1,
    Heading2,
    Heading3,
    Highlighter,
    ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Minus,
    Quote,
    Redo,
    Strikethrough,
    Type,
    Underline as UnderlineIcon,
    Undo
} from "lucide-react";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import {
    EDITOR_SHORTCUTS,
    RichTextEditorProps,
    RichTextEditorRef,
    ToolbarButtonProps,
    getEditorCommands,
    getEditorStats,
} from "./rich-text-editor.types";

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      content = "",
      onChange,
      placeholder = "Start writing...",
      className,
      editable = true,
      maxLength,
      minHeight = 200,
    },
    ref
  ) => {
    const [preview, setPreview] = useState(false);
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
            HTMLAttributes: {
              class: "prose-ul",
            },
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
            HTMLAttributes: {
              class: "prose-ol",
            },
          },
          listItem: {
            HTMLAttributes: {
              class: "prose-li",
            },
          },
          paragraph: {
            HTMLAttributes: {
              class: "prose-p",
            },
          },
        }),
        Underline,
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        Highlight.configure({
          multicolor: true,
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class:
              "text-primary underline cursor-pointer hover:text-primary/80",
            target: "_blank",
            rel: "noopener noreferrer",
          },
          linkOnPaste: true,
          autolink: true,
        }),
        Image.configure({
          HTMLAttributes: {
            class: "max-w-full h-auto rounded-lg shadow-sm",
          },
        }),
      ],
      content: content,
      editable: editable && !preview,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();

        // Check character limit
        if (maxLength) {
          const text = editor.getText();
          if (text.length > maxLength) {
            return; // Don't update if over limit
          }
        }

        onChange?.(html);
      },
      editorProps: {
        attributes: {
          class: cn(
            "prose dark:prose-invert prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none p-4",
            "prose-headings:font-semibold prose-p:leading-relaxed prose-p:my-2",
            "prose-pre:bg-muted prose-pre:text-muted-foreground prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto",
            "prose-code:bg-muted prose-code:text-muted-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
            "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4",
            "prose-ul:list-disc prose-ol:list-decimal prose-li:my-1",
            "prose-img:rounded-lg prose-img:shadow-md prose-img:my-4",
            "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
            "prose-strong:font-semibold prose-em:italic",
            "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg",
            "prose-hr:border-border prose-hr:my-8",
            `min-h-[${minHeight}px]`
          ),
          placeholder: placeholder,
        },
        handleClickOn: (view, pos, node, nodePos, event) => {
          // Prevent default link behavior in edit mode, allow in preview mode
          if (node.type.name === "link" && !preview) {
            event.preventDefault();
            return true;
          }
          return false;
        },
      },
    });

    // Expose editor methods via ref
    useImperativeHandle(
      ref,
      () => ({
        getHTML: () => editor?.getHTML() || "",
        getText: () => editor?.getText() || "",
        getJSON: () => editor?.getJSON() || {},
        setContent: (content: string) => editor?.commands.setContent(content),
        focus: () => editor?.commands.focus(),
        blur: () => editor?.commands.blur(),
        isEmpty: () => editor?.isEmpty || true,
        getCharacterCount: () => editor?.getText().length || 0,
        getWordCount: () => {
          const text = editor?.getText() || "";
          return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
        },
      }),
      [editor]
    );

    const ToolbarButton: React.FC<ToolbarButtonProps> = ({
      onClick,
      isActive = false,
      disabled = false,
      children,
      tooltip,
    }) => {
      const button = (
        <Button
          type="button"
          variant={isActive ? "default" : "ghost"}
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 transition-all duration-200",
            isActive &&
              "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20",
            !isActive && "hover:bg-muted/60",
            disabled && "opacity-40 cursor-not-allowed"
          )}
        >
          {children}
        </Button>
      );

      if (tooltip) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return button;
    };

    const commands = getEditorCommands(editor);
    const stats = getEditorStats(editor);

    const addImage = async () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const url = e.target?.result as string;
            commands.image(url, "image");
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    };

    const setLink = () => {
      const url = editor?.getAttributes("link").href;
      if (editor?.isActive("link")) {
        editor.chain().focus().unsetLink().run();
        return;
      }

      // Create a dark/light mode aware dialog
      const linkInput = document.createElement("div");
      linkInput.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
        <div class="bg-background border border-border rounded-lg p-5 min-w-[320px] shadow-lg">
          <h3 class="text-lg font-semibold mb-4 text-foreground">Add Link</h3>
          <input type="url" id="linkUrl" placeholder="Enter URL (https://example.com)"
                 class="w-full p-2 border border-input rounded-md mb-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                 value="${url || ""}" />
          <input type="text" id="linkText" placeholder="Link text (optional)"
                 class="w-full p-2 border border-input rounded-md mb-4 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          <div class="flex gap-2 justify-end">
            <button id="cancelLink" class="px-4 py-2 border border-input bg-background text-foreground rounded-md hover:bg-muted transition-colors">Cancel</button>
            <button id="addLink" class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">Add Link</button>
          </div>
        </div>
      </div>
    `;

      document.body.appendChild(linkInput);

      const urlInput = document.getElementById("linkUrl") as HTMLInputElement;
      const textInput = document.getElementById("linkText") as HTMLInputElement;
      const cancelBtn = document.getElementById("cancelLink");
      const addBtn = document.getElementById("addLink");

      urlInput.focus();

      const cleanup = () => {
        document.body.removeChild(linkInput);
      };

      cancelBtn?.addEventListener("click", cleanup);

      addBtn?.addEventListener("click", () => {
        const linkUrl = urlInput.value.trim();
        const linkText = textInput.value.trim();

        if (linkUrl) {
          // Add protocol if missing
          const fullUrl = linkUrl.startsWith("http")
            ? linkUrl
            : `https://${linkUrl}`;

          if (linkText) {
            // Insert text with link
            editor
              ?.chain()
              .focus()
              .insertContent(`<a href="${fullUrl}">${linkText}</a>`)
              .run();
          } else {
            // Just add link to selected text or insert URL as text
            editor?.chain().focus().setLink({ href: fullUrl }).run();
          }
        }
        cleanup();
      });

      // Close on Escape
      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          cleanup();
          document.removeEventListener("keydown", handleKeydown);
        }
      };
      document.addEventListener("keydown", handleKeydown);
    };

    const insertHorizontalRule = () => {
      editor?.chain().focus().setHorizontalRule().run();
    };

    if (!editor) {
      return (
        <div
          className={cn(
            "border border-border rounded-lg overflow-hidden bg-background",
            className
          )}
        >
          <div className="animate-pulse">
            <div className="border-b border-border bg-muted/40 dark:bg-muted/20 p-2 h-12 flex items-center gap-2">
              <div className="h-6 w-6 bg-muted rounded"></div>
              <div className="h-6 w-6 bg-muted rounded"></div>
              <div className="h-6 w-6 bg-muted rounded"></div>
              <div className="w-px h-4 bg-border mx-2"></div>
              <div className="h-6 w-12 bg-muted rounded"></div>
            </div>
            <div className="bg-background h-48 flex items-center justify-center">
              <div className="text-muted-foreground text-sm">
                Loading editor...
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "border border-border rounded-lg overflow-hidden shadow-sm bg-background",
          className
        )}
      >
        {editable && !preview && (
          <div className="border-b bg-muted/40 dark:bg-muted/20 p-2 flex flex-wrap items-center gap-1">
            {/* Text Formatting */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={commands.bold}
                isActive={editor.isActive("bold")}
                tooltip={`Bold (${EDITOR_SHORTCUTS["Ctrl+B"]})`}
              >
                <Bold className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.italic}
                isActive={editor.isActive("italic")}
                tooltip={`Italic (${EDITOR_SHORTCUTS["Ctrl+I"]})`}
              >
                <Italic className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.underline}
                isActive={editor.isActive("underline")}
                tooltip={`Underline (${EDITOR_SHORTCUTS["Ctrl+U"]})`}
              >
                <UnderlineIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.strike}
                isActive={editor.isActive("strike")}
                tooltip="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.highlight}
                isActive={editor.isActive("highlight")}
                tooltip="Highlight"
              >
                <Highlighter className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.code}
                isActive={editor.isActive("code")}
                tooltip="Inline Code"
              >
                <Code className="h-4 w-4" />
              </ToolbarButton>
            </div>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Headings */}
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 transition-all duration-200",
                      (editor.isActive("heading") ||
                        editor.isActive("paragraph")) &&
                        "bg-primary/10 text-primary border border-primary/20"
                    )}
                  >
                    <Type className="h-4 w-4 mr-1" />
                    <span className="text-xs">
                      {editor.isActive("heading", { level: 1 })
                        ? "H1"
                        : editor.isActive("heading", { level: 2 })
                        ? "H2"
                        : editor.isActive("heading", { level: 3 })
                        ? "H3"
                        : "Style"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border border-border">
                  <DropdownMenuItem
                    onClick={commands.paragraph}
                    className={cn(
                      "cursor-pointer",
                      editor.isActive("paragraph") &&
                        "bg-primary/10 text-primary"
                    )}
                  >
                    Paragraph
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => commands.heading(1)}
                    className={cn(
                      "cursor-pointer",
                      editor.isActive("heading", { level: 1 }) &&
                        "bg-primary/10 text-primary"
                    )}
                  >
                    Heading 1
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => commands.heading(2)}
                    className={cn(
                      "cursor-pointer",
                      editor.isActive("heading", { level: 2 }) &&
                        "bg-primary/10 text-primary"
                    )}
                  >
                    Heading 2
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => commands.heading(3)}
                    className={cn(
                      "cursor-pointer",
                      editor.isActive("heading", { level: 3 }) &&
                        "bg-primary/10 text-primary"
                    )}
                  >
                    Heading 3
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ToolbarButton
                onClick={() => commands.heading(1)}
                isActive={editor.isActive("heading", { level: 1 })}
                tooltip="Heading 1"
              >
                <Heading1 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => commands.heading(2)}
                isActive={editor.isActive("heading", { level: 2 })}
                tooltip="Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => commands.heading(3)}
                isActive={editor.isActive("heading", { level: 3 })}
                tooltip="Heading 3"
              >
                <Heading3 className="h-4 w-4" />
              </ToolbarButton>
            </div>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Alignment */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={commands.alignLeft}
                isActive={
                  editor.isActive({ textAlign: "left" }) ||
                  (!editor.isActive({ textAlign: "center" }) &&
                    !editor.isActive({ textAlign: "right" }) &&
                    !editor.isActive({ textAlign: "justify" }))
                }
                tooltip="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.alignCenter}
                isActive={editor.isActive({ textAlign: "center" })}
                tooltip="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.alignRight}
                isActive={editor.isActive({ textAlign: "right" })}
                tooltip="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.alignJustify}
                isActive={editor.isActive({ textAlign: "justify" })}
                tooltip="Justify"
              >
                <AlignJustify className="h-4 w-4" />
              </ToolbarButton>
            </div>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Lists */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={commands.bulletList}
                isActive={editor.isActive("bulletList")}
                tooltip="Bullet List"
              >
                <List className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.orderedList}
                isActive={editor.isActive("orderedList")}
                tooltip="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.blockquote}
                isActive={editor.isActive("blockquote")}
                tooltip="Quote"
              >
                <Quote className="h-4 w-4" />
              </ToolbarButton>
            </div>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Media & More */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={setLink}
                isActive={editor.isActive("link")}
                tooltip="Add Link"
              >
                <LinkIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={addImage} tooltip="Insert Image">
                <ImageIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={insertHorizontalRule}
                tooltip="Horizontal Rule"
              >
                <Minus className="h-4 w-4" />
              </ToolbarButton>
            </div>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={commands.undo}
                disabled={!editor.can().chain().focus().undo().run()}
                tooltip="Undo"
              >
                <Undo className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.redo}
                disabled={!editor.can().chain().focus().redo().run()}
                tooltip="Redo"
              >
                <Redo className="h-4 w-4" />
              </ToolbarButton>
            </div>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => setPreview(!preview)}
                isActive={preview}
                tooltip={preview ? "Edit Mode" : "Preview Mode"}
              >
                <Eye className="h-4 w-4" />
              </ToolbarButton>
            </div>
          </div>
        )}

        {/* Preview Mode Header */}
        {editable && preview && (
          <div className="border-b bg-blue-50/80 dark:bg-blue-950/30 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Preview Mode
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreview(false)}
              className="h-7 text-xs border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
            >
              Edit
            </Button>
          </div>
        )}

        <div className="bg-background relative">
          {preview ? (
            <div className="p-4 min-h-[200px]">
              <div
                className="prose dark:prose-invert prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none
                prose-headings:font-semibold prose-p:leading-relaxed prose-p:my-2
                prose-pre:bg-muted prose-pre:text-muted-foreground prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                prose-code:bg-muted prose-code:text-muted-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4
                prose-ul:list-disc prose-ol:list-decimal prose-li:my-1
                prose-img:rounded-lg prose-img:shadow-md prose-img:my-4
                prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80
                prose-strong:font-semibold prose-em:italic
                prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg
                prose-hr:border-border prose-hr:my-8"
                dangerouslySetInnerHTML={{
                  __html:
                    editor.getHTML() ||
                    '<p class="text-muted-foreground italic">No content to preview</p>',
                }}
                onClick={(e) => {
                  // Allow links to be clicked in preview mode
                  const target = e.target as HTMLElement;
                  if (target.tagName === "A") {
                    const href = target.getAttribute("href");
                    if (href) {
                      window.open(href, "_blank", "noopener,noreferrer");
                    }
                  }
                }}
              />
            </div>
          ) : (
            <EditorContent editor={editor} />
          )}

          {editable && maxLength && !preview && (
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              <span
                className={stats.characters > maxLength ? "text-red-500" : ""}
              >
                {stats.characters}/{maxLength}
              </span>
              <span className="mx-1">•</span>
              <span>{stats.words} words</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
