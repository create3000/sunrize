"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   Editor           = require ("../../Undo/Editor");

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

      this .tool .getField ("isActive") .addInterest ("set_tool_active__", this);
   }

   #initialLocation;
   #initialDirection;

   beginUndo ()
   {
      this .#initialLocation  = this ._location  .copy ();
      this .#initialDirection = this ._direction .copy ();
   }

   endUndo ()
   {
      const
         location  = this ._location  .copy (),
         direction = this ._direction .copy ();

      this ._location  = this .#initialLocation;
      this ._direction = this .#initialDirection;

      Editor .setFieldValue (this .getExecutionContext (), this .node, this ._location,  location);
      Editor .setFieldValue (this .getExecutionContext (), this .node, this ._direction, direction);
   }
}

module .exports = SoundTool;
