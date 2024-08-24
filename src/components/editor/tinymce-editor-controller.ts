//@ts-nocheck
import { useEffect, useRef, useState } from "react";

const useTinymceEditorController = () => {
  const editorParentRef = useRef(null);
  const editorRef = useRef(null);
//   const [isEditorLoading, setIsEditorLoading] = useState(true);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  // const [isInlineScriptLoaded, setIsInlineScriptLoaded] = useState(false);


  const onEditorLoad = () => {
    // setIsEditorLoading(false);
    // setTimeout(() => {
    setIsScriptLoaded(true);
    // }, 0);
  };

  const scriptsExecutor = async (editor) => {
    console.log("script executing");
    // Extracts script tags from the content.
    const getScriptsFromContent = (content) => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;
      return tempDiv.getElementsByTagName("script");
    };

    // Creates a virtual environment for executing scripts.
    const createVirtualEnvironment = (content) => {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument;
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <base href="${window.location.origin}">
          </head>
          <body>${content}</body>
        </html>
      `);
      iframeDoc.close();
      console.log(iframe, iframeDoc, iframe.contentWindow); // checkhere imp
      return { iframe, document: iframeDoc, window: iframe.contentWindow };
    };

    // Loads an external script.
    const loadExternalScript = async (src) => {
      const scriptLoader = new tinymce.dom.ScriptLoader();
      console.log(scriptLoader); // imp check here
      await scriptLoader.loadScript(src);
    };

    // Executes an inline script.
    const executeInlineScript = (scriptContent, doc, win) => {
      // eslint-disable-next-line no-new-func
      const scriptFunction = new Function("document", "window", scriptContent);
      scriptFunction(doc, win);
    };

    // Executes all the scripts in the content.
    const executeScripts = async (scripts, doc, win) => {
      for (const script of scripts) {
        if (script.src) {
          await loadExternalScript(script.src);
        } else {
          executeInlineScript(script.innerText, doc, win);
        }
      }
    };

    // Handles the case when the editor is in inline mode.
    const handleInlineEditor = async (editor) => {
      const virtualEnv = createVirtualEnvironment(editor.getContent());
      await executeScripts(
        getScriptsFromContent(virtualEnv.document.body.innerHTML),
        virtualEnv.document,
        virtualEnv.window
      );
      editor.setContent(virtualEnv.document.body.innerHTML); //fix here
      virtualEnv.iframe.remove();
    };

    // Handles the case when the editor is not in inline mode.
    const handleNonInlineEditor = async (editor) => {
      const doc = editor.getDoc();
      const win = editor.getWin();
      await executeScripts(
        getScriptsFromContent(editor.getContent()),
        doc,
        win
      );
    };

    try {
      if (editor.inline) {
        await handleInlineEditor(editor);
      } else {
        await handleNonInlineEditor(editor);
      }
    } catch (error) {
      console.error("Error handling editor scripts:", error);
    }
    setIsScriptLoaded(false);
  };
  useEffect(() => {
    if (isScriptLoaded) {
      scriptsExecutor(editorRef.current);
    }
  }, [isScriptLoaded]);
  console.log(isScriptLoaded);
  return {
    editorRef,
    // isEditorLoading,
    onEditorLoad,
    editorParentRef,
    setIsScriptLoaded,
  };
};
export default useTinymceEditorController;
