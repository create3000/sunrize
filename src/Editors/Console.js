
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

   constructor (element, { search = true } = { })
   {
      super (`Sunrize.Console.${element .attr ("id")}.`);

      this .suspendConsole     = false;
      this .messageTime        = 0;
      this .historyIndex       = 0;
      this .history            = [ ];
      this .addMessageCallback = this .addMessage .bind (this);

      this .console = element;
      this .left    = $("<div></div>") .addClass ("console-left") .appendTo (this .console);
      this .toolbar = $("<div></div>") .addClass (["toolbar", "vertical-toolbar", "console-toolbar"]) .appendTo (this .console);

      this .output = $("<div></div>")
         .addClass (["console-output", "output"])
         .attr ("tabindex", 0)
         .on ("keydown", event => this .outputKey (event))
         .appendTo (this .left);

      this .input = $("<div></div>")
         .addClass ("console-input")
         .appendTo (this .left);

      this .search = $("<div></div>")
         .addClass ("console-search")
         .appendTo (this .left);

      this .searchInput = $("<input></input>")
         .attr ("type", "text")
         .attr ("placeholder", _("Find"))
         .addClass ("console-search-input")
         .on ("input", () => this .searchString ())
         .on ("keydown", event => this .searchNextKey (event))
         .appendTo (this .search);

      this .searchInputElements = $("<div></div>")
         .addClass ("console-search-input-elements")
         .appendTo (this .search);

      this .searchCaseSensitiveButton = $("<div></div>")
         .addClass (["codicon", "codicon-case-sensitive", "console-search-button"])
         .on ("click", () => this .searchCaseSensitive (this .config .file .searchCaseSensitive = !this .config .file .searchCaseSensitive))
         .appendTo (this .searchInputElements);

      this .searchStatus = $("<div></div>")
         .addClass ("console-search-status")
         .text ("No results")
         .appendTo (this .searchInputElements);

      this .searchPreviousButton = $("<div></div>")
         .addClass (["search-previous", "codicon", "codicon-arrow-up", "disabled"])
         .on ("click", () => this .searchPrevious ())
         .appendTo (this .search);

      this .searchNextButton = $("<div></div>")
         .addClass (["search-next", "codicon", "codicon-arrow-down", "disabled"])
         .on ("click", () => this .searchNext ())
         .appendTo (this .search);

      this .suspendButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Suspend console output."))
         .text ("cancel")
         .on ("click", () => this .setSuspendConsole (!this .suspendConsole))
         .appendTo (this .toolbar);

      this .clearButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Clear console."))
         .text ("delete_forever")
         .on ("click", () => this .clearConsole ())
         .appendTo (this .toolbar);

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      this .textarea = $("<textarea></textarea>")
         .attr ("placeholder", _("Evaluate X3D Script code here, e.g. type `Browser.name`."))
         .attr ("tabindex", 0)
         .on ("keydown", event => this .onkeydown (event))
         .on ("keyup", event => this .onkeyup (event))
         .appendTo (this .input);

      if (this .console .attr ("id") !== "console")
      {
         this .output .html ($("#console .console-output") .html ());
         this .output .scrollTop (this .output .prop ("scrollHeight"));
      }

      electron .ipcRenderer .on ("console-message", this .addMessageCallback);

      this .toggleSearch (search);
      this .setup ();
   }

   configure ()
   {
      super .configure ();

      this .config .file .setDefaultValues ({ history: [ ], searchCaseSensitive: false });

      this .history      = this .config .file .history .slice (-this .HISTORY_MAX);
      this .historyIndex = this .history .length;

      this .searchCaseSensitive ();
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
   excludes = [
      "The vm module of Node.js is unsupported",
      "Uncaught TypeError: Cannot read properties of null (reading 'removeChild')",
      "aria-hidden",
      // "Invalid asm.js: Invalid member of stdlib",
   ];

   addMessage (event, level, sourceId, line, message)
   {
      function merge (elements)
      {
         return $($.map (elements, element => element .get ()));
      }

      if (this .excludes .some (exclude => message .includes (exclude)))
         return;

      const
         classes = [this .logLevels [level] ?? "log", this .logClasses [level]],
         title   = sourceId ? `${sourceId}:${line}`: "";

      const text = merge (message .split ("\n")
         .map (line => $("<p></p>") .addClass (classes) .attr ("title", title) .text (line)));

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
         console .debug (this .scriptNode .evaluate (text));
      }
      catch (error)
      {
         console .error (error);
      }

      this .textarea .val ("");
   }

   toggleSearch (visible)
   {
      if (visible)
         this .search .show ();
      else
         this .search .hide ();
   }

   searchString ()
   {
      const
         toString = this .searchCaseSensitiveButton .hasClass ("active") ? "toString" : "toLowerCase",
         string   = this .searchInput .val () [toString] ();

      if (string)
      {
         this .foundElements = Array .from (this .output .children (), element => $(element))
            .filter (element => element .text () [toString] () .includes (string));
      }
      else
      {
         this .foundElements = [ ];
      }

      this .updateCurrentElement (0);
   }

   searchNextKey (event)
   {
      if (event .key !== "Enter")
         return;

      if (!this .foundElements .length)
         return;

      this .searchNext ();
   }

   searchCaseSensitive ()
   {
      if (this .config .file .searchCaseSensitive)
         this .searchCaseSensitiveButton .addClass ("active");
      else
         this .searchCaseSensitiveButton .removeClass ("active");

      this .searchString ();
   }

   searchPrevious ()
   {
      this .updateCurrentElement (this .currentElement - 1);
   }

   searchNext ()
   {
      this .updateCurrentElement (this .currentElement + 1);
   }

   updateCurrentElement (value)
   {
      if (value < 0)
         value = this .foundElements .length - 1;

      if (value >= this .foundElements .length)
         value = 0;

      this .currentElement = value;

      this .output .find (".selected") .removeClass ("selected");

      if (this .foundElements .length)
      {
         const element = this .foundElements [this .currentElement];

         element .addClass ("selected");
         element .get (0) .scrollIntoView ({ block: "center", inline: "start", behavior: "smooth" });

         this .searchStatus .text (`${this .currentElement + 1} / ${this .foundElements .length}`);
         this .searchPreviousButton .removeClass ("disabled");
         this .searchNextButton     .removeClass ("disabled");
      }
      else
      {
         this .searchStatus .text (`No results`);
         this .searchPreviousButton .addClass ("disabled");
         this .searchNextButton     .addClass ("disabled");
      }

      this .searchInput .css ("padding-right", this .searchInputElements .width () + 12);
   }

   outputKey (event)
   {
      switch (event .key)
      {
         case "f":
         {
            if (event .ctrlKey || event .metaKey)
            {
               this .searchInput .val (window .getSelection () .toString ());
               this .searchInput .trigger ("select");

               this .searchString ();
            }

            break;
         }
      }
   }
};
