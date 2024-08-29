//@ts-nocheck
import DOMPurify from "dompurify";
import { useEffect, useRef, useState } from "react";

const useTinymceEditorController = () => {
  const editorParentRef = useRef(null);
  const editorRef = useRef(null);
  const [loadEditor, setLoadEditor] = useState(false);
  const [isScriptExecutionPending, setIsScriptExecutionPending] =
    useState(true);
  const onExecuteScripts = () => {
    setIsScriptExecutionPending(false);
  };
  const executeScriptsWithinIframe = (content) => {
    const iframe = document.createElement("iframe");

    iframe.style.display = "none";
    iframe.sandbox =
      "allow-scripts allow-same-origin allow-forms allow-modals allow-popups";
    document.body.appendChild(iframe);

    const iframeDocument =
      iframe.contentDocument || iframe.contentWindow.document;

    // Create a MutationObserver to monitor changes in the iframe's body
    const observer = new MutationObserver((mutationsList) => {
      editorRef.current.setContent(
        iframeDocument.body.innerHTML.replace(
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>\s*$/i,
          ""
        )
      );
    });

    const messageHandler = (event) => {
      if (
        event.source === iframe.contentWindow &&
        event.data === "scriptExecutionCompleted"
      ) {
        setTimeout(() => {
          iframe.remove();
          observer.disconnect();
        }, 10000);
        setTimeout(() => {
          throw new Error("Script execution timed out");
        }, 15000);
        window.removeEventListener("message", messageHandler);
      }
    };
    window.addEventListener("message", messageHandler);

    iframeDocument.open();
    iframeDocument.write(`
          <html>
            <head>
              <base href="${window.location.origin}">
              <meta http-equiv="Content-Security-Policy" base-uri 'self';">
            </head>
            <body>
              ${content}
              <script>
                document.addEventListener('DOMContentLoaded', function() {
                  parent.postMessage('scriptExecutionCompleted', '*');
                });
              </script>
            </body>
          </html>
        `);
    iframeDocument.close();

    // Start observing the iframe's body for changes
    observer.observe(iframeDocument.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });
  };

  const containsScriptTags = (content) => {
    return /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i.test(content);
  };

  const sanitizeContent = (content) => {
    return content;
  };

  const executeEditorScripts = async (editor: any) => {
    try {
      const editorContent = sanitizeContent(editor.getContent());
      if (containsScriptTags(editorContent)) {
        executeScriptsWithinIframe(editorContent);
      }
    } catch (error) {
      console.error("Error executing editor scripts:", error);
    } finally {
      setIsScriptExecutionPending(true);
    }
  };
  useEffect(() => {
    if (editorParentRef.current) {
      setLoadEditor(true);
    }
  }, [editorParentRef.current]);

  useEffect(() => {
    if (!isScriptExecutionPending) {
      setTimeout(() => {
        executeEditorScripts(editorRef.current);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScriptExecutionPending]);
  return {
    editorRef,
    editorParentRef,
    onExecuteScripts,
    loadEditor,
  };
};
export default useTinymceEditorController;
