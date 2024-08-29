import useTinymceEditorController from "./tinymce-editor-controller";
import { Editor } from "@tinymce/tinymce-react";
import { TINYMCE_REL_OPTIONS } from "../../utils";

function TinymceEditor() {
  const { editorRef, editorParentRef, onExecuteScripts, loadEditor } =
    useTinymceEditorController();
  const editorType = "inlineEditor";
  return (
    <>
      <div ref={editorParentRef}>
        {loadEditor && (
          <Editor
            apiKey="hbs4xg9mda6sjm8iml2osrjr5mtwhgqn3qerh9j6cddc2s5i"
            //@ts-ignore
            onInit={(_evt, editor) => {
              //@ts-ignore
              editorRef.current = editor;
              setTimeout(() => {
                onExecuteScripts();
              }, 0);
            }}
            //@ts-ignore
            initialValue={""}
            init={{
              valid_elements: "*[*]",
              extended_valid_elements:
                "script[src|type],iframe[src|frameborder|style|scrolling|class|width|height|name|align|id]", // Specifically allow iframe tags with common attributes including class
              highlight_on_focus: true,
              branding: false,
              font_size_formats:
                "8px 10px 12px 14px 16px 18px 24px 36px 48px 64px",
              newline_behavior: "default",
              entity_encoding: "raw",
              relative_urls: false,
              contextmenu: false,
              toolbar_mode: editorType === "inlineEditor" ? "wrap" : "sliding",
              toolbar_location: "top",
              fixed_toolbar_container_target:
                editorParentRef.current || undefined,
              placeholder: "Start typing...",
              menubar: false,
              inline: editorType === "inlineEditor",
              //@ts-ignore
              min_height: 200,
              //@ts-ignore
              max_height: 400,
              resize: true,
              plugins: [
                "lists",
                "advlist",
                "preview",
                "table",
                "code",
                "link",
                "autolink",
                "directionality",
                "fullscreen",
                "wordcount",
                "autoresize",
              ],
              link_rel_list: TINYMCE_REL_OPTIONS,
              toolbar:
                "bold italic underline strikethrough superscript subscript link blocks table fullscreen | " +
                "fontsize fontfamily lineheight forecolor backcolor hr " +
                "alignleft aligncenter alignright alignjustify | numlist bullist outdent indent ltr rtl code removeformat preview customImportButton",
              content_style:
                "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
              width: "auto",
              advlist_bullet_styles: "default,circle,disc,square",
              advlist_number_styles:
                "default,lower-alpha,lower-greek,lower-roman,upper-alpha,upper-roman",
              setup: (editor) => {
                editor.ui.registry.addButton("customImportButton", {
                  icon: "image",
                  onAction: () => {
                    console.log("hello");
                  },
                });
                editor.on("ExecCommand", (e) => {
                  if (e.command === "mceCodeEditor") {
                    const codeEditorDialog =
                      document.querySelector(".tox-dialog");
                    if (codeEditorDialog) {
                      const saveButton = codeEditorDialog.querySelector(
                        'button[data-mce-name="Save"]'
                      );
                      if (saveButton) {
                        saveButton.addEventListener("click", () => {
                          setTimeout(() => {
                            onExecuteScripts(); 
                          }, 0);
                        });
                      }
                    }
                  }
                });
              },
            }}
          />
        )}
      </div>
    </>
  );
}

export default TinymceEditor;
