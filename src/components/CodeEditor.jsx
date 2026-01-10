import Editor from "@monaco-editor/react";

export default function CodeEditor({ language, code, setCode }) {
  console.log(code);
  const handleEditorDidMount = (editor, monaco) => {
    
    // Disable right-click context menu
    editor.updateOptions({
      contextmenu: false,
      dragAndDrop : true
    });

    // Helper to block commands
    const blockCommand = (keybinding) => {
      editor.addCommand(keybinding, () => {});
    };

    blockCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC);

    blockCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV);

    blockCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX);

    blockCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA);
  };

  return (
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
        scrollBeyondLastLine: false
      }}
    />
  );
}
