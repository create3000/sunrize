"use strict";

const
   X3DActiveLayerNodeTool = require ("../Layering/X3DActiveLayerNodeTool"),
   X3D                    = require ("../../X3D"),
   $                      = require ("jquery");

class X3DSnapNodeTool extends X3DActiveLayerNodeTool
{
   toolPointingEnabled = false;

   constructor (executionContext)
   {
      super (executionContext);
   }

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "SnapTool.x3d");
   }

   connectTool ()
   {
      super .connectTool ();

      X3DSnapNodeTool .addToolInterest (this, () => this .set_transform_tools ());

      this .getBrowser () .getCanvas ()
         .on (`mousedown.X3DSnapNodeTool${this .getId ()}`, event => this .onmousedown (event))
         .on (`mouseup.X3DSnapNodeTool${this .getId ()}`,   event => this .onmouseup   (event));

      this .set_transform_tools ();
   }

   disconnectTool ()
   {
      X3DSnapNodeTool .removeToolInterest (this);

      this .getBrowser () .getCanvas () .off (`.X3DSnapNodeTool${this .getId ()}`);

      super .disconnectTool ();
   }

   set_transform_tools ()
   {
   }

   onmousedown (event)
   {
      const { x, y } = this .getBrowser () .getPointerFromEvent (event);

      if (!this .getBrowser () .touch (x, y))
         return;

      event .preventDefault ();
      event .stopImmediatePropagation ();

      this .getBrowser () .getCanvas ()
         .on (`mousemove.X3DSnapNodeTool${this .getId ()}`, event => this .onmousemove (event));

      this .changePosition (this .getBrowser () .getHit ());
   }

   onmouseup (event)
   {
      this .getBrowser () .getCanvas ()
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

   changePosition ({ viewMatrix, point, normal })
   {
      this .tool .position = viewMatrix .copy () .inverse () .multVecMatrix (point .copy ());
      this .tool .normal   = viewMatrix .submatrix .transpose () .multVecMatrix (normal .copy ()) .normalize ();
   }
}

module .exports = X3DSnapNodeTool;
