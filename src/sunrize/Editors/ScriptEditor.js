"use strict"

const
   $           = require ("jquery"),
   electron    = require ("electron"),
   X3D         = require ("../X3D"),
   Interface   = require ("../Application/Interface"),
   Splitter    = require ("../Controls/Splitter"),
   NodeList    = require ("./NodeList"),
   Console     = require ("./Console"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require ("../Undo/UndoManager"),
   _           = require ("../Application/GetText")

require ("../Controls/RenameNodeInput")

module .exports = class ScriptEditor extends Interface
{
   constructor (element)
   {
      super (`Sunrize.ScriptEditor.${element .attr ("id")}.`)

      this .scriptEditor = element

      this .verticalSplitter = $("<div></div>")
         .attr ("id", "script-editor-left")
         .addClass (["script-editor-left", "vertical-splitter"])
         .appendTo (this .scriptEditor)

      this .verticalSplitterLeft = $("<div></div>")
         .addClass ("vertical-splitter-left")
         .css ("width", "30%")
         .appendTo (this .verticalSplitter)

      this .verticalSplitterRight = $("<div></div>")
         .addClass ("vertical-splitter-right")
         .css ("width", "70%")
         .appendTo (this .verticalSplitter)

      this .vSplitter = new Splitter (this .verticalSplitter, "vertical")

      this .toolbar = $("<div></div>")
         .addClass (["toolbar", "vertical-toolbar", "script-editor-toolbar"])
         .appendTo (this .scriptEditor)

      this .createButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _ ("Create New Script or Shader."))
         .text ("add")
         .appendTo (this .toolbar)
         .on ("click", () => this .create ())

      this .applyButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _ ("Apply script source to node."))
         .text ("check_circle")
         .appendTo (this .toolbar)
         .on ("click", () => this .apply ())

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar)

      this .directOutputButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _ ("Toggle direct output."))
         .text ("radio_button_checked")
         .appendTo (this .toolbar)
         .on ("click", () => this .toggleDirectOutput ())

      this .mustEvaluateButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _ ("Toggle must evaluate."))
         .text ("priority_high")
         .appendTo (this .toolbar)
         .on ("click", () => this .toggleMustEvaluate ())

      this .shaderTypeButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _ ("Change shader type."))
         .text ("auto_awesome")
         .appendTo (this .toolbar)
         .on ("click", () => this .changeShaderType ())

      this .horizontalSplitterTop = $("<div></div>")
         .addClass ("horizontal-splitter-top")
         .css ("height", "50%")
         .appendTo (this .verticalSplitterLeft)

      this .horizontalSplitterBottom = $("<div></div>")
         .addClass ("horizontal-splitter-bottom")
         .css ("height", "50%")
         .appendTo (this .verticalSplitterLeft)

      this .hSplitter = new Splitter (this .verticalSplitterLeft, "horizontal")

      this .nodeListElement = $("<div></div>")
         .addClass ("node-list")
         .appendTo (this .horizontalSplitterTop)

      this .nodeName = $("<input></input>")
         .addClass ("node-name")
         .attr ("placeholder", _ ("Enter node name."))
         .appendTo (this .horizontalSplitterTop)
         .renameNodeInput (null, null)

      this .nodeList = new NodeList (this .nodeListElement, (node) => node .getTypeName () .match (/^(?:Script|ShaderPart)$/), (node) => this .setNode (node))

      this .consoleElement = $("<div></div>")
         .attr ("id", "script-editor-console")
         .addClass ("console")
         .appendTo (this .horizontalSplitterBottom)

      this .console = new Console (this .consoleElement)

      electron .ipcRenderer .on ("script-editor-menu", (event, key, ...args) => this [key] (...args))

      // Setup.

      this .setup ()
   }

   async setNode (node)
   {
      this .directOutputButton .hide ()
      this .mustEvaluateButton .hide ()
      this .shaderTypeButton   .hide ()

      if (this .node)
      {
         this .node ._url .removeFieldCallback (this)

         switch (this .node .getTypeName ())
         {
            case "Script":
            {
               this .node ._directOutput .removeInterest ("set_directOutput", this)
               this .node ._mustEvaluate .removeInterest ("set_mustEvaluate", this)
               break
            }
            case "ShaderPart":
            {
               this .node ._type .removeInterest ("set_shaderType", this)
               break
            }
         }

         if (this .monaco)
            this .monaco .viewState = this .monaco .saveViewState ()
      }

      this .node = node

      if (this .node)
      {
         const editor = await this .getEditor (this .node)

         this .nodeName .renameNodeInput (this .node)
         this .applyButton .show ()

         if (this .editor)
            this .editor .detach ()

         this .editor = editor .element .appendTo (this .verticalSplitterRight)
         this .monaco = editor .monaco

         this .monaco .restoreViewState (this .monaco .viewState)

         this .node ._url .addFieldCallback (this, this .set_url .bind (this))

         switch (this .node .getTypeName ())
         {
            case "Script":
            {
               this .directOutputButton .show ()
               this .mustEvaluateButton .show ()

               this .node ._directOutput .addInterest ("set_directOutput", this)
               this .node ._mustEvaluate .addInterest ("set_mustEvaluate", this)

               this .set_directOutput ()
               this .set_mustEvaluate ()
               break
            }
            case "ShaderPart":
            {
               this .shaderTypeButton .show ()

               this .node ._type .addInterest ("set_shaderType", this)

               this .set_shaderType ()
               break
            }
         }
      }
      else
      {
         this .nodeName .renameNodeInput (null, null)
         this .applyButton .hide ()

         if (this .editor)
            this .editor .detach ()

         this .editor = null
         this .monaco = null
      }
   }

   editors = new Map ()

   languages = {
      "Script": "javascript",
      "ShaderPart": "c",
   }

   getEditor (node)
   {
      return new Promise ((resolve, reject) =>
      {
         if (this .editors .has (node))
         {
            resolve (this .editors .get (node))
         }
         else
         {
            const monaco = require ("monaco-editor/min/vs/loader.js")

            monaco .require .config ({
               baseUrl: "node_modules/monaco-editor/min",
            })

            monaco .require (["vs/editor/editor.main"], (monaco) =>
            {
               const element = $("<div></div>")
                  .addClass ("script-editor-monaco")
                  .appendTo (this .verticalSplitterRight)

               self .MonacoEnvironment =
               {
                  getWorkerUrl (moduleId, label)
                  {
                     return "../../node_modules/monaco-editor/min/vs/base/worker/workerMain.js"
                  },
               }

               // CSS

               if (!this .colorScheme)
               {
                  const colorScheme = window .matchMedia ("(prefers-color-scheme: dark)")

                  colorScheme .addEventListener ("change", event => this .colorScheme (event));

                  this .colorScheme = function (event)
                  {
                     monaco .editor.setTheme (event .matches ? "vs-dark" : "vs-light")
                  }

                  this .colorScheme (colorScheme)
               }

               const editor = monaco .editor .create (element .get (0),
               {
                  value: this .getScriptSource (node),
                  language: this .languages [node .getTypeName ()],
                  contextmenu: false,
                  automaticLayout: true,
                  wordWrap: "on",
                  wrappingIndent: "indent",
                  minimap: { enabled: false },
               })

               editor .onDidBlurEditorWidget (() => this .apply ())

               editor .viewState = editor .saveViewState ()

               element .on ("contextmenu", (event) => this .showContextMenu ())
               element .detach ()

               //this .debugFindActions (editor)
               this .editors .set (node, { element: element, monaco: editor })

               resolve (this .editors .get (node))
            })
         }
      })
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
   }

   getScriptSource (node)
   {
      if (node ._url .length && node ._url [0] .length)
         return node ._url [0]

      const value = this .defaultSources [node .getTypeName ()]

      if (node .getTypeName () === "ShaderPart" && node ._type .getValue () === "FRAGMENT")
         return value .replace ("x-vertex", "x-fragment")

      return value
   }

   showContextMenu ()
   {
      const menu = [
         {
            label: _ ("Go to Definition"),
            args: ["runAction", "editor.action.revealDefinition"],
         },
         {
            label: _ ("Go to References"),
            args: ["runAction", "editor.action.goToReferences"],
         },
         {
            label: _ ("Go to Symbol..."),
            args: ["runAction", "editor.action.quickOutline"],
         },
         {
            label: _ ("Peek"),
            submenu: [
               {
                  label: _ ("Peek Definition"),
                  args: ["runAction", "editor.action.peekDefinition"],
               },
               {
                  label: _ ("Peek References"),
                  args: ["runAction", "editor.action.referenceSearch.trigger"],
               },
            ],
         },
         { type: "separator" },
         {
            label: _ ("Rename Symbol"),
            args: ["runAction", "editor.action.rename"],
         },
         {
            label: _ ("Change All Occurrences"),
            args: ["runAction", "editor.action.changeAll"],
         },
         {
            label: _ ("Format Document"),
            args: ["runAction", "editor.action.formatDocument"],
         },
         { type: "separator" },
         {
            label: _ ("Cut"),
            args: ["execCommand", "cut"],
         },
         {
            label: _ ("Copy"),
            args: ["execCommand", "copy"],
         },
         {
            label: _ ("Paste"),
            args: ["execCommand", "paste"],
         },
         { type: "separator" },
         {
            label: _ ("Command Palette"),
            args: ["runAction", "editor.action.quickCommand"],
         },
      ]

      electron .ipcRenderer .send ("context-menu", "script-editor-menu", menu)
   }

   runAction (id)
   {
      this .monaco .getAction (id) .run ()
   }

   execCommand (command)
   {
      document .execCommand (command)
   }

   create ()
   {
      const menu = [
         {
            label: _ ("Create New Script"),
            args: ["createScript"],
         },
         {
            label: _ ("Create New Shader"),
            args: ["createShader"],
         },
      ]

      electron .ipcRenderer .send ("context-menu", "script-editor-menu", menu)
   }

   async createScript ()
   {
      UndoManager .shared .beginUndo (_ ("Create New Script"))

      Editor .addComponent (this .browser .currentScene, "Scripting")

      const nodes = await Editor .importX3D (this .browser .currentScene, `
DEF NewScript Script {
   url "ecmascript:

function initialize ()
{
   // Add code here.
}

function set_field (value, time)
{
   console .log (time, value);
}
"
}
      `)

      UndoManager .shared .endUndo ()

      this .setNode (nodes [0])
   }

   async createShader ()
   {
      UndoManager .shared .beginUndo (_ ("Create New Shader"))

      Editor .addComponent (this .browser .currentScene, "Shaders")

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
      `)

      UndoManager .shared .endUndo ()

      this .setNode (nodes [0] ._parts [0] .getValue ())
   }

   apply ()
   {
      if (!this .node)
         return

      if (!this .monaco)
         return

      const value = new X3D .MFString (this .monaco .getModel () .getValue ())

      if (this .node ._url .equals (value))
         return

      this .node ._url .addFieldCallback (this, () => this .node ._url .addFieldCallback (this, this .set_url .bind (this)))

      Editor .setFieldValue (this .node .getExecutionContext (), this .node, this .node ._url, value)
   }

   set_url ()
   {
      this .monaco .getModel () .setValue (this .node ._url [0])
   }

   debugFindActions (editor)
   {
      for (const action of editor .getSupportedActions ())
      {
         switch (action .label)
         {
            case "Go to Definition": // editor.action.revealDefinition
               console .log (action .label, action .id)
               break
            case "Go to References": // editor.action.goToReferences
               console .log (action .label, action .id)
               break
            case "Go to Symbol...": // editor.action.quickOutline
               console .log (action .label, action .id)
               break
            case "Peek Definition": // editor.action.peekDefinition
               console .log (action .label, action .id)
               break
            case "Peek References": // editor.action.referenceSearch.trigger
               console .log (action .label, action .id)
               break
            case "Rename Symbol": // editor.action.rename
               console .log (action .label, action .id)
               break
            case "Change All Occurrences": // editor.action.changeAll
               console .log (action .label, action .id)
               break
            case "Format Document": // editor.action.formatDocument
               console .log (action .label, action .id)
               break
            case "Cut": //
               console .log (action .label, action .id)
               break
            case "Copy": //
               console .log (action .label, action .id)
               break
            case "Paste": //
               console .log (action .label, action .id)
               break
            case "Command Palette": // editor.action.quickCommand
               console .log (action .label, action .id)
               break
         }
      }
   }

   toggleDirectOutput ()
   {
      Editor .setFieldValue (this .node .getExecutionContext (), this .node, this .node ._directOutput, !this .node ._directOutput .getValue ())
   }

   set_directOutput ()
   {
      if (this .node ._directOutput .getValue ())
         this .directOutputButton .addClass ("active")
      else
         this .directOutputButton .removeClass ("active")
   }

   toggleMustEvaluate ()
   {
      Editor .setFieldValue (this .node .getExecutionContext (), this .node, this .node ._mustEvaluate, !this .node ._mustEvaluate .getValue ())
   }

   set_mustEvaluate ()
   {
      if (this .node ._mustEvaluate .getValue ())
         this .mustEvaluateButton .addClass ("active")
      else
         this .mustEvaluateButton .removeClass ("active")
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
      ]

      electron .ipcRenderer .send ("context-menu", "script-editor-menu", menu)
   }

   changeShaderTypeTo (type)
   {
      Editor .setFieldValue (this .node .getExecutionContext (), this .node, this .node ._type, type)
   }

   set_shaderType ()
   {
      switch (this .node ._type .getValue ())
      {
         case "VERTEX":
         {
            this .shaderTypeButton .text ("timeline")
            break
         }
         case "FRAGMENT":
         {
            this .shaderTypeButton .text ("auto_awesome")
            break
         }
      }
   }

   closeLeftBar ()
   {
      if (this .config .file .vSplitterPosition !== undefined)
      {
         this .vSplitter .position = this .config .file .vSplitterPosition
         this .config .file .vSplitterPosition = undefined
      }
      else
      {
         this .config .file .vSplitterPosition = this .vSplitter .position
         this .vSplitter .position = 0
      }
   }
}
