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
   #transformTools     = [ ];
   #changing           = Symbol ();

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "SnapTool.x3d");
   }

   connectTool ()
   {
      super .connectTool ();

      X3DSnapNodeTool .addToolInterest (this, () => this .set_transform_tools ());

      $(this .getBrowser () .element .shadowRoot) .find ("canvas")
         .on (`mousedown.X3DSnapNodeTool${this .getId ()}`, event => this .onmousedown (event))
         .on (`mouseup.X3DSnapNodeTool${this .getId ()}`,   event => this .onmouseup   (event));

      this .set_transform_tools ();
   }

   disconnectTool ()
   {
      X3DSnapNodeTool .removeToolInterest (this);

      $(this .getBrowser () .element .shadowRoot) .find ("canvas")
         .off (`.X3DSnapNodeTool${this .getId ()}`);

      super .disconnectTool ();
   }

   set_transform_tools ()
   {
      for (const transformTool of this .#transformTools)
         transformTool .removeInterest ("set_transform", this);

      this .#transformTools .length = 0;

      for (const transformTool of X3DSnapNodeTool .tools)
      {
         if (!(transformTool instanceof X3D .X3DTransformNode))
            continue;

         this .#transformTools .push (transformTool);
      }

      for (const transformTool of this .#transformTools)
         transformTool .addInterest ("set_transform", this, transformTool);
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

   set_transform (transformTool)
   {
      if (!this ._visible .getValue ())
         return;

      if (ActionKeys .value === (ActionKeys .Shift | ActionKeys .Control))
         return;

      if (!transformTool .tool .isActive)
         return;

      switch (transformTool .tool .activeTool)
      {
         case "TRANSLATE":
            this .set_translation (transformTool);
            return;
         case "ROTATE":
            this .set_rotation (transformTool);
            return;
      }
   }

   set_translation (transformTool)
   {
      // if (transformTool .getUserData (this .#changing))
      // {
      //    transformTool .setUserData (this .#changing, false);
      //    return;
      // }
   }

   set_rotation (transformTool)
   {
      // if (transformTool .getUserData (this .#changing))
      // {
      //    transformTool .setUserData (this .#changing, false);
      //    return;
      // }
   }
}

module .exports = X3DSnapNodeTool;
