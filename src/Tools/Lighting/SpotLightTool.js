"use strict"

const X3DLightNodeTool = require ("./X3DLightNodeTool")

class SpotLightTool extends X3DLightNodeTool
{
   async initialize ()
   {
      await super .initialize ()

      this .toolNode ._location    .addFieldInterest (this .tool .getField ("location"))
      this .toolNode ._direction   .addFieldInterest (this .tool .getField ("direction"))
      this .toolNode ._beamWidth   .addFieldInterest (this .tool .getField ("beamWidth"))
      this .toolNode ._cutOffAngle .addFieldInterest (this .tool .getField ("cutOffAngle"))

      this .tool .location    = this .toolNode ._location
      this .tool .direction   = this .toolNode ._direction
      this .tool .beamWidth   = this .toolNode ._beamWidth
      this .tool .cutOffAngle = this .toolNode ._cutOffAngle
      this .tool .whichChoice = 2
   }
}

module .exports = SpotLightTool
