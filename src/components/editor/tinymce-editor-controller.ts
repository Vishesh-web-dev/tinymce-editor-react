//@ts-nocheck
import { useEffect, useRef, useState } from "react";

const useTinymceEditorController = () => {
  const editorParentRef = useRef(null);
  const editorRef = useRef(null);
  const [loadEditor, setLoadEditor] = useState(false);
  const scriptsExecutor = async (editor) => {
    const createIframe = () => {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.sandbox = "allow-scripts allow-same-origin";
      document.body.appendChild(iframe);
      return iframe;
    };

    const executeScriptsInIframe = (editorContent) => {
      const iframe = createIframe();
      return new Promise((resolve) => {
        const iframeDocument =
          iframe.contentDocument || iframe.contentWindow.document;

        iframeDocument.open();
        iframeDocument.write(`
          <html>
          <head>
          <base href="${window.location.origin}">
          </head>
          <body>${editorContent}</body>
          </html>
          `);
        iframeDocument.close();
        iframe.onload = () => {
          const updatedContent = iframeDocument.body.innerHTML;
          resolve(updatedContent);
        };
        setTimeout(() => {
          iframe.remove();
        }, 3000);
      });
    };

    const handleEditor = async (editor) => {
      const content = await executeScriptsInIframe(editor.getContent());
      editor.setContent(content);
      editor.focus();
    };

    try {
      await handleEditor(editor);
    } catch (error) {
      console.error("Error handling editor scripts:", error);
    }
  };
  useEffect(() => {
    if (editorParentRef.current) {
      setLoadEditor(true);
    }
  }, [editorParentRef.current]);
  return {
    editorRef,
    editorParentRef,
    scriptsExecutor,
    loadEditor,
  };
};
export default useTinymceEditorController;
