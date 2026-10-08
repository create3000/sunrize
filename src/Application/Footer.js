"use strict";

const
   Tabs = require ("../Controls/Tabs"),
   $    = require ("jquery"),
   _    = require ("./GetText");

module .exports = class Footer extends Tabs
{
   constructor (element)
   {
      super (element, "bottom");

      this .footer  = element;
      this .editors = new Map ();

      // Buttons

      this .buttons = $("<div></div>")
         .addClass ("buttons");

      this .maximizeButton = $("<span></span>")
         .addClass (["material-symbols-outlined", "button"])
         .attr ("title", _("Maximize Panel."))
         .css ("scale", "0.8")
         .text ("fullscreen")
         .appendTo (this .buttons);

      this .setup ();
   }

   addTabs ()
   {
      const
         console         = this .addIconTextTab ("console", "menu", _("Console")),
         scriptEditor    = this .addIconTextTab ("script-editor", "data_array", _("Script Editor")),
         animationEditor = this .addIconTextTab ("animation-editor","animation", _("Animation Editor")),
         routeGraph      = this .addIconTextTab ("route-graph","route", _("Route Graph"));

      console         .tab .find (".material-icons") .css ("color", "hsl(135, 53%, 42%)");
      scriptEditor    .tab .find (".material-icons") .css ("color", "hsl(206, 53%, 42%)");
      animationEditor .tab .find (".material-icons") .css ("color", "hsl(246, 40%, 48%)");
      routeGraph      .tab .find (".material-icons") .css ("color", "hsl(281, 40%, 48%)");

      this .activateTab (3);
      this .activateTab (0);

      // Add toolbar stub after all tabs are created.

      $("<div></div>")
         .addClass (["toolbar", "vertical-toolbar"])
         .appendTo (this .footer);

      // Add buttons after all tabs are created.

      this .buttons .appendTo (this .footer);
   }

   initTab (panel)
   {
      switch (panel .attr ("id"))
      {
         case "console":
         {
            const Console = require ("../Editors/Console");

            this .console = new Console (this .getPanel ("console"));

            this .editors .set (panel .attr ("id"), this .console);
            break;
         }
         case "script-editor":
         {
            const ScriptEditor = require ("../Editors/ScriptEditor");

            this .scriptEditor = new ScriptEditor (panel);

            this .editors .set (panel .attr ("id"), this .scriptEditor);
            break;
         }
         case "animation-editor":
         {
            const AnimationEditor = require ("../Editors/AnimationEditor");

            this .animationEditor = new AnimationEditor (panel);

            this .editors .set (panel .attr ("id"), this .animationEditor);
            break;
         }
         case "route-graph":
         {
            const RouteGraph = require ("../Editors/RouteGraph");

            this .routeGraph = new RouteGraph (this .getPanel ("route-graph"));

            this .editors .set (panel .attr ("id"), this .routeGraph);
            break;
         }
      }
   }
};
