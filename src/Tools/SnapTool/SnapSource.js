"use strict";

const X3DSnapNodeTool = require ("./X3DSnapNodeTool");

class SnapSource extends X3DSnapNodeTool
{
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

module .exports = SnapSource;
