"use strict";

const
   $         = require ("jquery"),
   X3D       = require ("../X3D"),
   Interface = require ("./Interface"),
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
      this .arrowButton = $("<span></span>")
         .addClass (["image-icon", "arrow"])
         .attr ("title", _("Switch to edit mode."))
         .appendTo (this .toolbar)
         .on ("click", () => this .arrow ());

      this .arrowButton .addClass ("active");

      this .handButton = $("<span></span>")
         .addClass (["image-icon", "hand"])
         .attr ("title", _("Switch to browser mode."))
         .appendTo (this .toolbar)
         .on ("click", () => this .hand ());

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
         pointer: "arrow",
         play: false,
         panel: false,
      });

      this [this .config .file .pointer] ();
      this .play (this .config .file .play);
      this .straighten (this .browser .getBrowserOption ("StraightenHorizon"));

      if (this .config .file .panel)
         this .togglePanel (this .config .file .panel);
   }

   arrow ()
   {
      this .config .file .pointer = "arrow";

      if (this .arrowButton .hasClass ("active"))
         return;

      this .handButton .removeClass ("active");
      this .arrowButton .addClass ("active");

      this .browser .addBrowserEvent ();
   }

   hand ()
   {
      this .config .file .pointer = "hand";

      if (this .handButton .hasClass ("active"))
         return;

      this .arrowButton .removeClass ("active");
      this .handButton .addClass ("active");

      this .browser .addBrowserEvent ();
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
      const types = new Set ([X3D .X3DConstants .X3DBoundedObject, X3D .X3DConstants .X3DGeometryNode]);

      const
         outlineEditor = require ("./Window") .sidebar .outlineEditor,
         selection     = outlineEditor .sceneGraph .find (".node.selected");

      if (selection .length)
      {
         const
            layerNode     = this .browser .getActiveLayer (),
            viewpointNode = this .browser .getActiveViewpoint (),
            bbox          = new X3D .Box3 (),
            straighten    = this .browser .getBrowserOption ("StraightenHorizon");

         for (const element of selection)
         {
            const node = outlineEditor .getNode ($(element)) .getInnerNode ();

            if (!node .getType () .some (type => types .has (type)))
               continue;

            const modelMatrix = outlineEditor .getModelMatrix ($(element), false);

            bbox .add (node .getBBox (new X3D .Box3 ()) .copy () .multRight (modelMatrix));
         }

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

