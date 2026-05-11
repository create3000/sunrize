"use strict";

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D");

class LayoutGroupTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .DARK_GREEN;

   #defaultLayoutNode;

   getDefaultLayout ()
   {
      return this .#defaultLayoutNode ??= (() =>
      {
         const layoutNode = new X3D .Layout (this .getExecutionContext ());

         layoutNode .setup ();

         return layoutNode;
      })();
   }

   #scale = new X3D .Vector3 ();
   #rectangleScale = new X3D .Vector4 ();
   #rectangle = new X3D .Vector4 ();

   traverse (type, renderObject)
   {
      if (this .tool)
      {
         const layoutNode = this .layoutNode
            || (renderObject .getLayoutRectangles () .at (-1) ? null : this .getDefaultLayout ());

         if (layoutNode)
         {
            if (!this .tool .layoutDisplay)
               this .tool .layoutDisplay = true;

            renderObject .modelViewMatrix .get () .get (null, null, this .#scale);

            layoutNode .push (type, renderObject);

            const rectangle = this .#rectangle
               .assign (renderObject .getLayoutRectangles () .at (-1))
               .divVec (this .#rectangleScale .set (this .#scale .x, this .#scale .y, this .#scale .x, this .#scale .y));

            if (!this .tool .layoutRectangle .getValue () .equals (rectangle))
               this .tool .layoutRectangle = rectangle;

            layoutNode .pop (type, renderObject);
         }
         else
         {
            if (this .tool .layoutDisplay)
               this .tool .layoutDisplay = false;
         }
      }

      super .traverse (type, renderObject);
   }
}

module .exports = LayoutGroupTool;
