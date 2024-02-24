"use strict";

const
   X3DActiveLayerNodeTool = require ("../Layering/X3DActiveLayerNodeTool"),
   ActionKeys             = require ("../../Application/ActionKeys"),
   X3D                    = require ("../../X3D"),
   $                      = require ("jquery");

class X3DSnapNodeTool extends X3DActiveLayerNodeTool
{
   toolModifiers       = ActionKeys .None;
   toolPointingEnabled = false;

   constructor (executionContext)
   {
      super (executionContext);

      this .keys = new ActionKeys (`X3DGridNodeTool${this .getId ()}`);
   }

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "SnapTool.x3d");
   }

   disposeTool ()
   {
      this .keys .dispose ();

      super .disposeTool ();
   }

   connectTool ()
   {
      super .connectTool ();

      this .keys .connect ();

      X3DSnapNodeTool .addToolInterest (this, () => this .set_transform_tools ());

      $(this .getBrowser () .canvas)
         .on (`mousedown.X3DSnapNodeTool${this .getId ()}`, event => this .onmousedown (event))
         .on (`mouseup.X3DSnapNodeTool${this .getId ()}`,   event => this .onmouseup   (event));

      this .set_transform_tools ();
   }

   disconnectTool ()
   {
      this .keys .disconnect ();

      X3DSnapNodeTool .removeToolInterest (this);

      $(this .getBrowser () .canvas) .off (`.X3DSnapNodeTool${this .getId ()}`);

      super .disconnectTool ();
   }

   set_transform_tools ()
   {
   }

   onmousedown (event, show = false)
   {
      if ($("#secondary-toolbar .hand") .hasClass ("active"))
         return;

      if (this .keys .value !== this .toolModifiers && !show)
         return;

      if (this .keys .value & ActionKeys .Control)
         event .button = 2;

      if (event .button !== 2 && !show)
         return;

      const { x, y } = this .getBrowser () .getPointerFromEvent (event);

      if (!this .getBrowser () .touch (x, y))
      {
         this ._visible = false;
         return;
      }

      event .preventDefault ();
      event .stopImmediatePropagation ();

      $(this .getBrowser () .canvas)
         .on (`mousemove.X3DSnapNodeTool${this .getId ()}`, event => this .onmousemove (event));

      this .changePosition (this .getBrowser () .getHit ());
   }

   onmouseup (event)
   {
      $(this .getBrowser () .canvas)
         .off (`mousemove.X3DSnapNodeTool${this .getId ()}`);
   }

   onmousemove (event)
   {
      const { x, y } = this .getBrowser () .getPointerFromEvent (event);

      if (!this .getBrowser () .touch (x, y))
         return;

      event .preventDefault ();
      event .stopImmediatePropagation ();

      this .changePosition (this .getBrowser () .getHit ());
   }

   changePosition ({ layerNode, viewMatrix, point, normal })
   {
      if (layerNode !== this .toolLayerNode)
         return;

      this .tool .position = viewMatrix .copy () .inverse () .multVecMatrix (point .copy ());
      this .tool .normal   = viewMatrix .submatrix .transpose () .multVecMatrix (normal .copy ()) .normalize ();
   }
}

module .exports = X3DSnapNodeTool;
