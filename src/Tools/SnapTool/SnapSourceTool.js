"use strict";

const
   X3DSnapNodeTool = require ("./X3DSnapNodeTool"),
   ActionKeys      = require ("../../Application/ActionKeys");

class SnapSourceTool extends X3DSnapNodeTool
{
   toolModifiers = ActionKeys .Option;
   
   constructor (executionContext)
   {
      super (executionContext);
   }

   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .type = "SNAP_SOURCE";
   }
}

module .exports = SnapSourceTool;
