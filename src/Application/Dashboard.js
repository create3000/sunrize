"use strict";

const
   $         = require ("jquery"),
   X3D       = require ("../X3D"),
   Interface = require ("./Interface"),
   Editor    = require("../Undo/Editor"),
   _         = require ("./GetText");

module .exports = class Dashboard extends Interface
{
   constructor (element)
   {
      super ("Sunrize.Dashboard.");

      this .toolbar = element;

      this .setup ();
   }

   async initialize ()
   {
      this .playButton = $("<span></span>")
         .addClass (["material-icons"])
         .attr ("title", _("Toggle browser update."))
         .css ({ position: "relative", left: "-1px", "font-weight": "bold" })
         .text ("play_arrow")
         .appendTo (this .toolbar)
         .on ("click", () => this .play (!this .config .file .play));

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      this .viewAllButton = $("<span></span>")
         .addClass (["material-symbols-outlined"])
         .attr ("title", _("Look at selected objects."))
         .text ("center_focus_strong")
         .appendTo (this .toolbar)
         .on ("click", () => this .viewAll ());

      this .straightenButton = $("<span></span>")
         .addClass (["material-symbols-outlined", "active"])
         .attr ("title", _("Straighten horizon."))
         .text ("wb_twilight")
         .appendTo (this .toolbar)
         .on ("click", () => this .straighten (!this .browser .getBrowserOption ("StraightenHorizon")));

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      this .showPanelsButton = $("<span></span>")
         .addClass (["material-symbols-outlined"])
         .attr ("title", _("Toggle visibility of Panel."))
         .text ("edit_note")
         .appendTo (this .toolbar)
         .on ("click", () => this .togglePanel (!this .config .file .panel));
   }

   configure ()
   {
      this .config .file .setDefaultValues ({
         play: false,
         panel: false,
      });

      this .play (this .config .file .play);
      this .straighten (this .browser .getBrowserOption ("StraightenHorizon"));

      if (this .config .file .panel)
         this .togglePanel (this .config .file .panel);
   }

   play (value)
   {
      this .config .file .play = value;

      if (value)
      {
         this .playButton .addClass ("active");
         this .browser .beginUpdate ();
      }
      else
      {
         this .playButton .removeClass ("active");
         this .browser .endUpdate ();
      }
   }

   viewAll ()
   {
      const
         selection = require ("./Selection"),
         nodes     = selection .nodes;

      if (nodes .length)
      {
         const
            executionContext = this .browser .currentScene,
            layerNode        = this .browser .getActiveLayer (),
            viewpointNode    = this .browser .getActiveViewpoint (),
            straighten       = this .browser .getBrowserOption ("StraightenHorizon");

         const [values, bbox] = Editor .getModelMatricesAndBBoxes (executionContext, layerNode, nodes);

         if (!bbox .size .magnitude ())
            return;

         viewpointNode .lookAtBBox (layerNode, bbox, 1, straighten);
      }
      else
      {
         this .browser .viewAll ();
      }
   }

   straighten (value)
   {
      this .browser .setBrowserOption ("StraightenHorizon", value);

      if (value)
         this .straightenButton .addClass ("active");
      else
         this .straightenButton .removeClass ("active");
   }

   togglePanel (visible)
   {
      this .panel = require ("../Editors/Panel");

      if (visible)
      {
         this .panel .show ();
         this .showPanelsButton .addClass ("active");
      }
      else
      {
         this .panel .hide ();
         this .showPanelsButton .removeClass ("active");
      }

      this .config .file .panel = visible;
   }
};

