
"use strict"

const
   $         = require ("jquery"),
   electron  = require ("electron"),
   X3D       = require ("../X3D"),
   Interface = require ("../Application/Interface"),
   _         = require ("../Application/GetText")

module .exports = class Console extends Interface
{
   HISTORY_MAX = 100

   logLevels = [
      "debug",
      "log",
      "warn",
      "error",
   ]

   constructor (element)
   {
      super (`Sunrize.Console.${element .attr ("id")}.`)

      this .suspendConsole     = false
      this .messageTime        = 0
      this .historyIndex       = 0
      this .history            = [ ]
      this .addMessageCallback = this .addMessage .bind (this)

      this .console   = element
      this .left      = $("<div></div>") .addClass ("console-left") .appendTo (this .console)
      this .toolbar   = $("<div></div>") .addClass (["toolbar", "vertical-toolbar", "console-toolbar"]) .appendTo (this .console)
      this .output    = $("<div></div>") .addClass (["console-output", "output"]) .attr ("tabindex", 0) .appendTo (this .left)
      this .input     = $("<div></div>") .addClass ("console-input") .appendTo (this .left)

      this .suspendButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _ ("Suspend console output."))
         .text ("cancel")
         .appendTo (this .toolbar)
         .on ("click", () => this .setSuspendConsole (!this .suspendConsole))

      this .clearButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _ ("Clear console."))
         .text ("delete_forever")
         .appendTo (this .toolbar)
         .on ("click", () => this .clearConsole ())

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar)

      this .textarea = $("<textarea></textarea>")
         .attr ("placeholder", _ ("Evaluate JavaScript code here."))
         .attr ("tabindex", 0)
         .appendTo (this .input)
         .on ("keydown", (event) => this .onKeyDown (event))
         .on ("keyup", (event) => this .onKeyUp (event))

      if (this .console .attr ("id") !== "console")
      {
         this .output .html ($("#console .console-output") .html ())
         this .output .scrollTop (this .output .prop ("scrollHeight"))
      }

      electron .ipcRenderer .on ("console-message", this .addMessageCallback)

      this .setup ()
   }

   configure ()
   {
      super .configure ()

      this .config .file .addDefaultValues ({ history: [ ] })

      this .history      = this .config .file .history .slice (-this .HISTORY_MAX)
      this .historyIndex = this .history .length
   }

   async setBrowserEvent (event)
   {
      try
      {
         super .setBrowserEvent (event)

         if (event !== X3D .X3DConstants .INITIALIZED_EVENT)
            return

         this .scriptNode      = this .browser .currentScene .createNode ("Script", { warn: false })
         this .scriptNode .url = new X3D .MFString ("ecmascript:")
      }
      catch (error)
      { }
    }

   excludes = new Set ([
      "The vm module of Node.js is deprecated in the renderer process and will be removed.",
   ])

   addMessage (event, level, sourceId, line, message)
   {
      if (this .excludes .has (message))
         return

      const
         classes = this .logLevels [level] || "log",
         text    = $("<p></p>") .addClass (classes) .attr ("title", `${sourceId}:${line}`) .text (message)

      if (this .messageTime && performance .now () - this .messageTime > 1000)
         text .addClass ("splitter")

      this .messageTime = performance .now ()

      this .output .append (text)
      this .output .scrollTop (this .output .prop ("scrollHeight"))
   }

   setSuspendConsole (value)
   {
      this .suspendConsole = value

      if (value)
      {
         electron .ipcRenderer .off ("console-message", this .addMessageCallback)
         this .addMessage (null, "info", __filename, 0, `Console output suspended at ${new Date () .toLocaleTimeString ()}.`)
         this .suspendButton .addClass ("active")
      }
      else
      {
         electron .ipcRenderer .on ("console-message", this .addMessageCallback)
         this .addMessage (null, "info", __filename, 0, `Console output enabled at ${new Date () .toLocaleTimeString ()}.`)
         this .suspendButton .removeClass ("active")
      }
   }

   clearConsole ()
   {
      this .messageTime = 0

      this .output .empty ()
      this .addMessage (null, "info", __filename, 0, `Console cleared at ${new Date () .toLocaleTimeString ()}.`)
   }

   onKeyDown (event)
   {
      switch (event .key)
      {
         case "Enter":
         {
            this .evaluateSourceCode (event)
            return
         }
         case "ArrowUp":
         {
            if (this .historyIndex === this .history .length)
            {
               const text = this .textarea .val () .trim ()

               if (text && text !== this .history .at (-1))
                  this .history .push (text)
            }

            this .config .file .history = this .history

            this .historyIndex = Math .max (this .historyIndex - 1, 0)

            if (this .historyIndex < this .history .length)
               this .textarea .val (this .history [this .historyIndex])

            this .adjustTextAreaHeight ()
            return
         }
         case "ArrowDown":
         {
            this .historyIndex = Math .min (this .historyIndex + 1, this .history .length - 1)

            if (this .historyIndex < this .history .length)
               this .textarea .val (this .history [this .historyIndex])

            this .adjustTextAreaHeight ()
            return
         }
      }
   }

   onKeyUp (event)
   {
      this .adjustTextAreaHeight ()
   }

   adjustTextAreaHeight ()
   {
      const div = $("<div></div>")
         .css ({
            "width": `${this .textarea .width ()}px`,
            "white-space": "pre-wrap",
            "word-wrap": "break-word",
         })
         .text (this .textarea .val ())
         .appendTo ($("body"))

      this .input .css ("height", `${div .height () + 5}px`)
      this .output .css ("height", `calc(100% - ${this .input .height ()}px)`)

      div .remove ()
   }

   evaluateSourceCode (event)
   {
      event .preventDefault ()

      const text = this .textarea .val () .trim ()

      if (!text)
         return

      if (text !== this .history .at (-1))
         this .history .push (text)

      this .config .file .history = this .history

      this .historyIndex = this .history .length

      console .info (text)

      try
      {
         console .debug ("" + this .scriptNode .getValue () .evaluate (text))
      }
      catch (error)
      {
         console .error (`${error .name}: ${error .message}`)
      }

      this .textarea .val ("")
   }
}
