"use strict"

const X3DLightNodeTool = require ("./X3DLightNodeTool")

class PointLightTool extends X3DLightNodeTool
{
   async initialize ()
   {
      await super .initialize ()

      this .toolNode ._location .addFieldInterest (this .tool .location)

      this .tool .location    = this .toolNode ._location
      this .tool .whichChoice = 1
   }
}

module .exports = PointLightTool
