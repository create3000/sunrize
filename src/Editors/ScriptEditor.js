"use strict";

const
   $           = require ("jquery"),
   electron    = require ("electron"),
   path        = require ("path"),
   url         = require ("url"),
   fs          = require ("fs"),
   X3D         = require ("../X3D"),
   Interface   = require ("../Application/Interface"),
   Splitter    = require ("../Controls/Splitter"),
   NodeList    = require ("./NodeList"),
   Console     = require ("./Console"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require ("../Undo/UndoManager"),
   monaco      = require ("monaco-editor/min/vs/loader.js"),
   _           = require ("../Application/GetText");

monaco .require .config ({
   baseUrl: url .pathToFileURL (path .resolve (path .dirname (require .resolve ("monaco-editor/package.json")), "min")) + "/",
});

require ("../Controls/RenameNodeInput");

module .exports = class ScriptEditor extends Interface
{
   constructor (element)
   {
      super (`Sunrize.ScriptEditor.${element .attr ("id")}.`);

      this .scriptEditor = element;

      this .verticalSplitter = $("<div></div>")
         .attr ("id", "script-editor-left")
         .addClass (["script-editor-left", "vertical-splitter"])
         .appendTo (this .scriptEditor);

      this .verticalSplitterLeft = $("<div></div>")
         .addClass ("vertical-splitter-left")
         .css ("width", "30%")
         .appendTo (this .verticalSplitter);

      this .verticalSplitterRight = $("<div></div>")
         .addClass ("vertical-splitter-right")
         .css ("width", "70%")
         .appendTo (this .verticalSplitter);

      this .vSplitter = new Splitter (this .verticalSplitter, "vertical");

      this .verticalSplitter .on ("position", () => this .onSplitterPosition ());

      this .toolbar = $("<div></div>")
         .addClass (["toolbar", "vertical-toolbar", "script-editor-toolbar"])
         .appendTo (this .scriptEditor);

      this .toggleSidebarButton = $("<span></span>")
         .addClass (["material-symbols-outlined"])
         .attr ("title", _("Toggle sidebar."))
         .text ("dock_to_right")
         .appendTo (this .toolbar)
         .on ("click", () => this .toggleSidebar ());

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      this .createButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Create new Script node or shader."))
         .text ("add")
         .appendTo (this .toolbar)
         .on ("click", () => this .create ());

      this .applyButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Apply script source to node."))
         .text ("check_circle")
         .appendTo (this .toolbar)
         .on ("click", () => this .apply ());

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      this .directOutputButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Toggle direct output."))
         .text ("radio_button_checked")
         .appendTo (this .toolbar)
         .on ("click", () => this .toggleDirectOutput ());

      this .mustEvaluateButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Toggle must evaluate."))
         .text ("priority_high")
         .appendTo (this .toolbar)
         .on ("click", () => this .toggleMustEvaluate ());

      this .shaderTypeButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Change shader type."))
         .text ("auto_awesome")
         .appendTo (this .toolbar)
         .on ("click", () => this .changeShaderType ());

      this .horizontalSplitterTop = $("<div></div>")
         .addClass ("horizontal-splitter-top")
         .css ("height", "50%")
         .appendTo (this .verticalSplitterLeft);

      this .horizontalSplitterBottom = $("<div></div>")
         .addClass ("horizontal-splitter-bottom")
         .css ("height", "50%")
         .appendTo (this .verticalSplitterLeft);

      this .hSplitter = new Splitter (this .verticalSplitterLeft, "horizontal");

      this .nodeListElement = $("<div></div>")
         .addClass ("node-list")
         .appendTo (this .horizontalSplitterTop);

      this .nodeName = $("<input></input>")
         .addClass ("node-name")
         .attr ("placeholder", _("Enter node name."))
         .appendTo (this .horizontalSplitterTop)
         .renameNodeInput (null, null);

      this .nodeList = new NodeList (this .nodeListElement, (node) => node .getTypeName () .match (/^(?:Script|ShaderPart)$/), (node) => this .setNode (node));

      this .consoleElement = $("<div></div>")
         .attr ("id", "script-editor-console")
         .addClass ("console")
         .appendTo (this .horizontalSplitterBottom);

      this .console = new Console (this .consoleElement);

      electron .ipcRenderer .on ("script-editor", (event, key, ...args) => this [key] (...args));

      // Setup.

      this .setup ();
   }

   colorScheme (shouldUseDarkColors)
   {
      monaco .require (["vs/editor/editor.main"], monaco =>
      {
         monaco .editor .setTheme (shouldUseDarkColors ? "vs-dark" : "vs-light");
      });
   }

   async setNode (node)
   {
      this .directOutputButton .hide ();
      this .mustEvaluateButton .hide ();
      this .shaderTypeButton   .hide ();

      if (this .node)
      {
         this .node ._url       .removeFieldCallback (this);
         this .node ._loadState .removeFieldCallback (this);

         for (const field of this .node .getUserDefinedFields ())
            field .removeInterest ("setDeclarations", this);

         switch (this .node .getTypeName ())
         {
            case "Script":
            {
               this .node ._directOutput .removeInterest ("set_directOutput", this);
               this .node ._mustEvaluate .removeInterest ("set_mustEvaluate", this);
               break;
            }
            case "ShaderPart":
            {
               this .node ._type .removeInterest ("set_shaderType", this);
               break;
            }
         }

         if (this .editor)
            this .editor .viewState = this .editor .saveViewState ();
      }

      this .node = node;

      if (this .node)
      {
         const editor = await this .getEditor (this .node);

         this .nodeName .renameNodeInput (this .node);
         this .applyButton .show ();
         this .monaco ?.detach ();

         this .monaco = editor .element .appendTo (this .verticalSplitterRight);
         this .editor = editor .editor;

         this .editor .restoreViewState (this .editor .viewState);

         this .node ._url       .addFieldCallback (this, this .set_url       .bind (this));
         this .node ._loadState .addFieldCallback (this, this .set_loadState .bind (this, editor .monaco));

         this .set_url ();
         this .set_loadState (editor .monaco);

         switch (this .node .getTypeName ())
         {
            case "Script":
            {
               this .directOutputButton .show ();
               this .mustEvaluateButton .show ();

               this .node ._directOutput .addInterest ("set_directOutput", this);
               this .node ._mustEvaluate .addInterest ("set_mustEvaluate", this);

               this .set_directOutput ();
               this .set_mustEvaluate ();
               break
            }
            case "ShaderPart":
            {
               this .shaderTypeButton .show ();

               this .node ._type .addInterest ("set_shaderType", this);

               this .set_shaderType ();
               break;
            }
         }
      }
      else
      {
         this .nodeName .renameNodeInput (null, null);
         this .applyButton .hide ();
         this .monaco ?.detach ();

         this .monaco = null;
         this .editor = null;
      }
   }

   #internalTypes = new Map ([
      [X3D .X3DConstants .SFBool,   "boolean"],
      [X3D .X3DConstants .SFDouble, "number"],
      [X3D .X3DConstants .SFFloat,  "number"],
      [X3D .X3DConstants .SFInt32,  "number"],
      [X3D .X3DConstants .SFString, "string"],
      [X3D .X3DConstants .SFTime,   "number"],
   ]);

   #declarations;

   setDeclarations (monaco)
   {
      if (!this .node .getType () .includes (X3D .X3DConstants .Script))
         return;

      this .#declarations ??= fs .readFileSync (X3D .TYPE_SCRIPT_PATH, "utf8")
         .replace (/^.*?(?:export.*?;)/s, "");

      const fields = Array .from (this .node .getUserDefinedFields (), field =>
      {
         if (field .getAccessType () === X3D .X3DConstants .inputOnly)
            return "";

         const accessType = [ ];

         if (field .isInput ())
            accessType .push ("in");

         if (field .isOutput ())
            accessType .push ("out");

         let value = "";

         if (field instanceof X3D .X3DArrayField)
         {
            value += `(${field .length} elements)`;
         }
         else
         {
            const STRING_MAX = 16;

            if (field instanceof X3D .SFString)
               value += `"${X3D .SFString .escape (field .valueOf ()) .substring (0, STRING_MAX)}${field .length <= STRING_MAX ? "" : "..."}"`;
            else
               value += String (field);
         }

         let string = "";

         string += `/** This is the user-defined field ${field .getTypeName ()} [${accessType .join (", ")}] *${field .getName ()}* ${value}. */\n`;
         string += `declare let ${field .getName ()}: `;

         switch (field .getType ())
         {
            case X3D .X3DConstants .SFNode:
            {
               if (field .getValue ())
                  string += `X3D .${field .getNodeTypeName ()}Proxy;`;
               else
                  string += `X3D .SFNode | null;`;
            }
            case X3D .X3DConstants .MFNode:
            {
               const types = Array .from (new Set (Array .from (field, node => node ? `${node .getNodeTypeName ()}Proxy` : "null")));

               if (types .length)
                  string += `X3D .MFNode <${types .join ("|")}|null>;`;
               else
                  string += `X3D .MFNode;`;
            }
            default:
            {
               string += this .#internalTypes .get (field .getType ()) ?? `X3D .${field .getTypeName ()}`;
               string += "";"";
            }

            return string;
         }
      });

      monaco .languages .typescript .javascriptDefaults .setExtraLibs ([
      {
         content: /* ts */ `
            ${this .#declarations};
            declare const Browser: X3D .X3DBrowser;
            declare const X3DConstants: X3D .X3DConstants;
            declare const X3DBrowser: typeof X3D. X3DBrowser;
            declare const X3DExecutionContext: typeof X3D. X3DExecutionContext;
            declare const X3DScene: typeof X3D. X3DScene;
            declare const ComponentInfo: typeof X3D. ComponentInfo;
            declare const ComponentInfoArray: typeof X3D. ComponentInfoArray;
            declare const ProfileInfo: typeof X3D. ProfileInfo;
            declare const ProfileInfoArray: typeof X3D. ProfileInfoArray;
            declare const ConcreteNodesArray: typeof X3D. ConcreteNodesArray;
            declare const AbstractNodesArray: typeof X3D. AbstractNodesArray;
            declare const UnitInfo: typeof X3D. UnitInfo;
            declare const UnitInfoArray: typeof X3D. UnitInfoArray;
            declare const NamedNodesArray: typeof X3D. NamedNodesArray;
            declare const ImportedNodesArray: typeof X3D. ImportedNodesArray;
            declare const X3DImportedNode: typeof X3D. X3DImportedNode;
            declare const ExportedNodesArray: typeof X3D. ExportedNodesArray;
            declare const X3DExportedNode: typeof X3D. X3DExportedNode;
            declare const ExternProtoDeclarationArray: typeof X3D. ExternProtoDeclarationArray;
            declare const ProtoDeclarationArray: typeof X3D. ProtoDeclarationArray;
            declare const X3DExternProtoDeclaration: typeof X3D. X3DExternProtoDeclaration;
            declare const X3DProtoDeclaration: typeof X3D. X3DProtoDeclaration;
            declare const X3DProtoDeclarationNode: typeof X3D. X3DProtoDeclarationNode;
            declare const RouteArray: typeof X3D. RouteArray;
            declare const X3DRoute: typeof X3D. X3DRoute;
            declare const X3DFieldDefinition: typeof X3D. X3DFieldDefinition;
            declare const FieldDefinitionArray: typeof X3D. FieldDefinitionArray;
            declare const X3DField: typeof X3D. X3DField;
            declare const X3DArrayField: typeof X3D. X3DArrayField;
            ${Array .from (this .browser .fieldTypes)
               .map (type => `declare const ${type .typeName}: typeof X3D .${type .typeName};`)
               .join ("\n")}
            declare const TRUE: true;
            declare const FALSE: false;
            declare const NULL: null;
            declare function print (... args: any []): void;
            ${fields .join ("\n")};
         `},
      ]);
   }

   editors = new Map ();

   languages = {
      "Script": "javascript",
      "ShaderPart": "c",
   };

   getEditor (node)
   {
      return new Promise ((resolve, reject) =>
      {
         if (this .editors .has (node))
         {
            resolve (this .editors .get (node));
         }
         else
         {
            monaco .require (["vs/editor/editor.main"], monaco =>
            {
               const element = $("<div></div>")
                  .addClass ("script-editor-monaco")
                  .appendTo (this .verticalSplitterRight);

               self .MonacoEnvironment =
               {
                  getWorkerUrl (moduleId, label)
                  {
                     return url .pathToFileURL (require .resolve ("monaco-editor/min/vs/base/worker/workerMain.js"));
                  },
               };

               const editor = monaco .editor .create (element .get (0),
               {
                  language: this .languages [node .getTypeName ()],
                  contextmenu: false,
                  automaticLayout: true,
                  wordWrap: "on",
                  wrappingIndent: "indent",
                  minimap: { enabled: false },
                  bracketPairColorization: { enabled: true },
               });

               editor .onDidFocusEditorWidget (() => this .setDeclarations (monaco));
               editor .onDidBlurEditorWidget (() => this .apply ());

               editor .onKeyDown ((event) =>
               {
                  const { keyCode, ctrlKey, metaKey } = event;

                  if (keyCode === 52 && (metaKey || ctrlKey))
                  {
                     event .preventDefault ();
                     this .paste ();
                  }
               });

               editor .viewState = editor .saveViewState ();

               element .on ("mouseenter", () => this .setDeclarations (monaco))
               element .on ("contextmenu", () => this .showContextMenu ());
               element .detach ();

               // this .debugFindActions (editor)
               this .editors .set (node, { element, editor, monaco });

               // Return editor.

               resolve (this .editors .get (node));
            });
         }
      });
   }

   showContextMenu ()
   {
      const menu = [
         // {
         //    label: _("Go to Definition"),
         //    args: ["runAction", "editor.action.revealDefinition"],
         // },
         // {
         //    label: _("Go to References"),
         //    args: ["runAction", "editor.action.goToReferences"],
         // },
         // {
         //    label: _("Go to Symbol..."),
         //    args: ["runAction", "editor.action.quickOutline"],
         // },
         // {
         //    label: _("Peek"),
         //    submenu: [
         //       {
         //          label: _("Peek Definition"),
         //          args: ["runAction", "editor.action.peekDefinition"],
         //       },
         //       {
         //          label: _("Peek References"),
         //          args: ["runAction", "editor.action.referenceSearch.trigger"],
         //       },
         //    ],
         // },
         { type: "separator" },
         {
            label: _("Rename Symbol"),
            args: ["runAction", "editor.action.rename"],
         },
         {
            label: _("Change All Occurrences"),
            args: ["runAction", "editor.action.changeAll"],
         },
         {
            label: _("Format Document"),
            args: ["runAction", "editor.action.formatDocument"],
         },
         { type: "separator" },
         {
            label: _("Cut"),
            args: ["cutOrCopy", true],
         },
         {
            label: _("Copy"),
            args: ["cutOrCopy", false],
         },
         {
            label: _("Paste"),
            args: ["paste"],
         },
         { type: "separator" },
         {
            label: _("Command Palette"),
            args: ["runAction", "editor.action.quickCommand"],
         },
      ];

      electron .ipcRenderer .send ("context-menu", "script-editor", menu);
   }

   runAction (id)
   {
      this .editor .getAction (id) .run ();
   }

   debugFindActions (editor = this .editor)
   {
      for (const action of editor .getSupportedActions ())
      {
         if (action .label .match (/comment/i))
            console .log (action .label, action .id);

         switch (action .label)
         {
            case "Go to Definition": // editor.action.revealDefinition
               console .log (action .label, action .id);
               break;
            case "Go to References": // editor.action.goToReferences
               console .log (action .label, action .id);
               break;
            case "Go to Symbol...": // editor.action.quickOutline
               console .log (action .label, action .id);
               break;
            case "Peek Definition": // editor.action.peekDefinition
               console .log (action .label, action .id);
               break;
            case "Peek References": // editor.action.referenceSearch.trigger
               console .log (action .label, action .id);
               break;
            case "Rename Symbol": // editor.action.rename
               console .log (action .label, action .id);
               break;
            case "Change All Occurrences": // editor.action.changeAll
               console .log (action .label, action .id);
               break;
            case "Format Document": // editor.action.formatDocument
               console .log (action .label, action .id);
               break;
            case "Cut": //
               console .log (action .label, action .id);
               break;
            case "Copy": //
               console .log (action .label, action .id);
               break;
            case "Paste": //
               console .log (action .label, action .id);
               break;
            case "Command Palette": // editor.action.quickCommand
               console .log (action .label, action .id);
               break;
         }
      }
   }

   // execCommand (command)
   // {
   //    document .execCommand (command);
   // }

   cutOrCopy (cut)
   {
      this .editor .focus ();

      // Get the current selection in the editor.
      const selection = this .editor .getSelection ();

      if (!selection || selection .isEmpty ())
      {
        navigator .clipboard .writeText ("");
        return;
      }

      // Get the text from that selection.
      const data = this .editor .getModel () ?.getValueInRange (selection);

      // Set the clipboard contents.
      navigator .clipboard .writeText (data || "");

      if (!cut)
         return;

      // This is a cut operation, so replace the selection with an empty string.
      this .editor .executeEdits ("clipboard", [{
         range: selection,
         text: "",
         forceMoveMarkers: true,
      }]);
   }

   async paste ()
   {
      this .editor .focus ();

      // Get the current clipboard contents
      const text = await navigator .clipboard .readText ();

      // Get the current selection in the editor.
      const selection = this .editor .getSelection ();

      if (!selection)
        return;

      // Replace the current contents with the text from the clipboard.
      this .editor .executeEdits ("clipboard", [{
        range: selection,
        text: text,
        forceMoveMarkers: true,
      }]);
   }

   create ()
   {
      const menu = [
         {
            label: _("Create New Script"),
            args: ["createScript"],
         },
         {
            label: _("Create New Shader"),
            args: ["createShader"],
         },
      ];

      electron .ipcRenderer .send ("context-menu", "script-editor", menu);
   }

   async createScript ()
   {
      UndoManager .shared .beginUndo (_("Create New Script"));

      await Editor .addComponent (this .browser .currentScene, "Scripting");

      const nodes = await Editor .importX3D (this .browser .currentScene, `
DEF NewScript Script {
   url "ecmascript:

function initialize ()
{
   // Add code here.
}

function set_field (value, time)
{
   print (time, value);
}
"
}
      `);

      UndoManager .shared .endUndo ();

      this .nodeList .setNode (nodes [0]);
   }

   async createShader ()
   {
      UndoManager .shared .beginUndo (_("Create New Shader"));

      await Editor .addComponent (this .browser .currentScene, "Shaders");

      const nodes = await Editor .importX3D (this .browser .currentScene, `
DEF NewShader ComposedShader {
   language "GLSL"
   parts [
      DEF VertexShader ShaderPart {
         type "VERTEX"
         url "data:x-shader/x-vertex,#version 300 es

precision highp float;
precision highp int;

uniform mat4 x3d_ProjectionMatrix;
uniform mat4 x3d_ModelViewMatrix;

in vec4 x3d_Vertex;

void
main ()
{
   gl_Position = x3d_ProjectionMatrix * x3d_ModelViewMatrix * x3d_Vertex;
}
"
      }
      DEF FragmentShader ShaderPart {
         type "FRAGMENT"
url "data:x-shader/x-fragment,#version 300 es

precision highp float;
precision highp int;

out vec4 x3d_FragColor;

void
main ()
{
   x3d_FragColor = vec4 (1.0, 0.0, 0.0, 1.0);
}
"
      }
   ]
}
      `);

      UndoManager .shared .endUndo ();

      this .nodeList .setNode (nodes [0] ._parts [0] .getValue ());
   }

   apply ()
   {
      if (!this .node)
         return;

      if (!this .editor)
         return;

      const
         string = this .editor .getModel () .getValue (),
         value  = this .node ._url .toSpliced (0, 1, Editor .encodeURI (string));

      if (this .node ._url .equals (value))
         return;

      this .node ._url .addFieldCallback (this, () => this .node ._url .addFieldCallback (this, this .set_url .bind (this)));

      Editor .setFieldValue (this .node .getExecutionContext (), this .node, this .node ._url, value);
   }

   set_url ()
   {
      this .editor .getModel () .setValue (Editor .decodeURI (this .node ._url [0]));
   }

   set_loadState (monaco)
   {
      this .applyButton .removeClass (["red", "green", "yellow"]);

      switch (this .node .checkLoadState ())
      {
         case X3D .X3DConstants .NOT_STATED_STATE:
            break;
         case X3D .X3DConstants .IN_PROGRESS_STATE:
            this .applyButton .addClass ("yellow");
            break;
         case X3D .X3DConstants .COMPLETE_STATE:
            this .applyButton .addClass ("green");
            break;
         case X3D .X3DConstants .FAILED_STATE:
            this .applyButton .addClass ("red");
            break;
      }

      for (const field of this .node .getUserDefinedFields ())
      {
         switch (field .getType ())
         {
            case X3D .X3DConstants .SFNode:
            case X3D .X3DConstants .MFNode:
            {
               field .addInterest ("setDeclarations", this, monaco);
               break;
            }
         }
      }

      this .setDeclarations (monaco);
   }

   toggleDirectOutput ()
   {
      Editor .setFieldValue (this .node .getExecutionContext (), this .node, this .node ._directOutput, !this .node ._directOutput .getValue ());
   }

   set_directOutput ()
   {
      if (this .node ._directOutput .getValue ())
         this .directOutputButton .addClass ("active");
      else
         this .directOutputButton .removeClass ("active");
   }

   toggleMustEvaluate ()
   {
      Editor .setFieldValue (this .node .getExecutionContext (), this .node, this .node ._mustEvaluate, !this .node ._mustEvaluate .getValue ());
   }

   set_mustEvaluate ()
   {
      if (this .node ._mustEvaluate .getValue ())
         this .mustEvaluateButton .addClass ("active");
      else
         this .mustEvaluateButton .removeClass ("active");
   }

   changeShaderType ()
   {
      const menu = [
         {
            label: "VERTEX",
            args: ["changeShaderTypeTo", "VERTEX"],
         },
         {
            label: "FRAGMENT",
            args: ["changeShaderTypeTo", "FRAGMENT"],
         },
      ];

      electron .ipcRenderer .send ("context-menu", "script-editor", menu);
   }

   changeShaderTypeTo (type)
   {
      Editor .setFieldValue (this .node .getExecutionContext (), this .node, this .node ._type, type);
   }

   set_shaderType ()
   {
      switch (this .node ._type .getValue ())
      {
         case "VERTEX":
         {
            this .shaderTypeButton .text ("timeline");
            break;
         }
         case "FRAGMENT":
         {
            this .shaderTypeButton .text ("auto_awesome");
            break;
         }
      }
   }

   onSplitterPosition ()
   {
      if (this .vSplitter .position)
         this .toggleSidebarButton .addClass ("active");
      else
         this .toggleSidebarButton .removeClass ("active");
   }

   toggleSidebar ()
   {
      if (this .vSplitter .position)
      {
         this .config .file .vSplitterPosition = this .vSplitter .position;
         this .vSplitter .position           = 0;
      }
      else
      {
         this .vSplitter .position = this .config .file .vSplitterPosition;
      }
   }
};
