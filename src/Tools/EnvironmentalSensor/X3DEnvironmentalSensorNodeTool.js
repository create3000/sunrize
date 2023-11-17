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

      this .node ._size   .addFieldInterest (this .tool .getField ("size"))
      this .node ._center .addFieldInterest (this .tool .getField ("center"))

      this .tool .boxColor = this .toolBoxColor
      this .tool .size     = this .node ._size
      this .tool .center   = this .node ._center
   }
}

module .exports = X3DEnvironmentalSensorNodeTool
