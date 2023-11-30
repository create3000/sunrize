"use strict";

const
   X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool"),
   X3D                 = require ("../../X3D");

class ConeTool extends X3DGeometryNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ("CUSTOM");

      this .node ._height       .addInterest ("set_height_and_bottomRadius", this);
      this .node ._bottomRadius .addInterest ("set_height_and_bottomRadius", this);

      this .node ._side                      .addInterest ("set_optionNode", this);
      this .node ._bottom                    .addInterest ("set_optionNode", this);
      this .getBrowser () .getConeOptions () .addInterest ("set_optionNode", this);

      this .set_height_and_bottomRadius ();
      this .set_optionNode ();
   }

   disposeTool ()
   {
      this .node ._height       .removeInterest ("set_height_and_bottomRadius", this);
      this .node ._bottomRadius .removeInterest ("set_height_and_bottomRadius", this);

      this .node ._side                      .removeInterest ("set_optionNode", this);
      this .node ._bottom                    .removeInterest ("set_optionNode", this);
      this .getBrowser () .getConeOptions () .removeInterest ("set_optionNode", this);
   }

   set_height_and_bottomRadius ()
   {
      const
         y = Math .abs (this .node ._height .getValue () / 2),
         r = Math .abs (this .node ._bottomRadius .getValue ());

      this .tool .size = new X3D .Vector3 (r, y, r);
   }

   set_optionNode ()
   {
      const
         optionNode = this .getBrowser () .getConeOptions (),
         dimension  = optionNode ._dimension .getValue (),
         coordIndex = [ ];

      if (this .node ._side .getValue ())
         coordIndex .push (... optionNode .getSideGeometry () ._coordIndex);

      if (this .node ._bottom .getValue ())
      {
         coordIndex .push (... optionNode .getBottomGeometry () ._coordIndex);
         coordIndex .splice (-1, 0, coordIndex .at (-dimension - 1));
      }

      this .tool .set_linesCoordIndex = coordIndex;
      this .tool .linesCoord          = optionNode .getSideGeometry () ._coord;

      this .addExternalNode (optionNode .getSideGeometry () ._coord);
   }
}

module .exports = ConeTool;
