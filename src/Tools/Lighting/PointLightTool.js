"use strict"

const X3DLightNodeTool = require ("./X3DLightNodeTool")

class PointLightTool extends X3DLightNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ()

      this .node ._location .addFieldInterest (this .tool .getField ("location"))

      this .tool .location    = this .node ._location
      this .tool .whichChoice = 1
   }
}

module .exports = PointLightTool
