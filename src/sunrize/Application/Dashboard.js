"use strict"

const
   $         = require ("jquery"),
   X3D       = require ("../X3D"),
   Interface = require ("./Interface"),
   Box3      = X3D .require ("standard/Math/Geometry/Box3"),
   _         = require ("./GetText")

module .exports = class Dashboard extends Interface
{
   constructor (element)
   {
      super ("Sunrize.Dashboard.")

      this .toolbar = element

      this .setup ()
   }

   async initialize ()
   {
      this .handButton = $("<span></span>")
         .addClass (["image-icon", "hand"])
         .attr ("title", _ ("Switch to browser mode."))
         .appendTo (this .toolbar)
         .on ("click", () => this .hand ())

      this .handButton .addClass ("active")

      this .arrowButton = $("<span></span>")
         .addClass (["image-icon", "arrow"])
         .attr ("title", _ ("Switch to edit mode."))
         .appendTo (this .toolbar)
         .on ("click", () => this .arrow ())

      this .playButton = $("<span></span>")
         .addClass (["material-icons"])
         .attr ("title", _ ("Toggle browser update."))
         .css ({ position: "relative", left: "-1px", "font-weight": "bold" })
         .text ("play_arrow")
         .appendTo (this .toolbar)
         .on ("click", () => this .play (!this .fileConfig .play))

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar)

      this .viewAllButton = $("<span></span>")
         .addClass (["material-symbols-outlined"])
         .attr ("title", _ ("View all objects in active layer."))
         .text ("center_focus_strong")
         .appendTo (this .toolbar)
         .on ("click", () => this .viewAll ())

      this .straightenButton = $("<span></span>")
         .addClass (["material-symbols-outlined", "active"])
         .attr ("title", _ ("Straighten horizon."))
         .text ("wb_twilight")
         .appendTo (this .toolbar)
         .on ("click", () => this .straighten (!this .browser .getBrowserOption ("StraightenHorizon")))
   }

   configure ()
   {
      this .fileConfig .addDefaultValues ({
         pointer: "hand",
         play: false,
      })

      this [this .fileConfig .pointer] ()
      this .play (this .fileConfig .play)
      this .straighten (this .browser .getBrowserOption ("StraightenHorizon"))
   }

   hand ()
   {
      this .fileConfig .pointer = "hand"

      if (this .handButton .hasClass ("active"))
         return

      this .arrowButton .removeClass ("active")
      this .handButton .addClass ("active")
   }

   arrow ()
   {
      this .fileConfig .pointer = "arrow"

      if (this .arrowButton .hasClass ("active"))
         return

      this .handButton .removeClass ("active")
      this .arrowButton .addClass ("active")
   }

   play (value)
   {
      this .fileConfig .play = value

      if (value)
      {
         this .playButton .addClass ("active")
         this .browser .beginUpdate ()
      }
      else
      {
         this .playButton .removeClass ("active")
         this .browser .endUpdate ()
      }
   }

   viewAll ()
   {
      const
         outlineEditor = require ("./Document") .sidebar .outlineEditor,
         selection     = outlineEditor .sceneGraph .find (".node.selected")

      if (selection .length)
      {
         const
            layerNode     = this .browser .getActiveLayer (),
            viewpointNode = this .browser .getActiveViewpoint (),
            bbox          = new Box3 (),
            straighten    = this .browser .getBrowserOption ("StraightenHorizon")

         for (const element of selection)
         {
            try
            {
               const node = outlineEditor .getNode ($(element)) .getInnerNode ()

               if (!node .getType () .includes (X3D .X3DConstants .X3DBoundedObject))
                  continue

               const modelMatrix = outlineEditor .getModelMatrix ($(element), false)

               bbox .add (node .getBBox (new Box3 ()) .multRight (modelMatrix))
            }
            catch
            { }
         }

         viewpointNode .lookAtBBox (layerNode, bbox, 1, straighten)
      }
      else
      {
         this .browser .viewAll ()
      }
   }

   straighten (value)
   {
      this .browser .setBrowserOption ("StraightenHorizon", value)

      if (value)
         this .straightenButton .addClass ("active")
      else
         this .straightenButton .removeClass ("active")
   }
}

