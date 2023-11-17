"use strict"

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D")

class X3DViewpointNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false

   toolWhichChoice = 0

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DViewpointNodeTool.x3d")

      this .node ._orientation .addFieldInterest (this .tool .getField ("orientation"))
      this .node ._isBound     .addFieldInterest (this .tool .getField ("bound"))

      this .tool .whichChoice = this .toolWhichChoice
      this .tool .orientation = this .node ._orientation
      this .tool .bound       = this .node ._isBound
   }
}

module .exports = X3DViewpointNodeTool
