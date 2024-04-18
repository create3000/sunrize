"use strict";

const X3DChildNodeTool = require ("../Core/X3DChildNodeTool");

class X3DLightNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DLightNodeTool.x3d");

      this .tool .getField ("on")        .addReference (this .node ._on);
      this .tool .getField ("color")     .addReference (this .node ._color);
      this .tool .getField ("intensity") .addReference (this .node ._intensity);

      this .tool .getField ("isActive") .addInterest ("handleUndo", this);
   }

   getBBox (bbox, shadows)
   {
      return this .getToolBBox (bbox, shadows);
   }
}

module .exports = X3DLightNodeTool;
