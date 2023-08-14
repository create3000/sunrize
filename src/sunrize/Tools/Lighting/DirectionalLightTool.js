"use strict"

const X3DLightNodeTool = require ("./X3DLightNodeTool")

class DirectionalLightTool extends X3DLightNodeTool
{

   async initialize ()
   {
      await super .initialize ()

      this .toolNode ._direction .addFieldInterest (this .tool .direction)

      this .tool .direction   = this .toolNode ._direction
      this .tool .whichChoice = 0
   }
}

module .exports = DirectionalLightTool
