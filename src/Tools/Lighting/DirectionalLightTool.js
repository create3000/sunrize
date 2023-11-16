"use strict"

const X3DLightNodeTool = require ("./X3DLightNodeTool")

class DirectionalLightTool extends X3DLightNodeTool
{
   async initialize ()
   {
      await super .initialize ()

      this .node ._direction .addFieldInterest (this .tool .getField ("direction"))

      this .tool .direction   = this .node ._direction
      this .tool .whichChoice = 0
   }
}

module .exports = DirectionalLightTool
