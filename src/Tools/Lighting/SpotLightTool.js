"use strict";

const X3DLightNodeTool = require ("./X3DLightNodeTool");

class SpotLightTool extends X3DLightNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getField ("location")    .addReference (this .node ._location);
      this .tool .getField ("direction")   .addReference (this .node ._direction);
      this .tool .getField ("beamWidth")   .addReference (this .node ._beamWidth);
      this .tool .getField ("cutOffAngle") .addReference (this .node ._cutOffAngle);

      this .tool .type = 2;
   }
}

module .exports = SpotLightTool;
