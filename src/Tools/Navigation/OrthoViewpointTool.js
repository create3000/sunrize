"use strict"

const X3DViewpointNodeTool = require ("./X3DViewpointNodeTool")

class OrthoViewpointTool extends X3DViewpointNodeTool
{
   toolWhichChoice = 1

   async initialize ()
   {
      await super .initialize ()

      this .toolNode ._position .addFieldInterest (this .tool .position)

      this .tool .position = this .toolNode ._position
   }
}

module .exports = OrthoViewpointTool
