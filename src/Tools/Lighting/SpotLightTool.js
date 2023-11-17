"use strict"

const X3DLightNodeTool = require ("./X3DLightNodeTool")

class SpotLightTool extends X3DLightNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ()

      this .node ._location    .addFieldInterest (this .tool .getField ("location"))
      this .node ._direction   .addFieldInterest (this .tool .getField ("direction"))
      this .node ._beamWidth   .addFieldInterest (this .tool .getField ("beamWidth"))
      this .node ._cutOffAngle .addFieldInterest (this .tool .getField ("cutOffAngle"))

      this .tool .location    = this .node ._location
      this .tool .direction   = this .node ._direction
      this .tool .beamWidth   = this .node ._beamWidth
      this .tool .cutOffAngle = this .node ._cutOffAngle
      this .tool .whichChoice = 2
   }
}

module .exports = SpotLightTool
