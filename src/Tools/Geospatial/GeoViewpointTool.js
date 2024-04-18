"use strict";

const X3DViewpointNodeTool = require ("../Navigation/X3DViewpointNodeTool");

class GeoViewpointTool extends X3DViewpointNodeTool
{
   #changing = { position: false, orientation: false };

   async initializeTool ()
   {
      await super .initializeTool ();

      this .node ._position             .addInterest ("set_node_position", this);
      this .tool .getField ("position") .addInterest ("set_tool_position", this);

      this .node ._orientation             .addInterest ("set_node_orientation", this);
      this .tool .getField ("orientation") .addInterest ("set_tool_orientation", this);

      this .set_node_position ();
      this .set_node_orientation ();
   }

   set_node_position ()
   {
      if (this .#changing .position)
      {
         this .#changing .position = false;
         return;
      }

      this .#changing .position = true;

      this .tool .position = this .node .getPosition ();
   }

   set_tool_position ()
   {
      if (this .#changing .position)
      {
         this .#changing .position = false;
         return;
      }

      this .#changing .position = true;

      this .node .setPosition (this .tool .getField ("position") .getValue ());
   }

   set_node_orientation ()
   {
      if (this .#changing .orientation)
      {
         this .#changing .orientation = false;
         return;
      }

      this .#changing .orientation = true;

      this .tool .orientation = this .node .getOrientation ();
   }

   set_tool_orientation ()
   {
      if (this .#changing .orientation)
      {
         this .#changing .orientation = false;
         return;
      }

      this .#changing .orientation = true;

      this .node .setOrientation (this .tool .getField ("orientation") .getValue ());
   }
}

module .exports = GeoViewpointTool;
