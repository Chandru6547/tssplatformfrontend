import Editor from "@monaco-editor/react";
import { useEffect } from "react";
import "./CodeEditor.css";

export default function CodeEditor({ language, code, setCode }) {
  const handleEditorDidMount = (editor, monaco) => {
    /* ---------- DESKTOP BLOCK ---------- */
    editor.updateOptions({
      contextmenu: false,
      dragAndDrop: false
    });

    const blockCommand = (keybinding) => {
      editor.addCommand(keybinding, () => {});
    };

    blockCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC);
    blockCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV);
    blockCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX);
    blockCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA);

    /* ---------- MOBILE + DOM BLOCK ---------- */
    const domNode = editor.getDomNode();
    if (!domNode) return;

    const blockEvent = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    ["copy", "paste", "cut", "contextmenu"].forEach((event) => {
      domNode.addEventListener(event, blockEvent);
    });

    // Block long-press selection
    domNode.addEventListener("touchstart", blockEvent, { passive: false });
  };

  /* ---------- GLOBAL MOBILE BLOCK ---------- */
  useEffect(() => {
    const block = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener("copy", block);
    document.addEventListener("paste", block);
    document.addEventListener("cut", block);
    document.addEventListener("contextmenu", block);

    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("contextmenu", block);
    };
  }, []);

  return (
    <div className="no-select-editor">
      <Editor
        height="620px"
        language={language}
        value={code}
        theme="vs-dark"
        onChange={(value) => setCode(value || "")}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          selectionClipboard: false
        }}
      />
    </div>
  );
}
