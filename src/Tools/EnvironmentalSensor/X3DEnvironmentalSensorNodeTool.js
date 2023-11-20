"use strict"

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D")

class X3DEnvironmentalSensorNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DEnvironmentalSensorNodeTool.x3d")

      this .tool .getField ("size")   .addReference (this .node ._size);
      this .tool .getField ("center") .addReference (this .node ._center);

      this .tool .boxColor = this .toolBoxColor
   }
}

module .exports = X3DEnvironmentalSensorNodeTool
