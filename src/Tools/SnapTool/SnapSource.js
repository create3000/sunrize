"use strict";

const
   X3DSnapNodeTool = require ("./X3DSnapNodeTool"),
   ActionKeys      = require ("../../Application/ActionKeys");

class SnapSource extends X3DSnapNodeTool
{
   toolModifiers = ActionKeys .Option;

   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .type = "SNAP_SOURCE";
   }
}

module .exports = SnapSource;
