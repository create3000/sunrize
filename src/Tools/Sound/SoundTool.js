"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D");

class SoundTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "SoundTool.x3d");

      this .tool .getField ("location")  .addReference (this .node ._location);
      this .tool .getField ("direction") .addReference (this .node ._direction);
      this .tool .getField ("minBack")   .addReference (this .node ._minBack);
      this .tool .getField ("minFront")  .addReference (this .node ._minFront);
      this .tool .getField ("maxBack")   .addReference (this .node ._maxBack);
      this .tool .getField ("maxFront")  .addReference (this .node ._maxFront);
   }
}

module .exports = SoundTool;
