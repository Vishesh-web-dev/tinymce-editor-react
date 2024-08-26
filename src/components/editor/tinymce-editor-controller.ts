//@ts-nocheck
import DOMPurify from "dompurify";
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
              <!-- SAFE_LINKS 
              <meta http-equiv="Content-Security-Policy" content="script-src 'unsafe-inline' ${
                /* SAFE_LINKS */ ""
              }; object-src 'none';  base-uri 'self';">
              -->
              <meta http-equiv="Content-Security-Policy" object-src 'none';  base-uri 'self';">
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

  const sanitizeEditorContent = (content) => {
    // Define dangerous patterns related to storage access, infinite loops, and buggy code
    const dangerousPatterns = [
      // Infinite loops
      /while\s*\(\s*true\s*\)\s*\{/,
      /for\s*\(\s*;;\s*\)\s*\{/,
      /setInterval\s*\(\s*function\s*\(\)\s*{[^}]*}\s*,\s*0\s*\)/,

      // Access to storage and cookies
      /localStorage/,
      /sessionStorage/,
      /document\.cookie/,

      // Potentially dangerous functions
      /window\.alert\s*\(/,
      /alert\s*\(/,
      /window\.open\s*\(/,
      /window\.close\s*\(/,
      /window\.print\s*\(/,
      /eval\s*\(/,
      /Function\s*\(/,
      /document\.write\s*\(/,
      /document\.open\s*\(/,
      /document\.close\s*\(/,

      // XSS patterns
      /on\w+="/,
      /on\w+='\s*'/,
      /javascript:\s*[^'"]+/g,

      // Modifying prototypes and constructors
      /Object\.prototype\./,
      /Array\.prototype\./,
      /Function\.constructor\./,
    ];

    // Remove any code matching these patterns
    dangerousPatterns.forEach((pattern) => {
      content = content.replace(pattern, "/sanitized/");
    });

    return DOMPurify.sanitize(content, {
      ADD_TAGS: ["iframe", "script"],
    });
  };

  const scriptsExecutor = async (editor) => {
    try {
      const editorContent = sanitizeEditorContent(editor.getContent());
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
