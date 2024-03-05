"use strict";

const
   X3DActiveLayerNodeTool = require ("../Layering/X3DActiveLayerNodeTool"),
   ActionKeys             = require ("../../Application/ActionKeys"),
   $                      = require ("jquery");

class X3DSnapNodeTool extends X3DActiveLayerNodeTool
{
   toolModifiers       = ActionKeys .None;
   toolPointingEnabled = false;

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "SnapTool.x3d");
   }

   connectTool ()
   {
      super .connectTool ();

      $(this .getBrowser () .element .shadowRoot) .find ("canvas")
         .on (`mousedown.X3DSnapNodeTool${this .getId ()}`, event => this .onmousedown (event))
         .on (`mouseup.X3DSnapNodeTool${this .getId ()}`,   event => this .onmouseup   (event));
   }

   disconnectTool ()
   {
      $(this .getBrowser () .element .shadowRoot) .find ("canvas")
         .off (`.X3DSnapNodeTool${this .getId ()}`);

      super .disconnectTool ();
   }

   onmousedown (event, show = false)
   {
      if (ActionKeys .value !== this .toolModifiers && !show)
         return;

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

      $(this .getBrowser () .element .shadowRoot) .find ("canvas")
         .on (`mousemove.X3DSnapNodeTool${this .getId ()}`, event => this .onmousemove (event));

      this .changePosition (this .getBrowser () .getHit ());
   }

   onmouseup (event)
   {
      $(this .getBrowser () .element .shadowRoot) .find ("canvas")
         .off (`mousemove.X3DSnapNodeTool${this .getId ()}`);

      this .tool .snapped = false;
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

      if (!X3DSnapNodeTool .gridNode ?._visible .getValue ())
         return;

      if (!X3DSnapNodeTool .gridNode .tool .snapping)
         return;

      const
         gridMatrix    = X3DSnapNodeTool .gridNode .getGridMatrix (),
         invGridMatrix = gridMatrix .copy () .inverse ();

      this .tool .position = gridMatrix .multVecMatrix (X3DSnapNodeTool .gridNode .getSnapPosition (invGridMatrix .multVecMatrix (this .tool .position .getValue () .copy ()), true));
   }
}

module .exports = X3DSnapNodeTool;
