//@ts-nocheck
import { useEffect, useRef, useState } from "react";

const useTinymceEditorController = () => {
  const editorParentRef = useRef(null);
  const editorRef = useRef(null);
  const [loadEditor, setLoadEditor] = useState(false);
  const executeScriptsInIframe = (content) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.sandbox = "allow-scripts allow-same-origin";
    document.body.appendChild(iframe);

    const executionPromise = new Promise((resolve, reject) => {
      const iframeDocument =
        iframe.contentDocument || iframe.contentWindow.document;

      iframeDocument.open();
      iframeDocument.write(`
          <html>
            <head>
              <base href="${window.location.origin}">
            </head>
            <body>${content}</body>
          </html>
        `);
      iframeDocument.close();

      iframe.onload = () => {
        try {
          const updatedContent = iframeDocument.body.innerHTML;
          resolve(updatedContent);
        } catch (error) {
          reject(
            new Error("Failed to execute scripts in iframe: " + error.message)
          );
        } finally {
          setTimeout(() => iframe.remove(), 5000);
        }
      };
    });

    //from not getting in infinte loop
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Script execution timed out")), 5000)
    );

    return Promise.race([executionPromise, timeoutPromise]);
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
