"use strict";

const
   X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool"),
   X3D                 = require ("../../X3D");

class CylinderTool extends X3DGeometryNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ("CUSTOM");

      this .node ._height .addInterest ("set_height_and_radius", this);
      this .node ._radius .addInterest ("set_height_and_radius", this);

      this .node ._side                          .addInterest ("set_optionNode", this);
      this .node ._bottom                        .addInterest ("set_optionNode", this);
      this .node ._top                           .addInterest ("set_optionNode", this);
      this .getBrowser () .getCylinderOptions () .addInterest ("set_optionNode", this);

      this .tool .linesDisplay = true;

      this .set_height_and_radius ();
      this .set_optionNode ();
   }

   disposeTool ()
   {
      this .node ._height .removeInterest ("set_height_and_radius", this);
      this .node ._radius .removeInterest ("set_height_and_radius", this);

      this .node ._side                          .removeInterest ("set_optionNode", this);
      this .node ._bottom                        .removeInterest ("set_optionNode", this);
      this .node ._top                           .removeInterest ("set_optionNode", this);
      this .getBrowser () .getCylinderOptions () .removeInterest ("set_optionNode", this);
   }

   set_height_and_radius ()
   {
      const
         y = Math .abs (this .node ._height .getValue () / 2),
         r = Math .abs (this .node ._radius .getValue ());

      this .tool .size = new X3D .Vector3 (r, y, r);
   }

   set_optionNode ()
   {
      const
         optionNode = this .getBrowser () .getCylinderOptions (),
         dimension  = optionNode ._dimension .getValue (),
         coordIndex = [ ];

      if (this .node ._side .getValue ())
         coordIndex .push (... optionNode .getSideGeometry () ._coordIndex);

      if (this .node ._bottom .getValue ())
      {
         coordIndex .push (... optionNode .getBottomGeometry () ._coordIndex);
         coordIndex .splice (-1, 0, coordIndex .at (-dimension - 1));
      }

      if (this .node ._top .getValue ())
      {
         coordIndex .push (... optionNode .getTopGeometry () ._coordIndex);
         coordIndex .splice (-1, 0, coordIndex .at (-dimension - 1));
      }

      this .tool .set_linesCoordIndex = coordIndex;
      this .tool .linesCoord          = optionNode .getSideGeometry () ._coord;

      this .addExternalNode (optionNode .getSideGeometry () ._coord);
   }
}

module .exports = CylinderTool;
