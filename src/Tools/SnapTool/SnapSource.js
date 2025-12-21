"use strict";

const
   X3DSnapNodeTool = require ("./X3DSnapNodeTool"),
   ActionKeys      = require ("../../Application/ActionKeys"),
   X3D             = require ("../../X3D");

class SnapSource extends X3DSnapNodeTool
{
   toolModifiers = ActionKeys .Shift | ActionKeys .Option;

   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .normal = new X3D .Vector3 (0, -1, 0);
      this .tool .type   = "SNAP_SOURCE";
   }
}

module .exports = SnapSource;
