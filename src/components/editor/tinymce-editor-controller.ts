//@ts-nocheck
import { useEffect, useRef, useState } from "react";

const useTinymceEditorController = () => {
  const editorParentRef = useRef(null);
  const editorRef = useRef(null);
  const [loadEditor, setLoadEditor] = useState(false);
  const executeScriptsInIframe = (editorContent) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.sandbox = "allow-scripts allow-same-origin";
    document.body.appendChild(iframe);

    return new Promise((resolve, reject) => {
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
        try {
          const updatedContent = iframeDocument.body.innerHTML;
          resolve(updatedContent);
        } catch (error) {
          reject(new Error("Failed to execute scripts in iframe"));
        } finally {
          // Clean up the iframe after a delay to allow scripts to complete
          setTimeout(() => iframe.remove(), 3000);
        }
      };
    });
  };
  const checkScripts = (content) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const scripts = tempDiv.getElementsByTagName("script");
    return scripts.length > 0;
  };

  const scriptsExecutor = async (editor) => {
    try {
      const editorContent = editor.getContent();
      //if no scripts then return
      if (!checkScripts(editorContent)) return;

      const updatedContent = await executeScriptsInIframe(editorContent);
      editor.setContent(updatedContent);
      editor.focus();
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
