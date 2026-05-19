"use strict";

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D");

class LayoutGroupTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .DARK_GREEN;

   #scale = new X3D .Vector3 ();
   #rectangleScale = new X3D .Vector4 ();
   #rectangle = new X3D .Vector4 ();

   traverse (type, renderObject)
   {
      if (this .tool)
      {
         if (this .layoutNode)
         {
            if (!this .tool .layoutDisplay)
               this .tool .layoutDisplay = true;

            renderObject .modelViewMatrix .get () .getTransform (null, null, this .#scale);
            this .#rectangleScale .set (this .#scale .x, this .#scale .y, this .#scale .x, this .#scale .y);

            this .layoutNode .push (type, renderObject);

            const rectangle = this .#rectangle
               .assign (renderObject .getLayoutRectangles () .at (-1))
               .divVec (this .#rectangleScale);

            if (!this .tool .layoutRectangle .getValue () .equals (rectangle))
               this .tool .layoutRectangle = rectangle;

            this .layoutNode .pop (type, renderObject);
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
