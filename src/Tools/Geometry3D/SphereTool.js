"use strict";

const
   X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool"),
   X3D                 = require ("../../X3D");

class SphereTool extends X3DGeometryNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ("CUSTOM");

      this .node ._radius                      .addInterest ("set_radius",     this);
      this .getBrowser () .getSphereOptions () .addInterest ("set_optionNode", this);

      this .set_radius (this .node ._radius);
      this .set_optionNode (this .getBrowser () .getSphereOptions ());
   }

   disposeTool ()
   {
      this .node ._radius                      .removeInterest ("set_radius",     this);
      this .getBrowser () .getSphereOptions () .removeInterest ("set_optionNode", this);
   }

   set_radius (radius)
   {
      const r = Math .abs (radius .getValue ());

      this .tool .size = new X3D .Vector3 (r, r, r);
   }

   set_optionNode (optionNode)
   {
      this .tool .set_linesCoordIndex = optionNode .getGeometry () ._coordIndex;
      this .tool .linesCoord          = optionNode .getGeometry () ._coord;

      this .addExternalNode (optionNode .getGeometry () ._coord);
   }
}

module .exports = SphereTool;
