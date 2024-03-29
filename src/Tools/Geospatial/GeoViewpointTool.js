"use strict";

const X3DViewpointNodeTool = require ("../Navigation/X3DViewpointNodeTool");

class GeoViewpointTool extends X3DViewpointNodeTool
{
   #changing = false;

   async initializeTool ()
   {
      await super .initializeTool ();

      this .node ._position             .addInterest ("set_node_position", this);
      this .tool .getField ("position") .addInterest ("set_tool_position", this);

      this .set_node_position ();
   }

   set_node_position ()
   {
      if (this .#changing)
      {
         this .#changing = false;
         return;
      }

      this .#changing = true;

      this .tool .position = this .node .getPosition ();
   }

   set_tool_position ()
   {
      if (this .#changing)
      {
         this .#changing = false;
         return;
      }

      this .#changing = true;

      this .node .setPosition (this .tool .getField ("position") .getValue ());
   }
}

module .exports = GeoViewpointTool;
