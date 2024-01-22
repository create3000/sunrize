"use strict"

const
   Tabs    = require ("../Controls/Tabs"),
   Console = require ("../Editors/Console"),
   _       = require ("./GetText")

module .exports = class Footer extends Tabs
{
   constructor (element)
   {
      super (element, "bottom")

      this .setup ()
   }

   addTabs ()
   {
      this .addTextTab ("console",       _("Console"))
      this .addTextTab ("script-editor", _("Script Editor"))

      if (process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT")
         this .addTextTab ("animation-editor", _("Animation Editor"))

      this .console = new Console (this .getPanel ("console"))
   }

   initTab (panel)
   {
      switch (panel .attr ("id"))
      {
         case "script-editor":
         {
            const ScriptEditor = require ("../Editors/ScriptEditor")

            this .scriptEditor = new ScriptEditor (panel)
            break
         }
         case "animation-editor":
         {
            const AnimationEditor = require ("../Editors/AnimationEditor")

            this .animationEditor = new AnimationEditor (panel)
            break
         }
      }
   }
}
