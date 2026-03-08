"use strict";

const
   X3DGeometryNodeTool      = require ("../Rendering/X3DGeometryNodeTool"),
   X3DLineGeometryNodeTool  = require ("../Rendering/X3DLineGeometryNodeTool"),
   X3DPointGeometryNodeTool = require ("../Rendering/X3DPointGeometryNodeTool");

class InlineGeometryTool extends X3DGeometryNodeTool
{
   set_toolRebuildGeometry ()
   {
      switch (this .getGeometryType ())
      {
         case 0:
         {
            this .tool .pointsDisplay = true;
            this .tool .linesDisplay  = false;

            X3DPointGeometryNodeTool .prototype .set_toolRebuildGeometry .call (this);
            break;
         }
         case 1:
         {
            this .tool .pointsDisplay = true;
            this .tool .linesDisplay  = false;

            X3DLineGeometryNodeTool .prototype .set_toolRebuildGeometry .call (this);
            break;
         }
         case 2:
         case 3:
         {
            this .tool .pointsDisplay = false;
            this .tool .linesDisplay  = true;

            super .set_toolRebuildGeometry ();
            break
         }
      }
   }
}

module .exports = InlineGeometryTool;
