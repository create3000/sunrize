"use strict";

const X3DSnapNodeTool = require ("./X3DSnapNodeTool");

class SnapTargetTool extends X3DSnapNodeTool
{
   constructor (executionContext)
   {
      super (executionContext);
   }

   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .type = "SNAP_TARGET";
   }
}

module .exports = SnapTargetTool;
