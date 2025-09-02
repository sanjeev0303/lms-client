"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";
import ErrorBoundary from "./error-boundary";

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-32 bg-gray-100 animate-pulse rounded border"></div>
  ),
});

interface TextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  preview?: "edit" | "preview" | "live";
}

const TextEditor: React.FC<TextEditorProps> = ({
  value = "",
  onChange,
  placeholder = "Start writing...",
  className = "",
  readOnly = false,
  preview = "live",
}) => {
  const [editorValue, setEditorValue] = useState(value);
  const [hasError, setHasError] = useState(false);

  const handleChange = (val?: string) => {
    const newValue = val || "";
    setEditorValue(newValue);
    onChange?.(newValue);
  };

  const FallbackEditor = () => (
    <div className="border border-gray-300 rounded-md">
      <div className="bg-gray-50 p-2 border-b border-gray-300 text-sm text-gray-600">
        Rich text editor failed to load. Using fallback text area.
      </div>
      <textarea
        value={editorValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full min-h-32 p-3 border-0 resize-vertical focus:outline-none"
        style={{
          backgroundColor: "white",
          color: "black",
        }}
      />
    </div>
  );

  return (
    <div className={`text-editor-container ${className}`}>
      <ErrorBoundary
        fallback={<FallbackEditor />}
        onError={(error) => {
          console.error("MDEditor error:", error);
          setHasError(true);
        }}
      >
        <MDEditor
          value={editorValue}
          onChange={handleChange}
          preview={preview}
          hideToolbar={readOnly}
          //   visibleDragBar={false}
          textareaProps={{
            placeholder,
            disabled: readOnly,
            style: {
              fontSize: 14,
              backgroundColor: "white",
              color: "black",
            },
          }}
          height={200}
          data-color-mode="light"
        />
      </ErrorBoundary>
    </div>
  );
};

export default TextEditor;
