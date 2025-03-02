
"use strict";

const
   $         = require ("jquery"),
   electron  = require ("electron"),
   Interface = require ("../Application/Interface"),
   _         = require ("../Application/GetText");

module .exports = class Console extends Interface
{
   HISTORY_MAX = 100;
   CONSOLE_MAX = 1000;

   logLevels = [
      "debug",
      "log",
      "warn",
      "error",
   ];

   logClasses = ["", "", "filled", "filled"];

   constructor (element)
   {
      super (`Sunrize.Console.${element .attr ("id")}.`);

      this .suspendConsole     = false;
      this .messageTime        = 0;
      this .historyIndex       = 0;
      this .history            = [ ];
      this .addMessageCallback = this .addMessage .bind (this);

      this .console   = element;
      this .left      = $("<div></div>") .addClass ("console-left") .appendTo (this .console);
      this .toolbar   = $("<div></div>") .addClass (["toolbar", "vertical-toolbar", "console-toolbar"]) .appendTo (this .console);
      this .output    = $("<div></div>") .addClass (["console-output", "output"]) .attr ("tabindex", 0) .appendTo (this .left);
      this .input     = $("<div></div>") .addClass ("console-input") .appendTo (this .left);

      this .suspendButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Suspend console output."))
         .text ("cancel")
         .appendTo (this .toolbar)
         .on ("click", () => this .setSuspendConsole (!this .suspendConsole));

      this .clearButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Clear console."))
         .text ("delete_forever")
         .appendTo (this .toolbar)
         .on ("click", () => this .clearConsole ());

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      this .textarea = $("<textarea></textarea>")
         .attr ("placeholder", _("Evaluate JavaScript code here."))
         .attr ("tabindex", 0)
         .appendTo (this .input)
         .on ("keydown", event => this .onkeydown (event))
         .on ("keyup", event => this .onkeyup (event));

      if (this .console .attr ("id") !== "console")
      {
         this .output .html ($("#console .console-output") .html ());
         this .output .scrollTop (this .output .prop ("scrollHeight"));
      }

      electron .ipcRenderer .on ("console-message", this .addMessageCallback);

      this .setup ();
   }

   configure ()
   {
      super .configure ();

      this .config .file .setDefaultValues ({ history: [ ] });

      this .history      = this .config .file .history .slice (-this .HISTORY_MAX);
      this .historyIndex = this .history .length;
   }

   async set_browser_initialized ()
   {
      super .set_browser_initialized ();

      await this .browser .loadComponents (this .browser .getComponent ("Scripting"));

      const Script = this .browser .getConcreteNode ("Script");

      this .scriptNode = new Script (this .browser .currentScene);

      this .scriptNode .setup ();
   }

   // Add strings to exclude here:
   excludes = new Set ([
      "The vm module of Node.js is deprecated in the renderer process and will be removed.",
      // "Invalid asm.js: Invalid member of stdlib",
   ]);

   addMessage (event, level, sourceId, line, message)
   {
      if (this .excludes .has (message))
         return;

      const
         classes = [this .logLevels [level] ?? "log", this .logClasses [level]],
         title   = sourceId ? `${sourceId}:${line}`: "",
         text    = $("<p></p>") .addClass (classes) .attr ("title", title) .text (message);

      if (this .messageTime && performance .now () - this .messageTime > 1000)
         this .output .append ($("<p></p>") .addClass ("splitter"));

      this .messageTime = performance .now ();

      const
         children = this .output .children (),
         last     = children .last ();

      if (last .hasClass (this .logLevels [level]))
      {
         last .css ("margin-bottom", "0");
         text .css ("margin-top",    "0");
         last .css ("border-bottom", "none");
         text .css ("border-top",    "none");
      }

      children .slice (0, Math .max (children .length - this .CONSOLE_MAX, 0)) .remove ();

      this .output .append (text);
      this .output .scrollTop (this .output .prop ("scrollHeight"));
   }

   setSuspendConsole (value)
   {
      this .suspendConsole = value;

      if (value)
      {
         electron .ipcRenderer .off ("console-message", this .addMessageCallback);
         this .addMessage (null, "info", __filename, 0, `Console output suspended at ${new Date () .toLocaleTimeString ()}.`);
         this .suspendButton .addClass ("active");
      }
      else
      {
         electron .ipcRenderer .on ("console-message", this .addMessageCallback);
         this .addMessage (null, "info", __filename, 0, `Console output enabled at ${new Date () .toLocaleTimeString ()}.`);
         this .suspendButton .removeClass ("active");
      }
   }

   clearConsole ()
   {
      this .messageTime = 0;

      this .output .empty ();
      this .addMessage (null, "info", __filename, 0, `Console cleared at ${new Date () .toLocaleTimeString ()}.`);
   }

   onkeydown (event)
   {
      switch (event .key)
      {
         case "Enter":
         {
            this .evaluateSourceCode (event);
            return;
         }
         case "ArrowUp":
         {
            if (this .historyIndex === this .history .length)
            {
               const text = this .textarea .val () .trim ();

               if (text && text !== this .history .at (-1))
                  this .history .push (text);
            }

            this .config .file .history = this .history;

            this .historyIndex = Math .max (this .historyIndex - 1, 0);

            if (this .historyIndex < this .history .length)
               this .textarea .val (this .history [this .historyIndex]);

            this .adjustTextAreaHeight ();
            return;
         }
         case "ArrowDown":
         {
            this .historyIndex = Math .min (this .historyIndex + 1, this .history .length - 1);

            if (this .historyIndex < this .history .length)
               this .textarea .val (this .history [this .historyIndex]);

            this .adjustTextAreaHeight ();
            return;
         }
      }
   }

   onkeyup (event)
   {
      this .adjustTextAreaHeight ();
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
         .appendTo ($("body"));

      this .input .css ("height", `${div .height () + 5}px`);
      this .output .css ("height", `calc(100% - ${this .input .height ()}px)`);

      div .remove ();
   }

   evaluateSourceCode (event)
   {
      event .preventDefault ();

      const text = this .textarea .val () .trim ();

      if (!text)
         return;

      if (text !== this .history .at (-1))
         this .history .push (text);

      this .config .file .history = this .history;

      this .historyIndex = this .history .length;

      console .info (text);

      try
      {
         console .debug (String (this .scriptNode .evaluate (text)));
      }
      catch (error)
      {
         console .error (`${error .name}: ${error .message}`);
      }

      this .textarea .val ("");
   }
};
