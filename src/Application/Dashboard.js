"use strict";

const
   $         = require ("jquery"),
   electron  = require ("electron"),
   Interface = require ("./Interface"),
   Editor    = require("../Undo/Editor"),
   _         = require ("./GetText");

module .exports = class Dashboard extends Interface
{
   constructor (element, document)
   {
      super ("Sunrize.Dashboard.");

      this .document = document;
      this .toolbar  = element;

      this .setup ();
   }

   async initialize ()
   {
      this .browser .getLive () .addInterest ("updatePlay", this);

      this .handButton = $("<span></span>")
         .addClass (["image-icon", "hand"])
         .attr ("title", _("Switch to browser mode."))
         .appendTo (this .toolbar)
         .on ("click", () => this .hand ());

      this .arrowButton = $("<span></span>")
         .addClass (["image-icon", "arrow", "active"])
         .attr ("title", _("Switch to edit mode."))
         .appendTo (this .toolbar)
         .on ("click", () => this .arrow ());

      this .playButton = $("<span></span>")
         .addClass (["material-icons"])
         .attr ("title", _("Toggle browser update."))
         .css ({ position: "relative", left: "-1px", "font-weight": "bold" })
         .text ("play_arrow")
         .appendTo (this .toolbar)
         .on ("click", () => this .play (!this .config .file .play));

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      const hierarchy = require ("./Hierarchy");

      this .upButton = $("<span></span>")
         .addClass (["material-icons", "disabled"])
         .attr ("title", _("Select parent node(s)."))
         .css ({ transform: "rotate(-90deg) scaleX(0.8)", "margin-top": "-6px", "margin-bottom": "-7px" })
         .text ("play_arrow")
         .appendTo (this .toolbar)
         .on ("click", () => this .selectParent ());

      this .downButton = $("<span></span>")
         .addClass (["material-icons", "disabled"])
         .attr ("title", _("Select child node(s)."))
         .css ({ transform: "rotate(90deg) scaleX(0.8)", "margin-top": "-7px", "margin-bottom": "-6px" })
         .text ("play_arrow")
         .appendTo (this .toolbar)
         .on ("click", () => this .selectChild ());

      hierarchy .addInterest (this, () => this .onHierarchy ());

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

      electron .ipcRenderer .on ("browser-update", (event, value) => this .config .global .play = value);
   }

   configure ()
   {
      this .config .file .setDefaultValues ({
         pointer: "arrow",
         play: this .config .global .play,
         panel: false,
      });

      this [this .config .file .pointer] ();
      this .play ((this .config .file .play) && !this .isInitialScene);
      this .straighten (this .browser .getBrowserOption ("StraightenHorizon"));

      if (this .config .file .panel)
         this .togglePanel (this .config .file .panel);
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

   arrow ()
   {
      this .config .file .pointer = "arrow";

      if (this .arrowButton .hasClass ("active"))
         return;

      this .handButton .removeClass ("active");
      this .arrowButton .addClass ("active");

      this .browser .addBrowserEvent ();
   }

   play (value)
   {
      this .config .file .play = value;

      if (value)
         this .browser .beginUpdate ();
      else
         this .browser .endUpdate ();
   }

   updatePlay ()
   {
      if (this .browser .isLive ())
         this .playButton .addClass ("active");
      else
         this .playButton .removeClass ("active");
   }

   selectParent ()
   {
      this .selectHierarchy ("up");
   }

   selectChild ()
   {
      this .selectHierarchy ("down");
   }

   selectHierarchy (direction)
   {
      const
         hierarchy     = require ("./Hierarchy"),
         outlineEditor = this .document .sidebar .outlineEditor,
         nodes         = hierarchy [direction] ();

      for (const node of nodes)
         outlineEditor .expandTo (node, { expandObject: true, expandAll: true });

      const elements = nodes .map (node => outlineEditor .sceneGraph .find (`.node[node-id=${node .getId ()}]`));

      for (const [i, element] of elements .entries ())
         outlineEditor .selectNodeElement (element, i > 0);
   }

   onHierarchy ()
   {
      const hierarchy = require ("./Hierarchy");

      if (hierarchy .canUp ())
         this .upButton .removeClass ("disabled");
      else
         this .upButton .addClass ("disabled");

      if (hierarchy .canDown ())
         this .downButton .removeClass ("disabled");
      else
         this .downButton .addClass ("disabled");
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

