"use strict"

const
   X3DNodeTool = require ("../Core/X3DNodeTool"),
   X3D         = require ("../../X3D")

class X3DViewpointNodeTool extends X3DNodeTool
{
   static createOnSelection = false
   static createOnDemand    = true

   toolWhichChoice = 0

   async initialize ()
   {
      await super .initialize (__dirname, "X3DViewpointNodeTool.x3d")

      this .toolNode ._position    .addFieldInterest (this .tool .position)
      this .toolNode ._orientation .addFieldInterest (this .tool .orientation)
      this .toolNode ._isBound     .addFieldInterest (this .tool .getValue () .getField ("bound"))

      this .tool .position    = this .toolNode ._position
      this .tool .orientation = this .toolNode ._orientation
      this .tool .bound       = this .toolNode ._isBound
      this .tool .whichChoice = this .toolWhichChoice
   }

   getMustDisplay ()
   {
      return true
   }
}

module .exports = X3DViewpointNodeTool
