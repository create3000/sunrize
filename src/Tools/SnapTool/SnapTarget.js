"use strict";

const X3DSnapNodeTool = require ("./X3DSnapNodeTool");

class SnapTarget extends X3DSnapNodeTool
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

module .exports = SnapTarget;
