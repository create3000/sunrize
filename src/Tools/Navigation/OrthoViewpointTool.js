"use strict"

const X3DViewpointNodeTool = require ("./X3DViewpointNodeTool")

class OrthoViewpointTool extends X3DViewpointNodeTool
{
   toolWhichChoice = 1

   async initializeTool ()
   {
      await super .initializeTool ()

      this .node ._position .addFieldInterest (this .tool .getField ("position"))

      this .tool .position = this .node ._position
   }
}

module .exports = OrthoViewpointTool
