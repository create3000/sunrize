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
         {
            switch (field .getType ())
            {
               case X3D .X3DConstants .SFNode:
               {
                  field .removeInterest ("setDeclarations", this);
                  break;
               }
            }
         }

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

         if (this .monaco)
            this .monaco .viewState = this .monaco .saveViewState ();
      }

      this .node = node;

      if (this .node)
      {
         const editor = await this .getEditor (this .node);

         this .nodeName .renameNodeInput (this .node);
         this .applyButton .show ();
         this .editor ?.detach ();

         this .editor = editor .element .appendTo (this .verticalSplitterRight);
         this .monaco = editor .editor;

         this .monaco .restoreViewState (this .monaco .viewState);

         this .node ._url       .addFieldCallback (this, this .set_url       .bind (this));
         this .node ._loadState .addFieldCallback (this, this .set_loadState .bind (this, editor .monaco));

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
         this .editor ?.detach ();

         this .editor = null;
         this .monaco = null;
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

      this .#declarations ??= fs .readFileSync (require .resolve ("x_ite/x_ite.d.ts"), "utf8")
         .replace (/^.*?(?:declare const X3D: X3D;)/s, "");

      const fields = Array .from (this .node .getUserDefinedFields (), field =>
      {
         switch (field .getAccessType ())
         {
            case X3D .X3DConstants .initializeOnly:
            case X3D .X3DConstants .outputOnly:
            case X3D .X3DConstants .inputOutput:
            {
               switch (field .getType ())
               {
                  case X3D .X3DConstants .SFNode:
                  {
                     if (field .getValue ())
                        return `declare let ${field .getName ()}: ${field .getValue () .getTypeName ()}Proxy;`;
                     else
                        return `declare let ${field .getName ()}: SFNode | null;`;
                  }
                  case X3D .X3DConstants .MFNode:
                  {
                     const types = Array .from (new Set (Array .from (field, node => node ? `${node .getNodeTypeName ()}Proxy` : "null")));

                     if (types .length)
                        return `declare let ${field .getName ()}: MFNode <${types .join ("|")}|null>;`;
                     else
                        return `declare let ${field .getName ()}: MFNode;`;
                  }
                  default:
                  {
                     return `declare let ${field .getName ()}: ${
                        this .#internalTypes .get (field .getType ()) ?? field .getTypeName ()
                     };`
                  }
               }
            }
         }
      });

      monaco .languages .typescript .javascriptDefaults .setExtraLibs ([
      {
         content: /* ts */ `
            ${this .#declarations};
            declare const Browser: X3DBrowser;
            declare const X3DConstants: X3DConstants;
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
                  value: this .getScriptSource (node),
                  language: this .languages [node .getTypeName ()],
                  contextmenu: false,
                  automaticLayout: true,
                  wordWrap: "on",
                  wrappingIndent: "indent",
                  minimap: { enabled: false },
               });

               editor .onDidBlurEditorWidget (() => this .apply ());

               editor .viewState = editor .saveViewState ();

               element .on ("contextmenu", (event) => this .showContextMenu ());
               element .detach ();

               //this .debugFindActions (editor)
               this .editors .set (node, { element, editor, monaco });

               // Return editor.

               resolve (this .editors .get (node));
            });
         }
      });
   }

   defaultSources = {
      "Script": `ecmascript:

function initialize ()
{
   // Add code here.
}
`,

      "ShaderPart": `data:x-shader/x-vertex,#version 300 es

precision highp float;
precision highp int;

void
main ()
{
   // Add code here.
}
`,
   };

   getScriptSource (node)
   {
      if (node ._url .length && node ._url [0] .length)
         return Editor .decodeURI (node ._url [0]);

      const value = this .defaultSources [node .getTypeName ()];

      if (node .getTypeName () === "ShaderPart" && node ._type .getValue () === "FRAGMENT")
         return value .replace ("x-vertex", "x-fragment");

      return value;
   }

   showContextMenu ()
   {
      const menu = [
         {
            label: _("Go to Definition"),
            args: ["runAction", "editor.action.revealDefinition"],
         },
         {
            label: _("Go to References"),
            args: ["runAction", "editor.action.goToReferences"],
         },
         {
            label: _("Go to Symbol..."),
            args: ["runAction", "editor.action.quickOutline"],
         },
         {
            label: _("Peek"),
            submenu: [
               {
                  label: _("Peek Definition"),
                  args: ["runAction", "editor.action.peekDefinition"],
               },
               {
                  label: _("Peek References"),
                  args: ["runAction", "editor.action.referenceSearch.trigger"],
               },
            ],
         },
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
            args: ["execCommand", "cut"],
         },
         {
            label: _("Copy"),
            args: ["execCommand", "copy"],
         },
         {
            label: _("Paste"),
            args: ["execCommand", "paste"],
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
      this .monaco .getAction (id) .run ();
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

   execCommand (command)
   {
      document .execCommand (command);
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

      if (!this .monaco)
         return;

      const
         string = this .monaco .getModel () .getValue (),
         value  = this .node ._url .toSpliced (0, 1, Editor .encodeURI (string));

      if (this .node ._url .equals (value))
         return;

      this .node ._url .addFieldCallback (this, () => this .node ._url .addFieldCallback (this, this .set_url .bind (this)));

      Editor .setFieldValue (this .node .getExecutionContext (), this .node, this .node ._url, value);
   }

   set_url ()
   {
      this .monaco .getModel () .setValue (Editor .decodeURI (this .node ._url [0]));
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
