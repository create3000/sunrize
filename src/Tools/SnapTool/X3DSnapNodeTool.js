"use strict";

const
   X3DActiveLayerNodeTool = require ("../Layering/X3DActiveLayerNodeTool"),
   X3D                    = require ("../../X3D"),
   $                      = require ("jquery");

class X3DSnapNodeTool extends X3DActiveLayerNodeTool
{
   constructor (executionContext)
   {
      super (executionContext);
   }

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "SnapTool.x3d");
   }

   connectTool ()
   {
      super .connectTool ();

      X3DSnapNodeTool .addToolInterest (this, () => this .set_transform_tools ());

      $("#browser")
         .on (`mousedown.X3DSnapNodeTool${this .getId ()}`, event => this .onmousedown (event))
         .on (`mouseup.X3DSnapNodeTool${this .getId ()}`,   event => this .onmouseup   (event));

      this .set_transform_tools ();
   }

   disconnectTool ()
   {
      X3DSnapNodeTool .removeToolInterest (this);

      $("#browser") .off (`.X3DSnapNodeTool${this .getId ()}`);

      super .disconnectTool ();
   }

   set_transform_tools ()
   {
   }

   onmousedown (event)
   {
      console .log ("onmousedown", event .button);

      $("#browser") .on (`mousemove.X3DSnapNodeTool${this .getId ()}`, event => this .onmousemove (event));
   }

   onmouseup (event)
   {
      console .log ("onmouseup", event .button);

      $("#browser") .off (`mousemove.X3DSnapNodeTool${this .getId ()}`);
   }

   onmousemove (event)
   {
      console .log ("onmousemove", event .pageX, event .pageY);
   }
}

module .exports = X3DSnapNodeTool;
