"use strict"

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D")

class X3DViewpointNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false

   toolWhichChoice = 0

   async initialize ()
   {
      await super .initialize (__dirname, "X3DViewpointNodeTool.x3d")

      this .toolNode ._orientation .addFieldInterest (this .tool .getField ("orientation"))
      this .toolNode ._isBound     .addFieldInterest (this .tool .getField ("bound"))

      this .tool .whichChoice = this .toolWhichChoice
      this .tool .orientation = this .toolNode ._orientation
      this .tool .bound       = this .toolNode ._isBound
   }
}

module .exports = X3DViewpointNodeTool
