"use strict";

const
   X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool"),
   X3D                 = require ("../../X3D");

class ConeTool extends X3DGeometryNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .node ._height       .addInterest ("set_height_and_bottomRadius", this);
      this .node ._bottomRadius .addInterest ("set_height_and_bottomRadius", this);

      this .node ._side                      .addInterest ("set_optionNode", this);
      this .node ._bottom                    .addInterest ("set_optionNode", this);
      this .getBrowser () .getConeOptions () .addInterest ("set_optionNode", this);

      this .tool .linesDisplay = true;

      this .set_height_and_bottomRadius ();
      this .set_optionNode ();
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
         coordIndex = [ ];

      if (this .node ._side .getValue ())
         coordIndex .push (... optionNode .getSideGeometry () ._coordIndex);

      if (this .node ._bottom .getValue ())
         coordIndex .push (... optionNode .getBottomGeometry () ._coordIndex);

      this .tool .set_linesCoordIndex = coordIndex;
      this .tool .linesCoord          = optionNode .getSideGeometry () ._coord;
   }
}

module .exports = ConeTool;
