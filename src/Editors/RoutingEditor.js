
"use strict";

const
   $         = require ("jquery"),
   Interface = require ("../Application/Interface"),
   _         = require ("../Application/GetText");

module .exports = class RoutingEditor extends Interface
{
   constructor (element)
   {
      super (`Sunrize.RoutingEditor.${element .attr ("id")}.`);

      this .editor = element;
      this .top    = $("<div></div>") .addClass ("routing-editor-top") .appendTo (this .editor);
      this .left   = $("<div></div>") .addClass ("routing-editor-left") .appendTo (this .editor);

      this .toolbar = $("<div></div>")
         .addClass (["toolbar", "vertical-toolbar", "secondary-toolbar", "routing-toolbar"])
         .appendTo (this .editor);

      this .addSheetButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Add new Logic Sheet."))
         .text ("add")
         .appendTo (this .toolbar)
         .on ("click", () => this .addSheet ());


      this .canvas = $("<canvas></canvas>") .addClass ("routes") .appendTo (this .left);

      this .resizer = new ResizeObserver (() => this .resizeCanvas ());
      this .resizer .observe (this .left [0]);

      this .nodes = $("<div></div>") .addClass ("nodes") .appendTo (this .left);

      this .setup ();
   }

   configure ()
   {
      super .configure ();
   }

   colorScheme (/* shouldUseDarkColors */)
   {
      this .requestDrawRoutes ();
   }

   addSheet ()
   {

   }

   resizeCanvas ()
   {
      const
         canvasWidth  = this .canvas .width (),
         canvasHeight = this .canvas .height ();

      this .canvas
         .prop ("width",  canvasWidth)
         .prop ("height", canvasHeight);

      this .drawRoutes ();
   }

   #updateCanvasId = undefined;

   requestDrawRoutes ()
   {
      clearTimeout (this .#updateCanvasId);

      this .#updateCanvasId = setTimeout (() => this .drawRoutes ());
   }

   #style = window .getComputedStyle ($("body") [0]);

   drawRoutes ()
   {
      const
         context      = this .canvas [0] .getContext ("2d"),
         canvasWidth  = this .canvas .width (),
         canvasHeight = this .canvas .height ();

      const background = this .#style .getPropertyValue ("--routes-background-color");

      context .fillStyle = background;

      context .fillRect (0, 0, canvasWidth, canvasHeight);
   }
};
