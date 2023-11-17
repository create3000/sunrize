"use strict"

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D")

class X3DLightNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DLightNodeTool.x3d")

      this .node ._on        .addFieldInterest (this .tool .getField ("on"))
      this .node ._color     .addFieldInterest (this .tool .getField ("color"))
      this .node ._intensity .addFieldInterest (this .tool .getField ("intensity"))

      this .tool .on        = this .node ._on
      this .tool .color     = this .node ._color
      this .tool .intensity = this .node ._intensity
   }
}

module .exports = X3DLightNodeTool
