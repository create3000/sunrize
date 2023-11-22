"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   Editor           = require ("../../Undo/Editor");

class X3DViewpointNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   toolType = 0;

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DViewpointNodeTool.x3d");

      this .tool .getField ("orientation") .addReference (this .node ._orientation);

      this .tool .getField ("isActive") .addInterest ("handleUndo", this);

      this .node ._isBound .addFieldInterest (this .tool .getField ("bound"));

      this .tool .type  = this .toolType;
      this .tool .bound = this .node ._isBound;
   }

   disposeTool ()
   {
      this .node ._isBound .removeFieldInterest (this .tool .getField ("bound"));

      super .disposeTool ();
   }

   #initialPosition;
   #initialOrientation;

   beginUndo ()
   {
      this .#initialPosition    = this ._position    .copy ();
      this .#initialOrientation = this ._orientation .copy ();
   }

   endUndo ()
   {
      const
         position    = this ._position    .copy (),
         orientation = this ._orientation .copy ();

      this ._position    = this .#initialPosition;
      this ._orientation = this .#initialOrientation;

      Editor .setFieldValue (this .getExecutionContext (), this .node, this ._position,    position);
      Editor .setFieldValue (this .getExecutionContext (), this .node, this ._orientation, orientation);
   }
}

module .exports = X3DViewpointNodeTool;
