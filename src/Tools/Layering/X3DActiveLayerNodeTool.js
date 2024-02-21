"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D");

class X3DActiveLayerNodeTool extends X3DChildNodeTool
{
   #activeLayerNode = null;

   constructor (executionContext)
   {
      const node = executionContext .createNode ("Group", false);

      node .setup ();

      super (node);
   }

   async initializeTool (... args)
   {
      await super .initializeTool (... args);

      this .getBrowser () .getActiveLayer () .addInterest ("set_activeLayer", this);

      this ._visible .addInterest ("set_visible", this);

      this .set_activeLayer ();
      this .set_visible ();
   }

   disposeTool ()
   {
      this .getBrowser () .getActiveLayer () .removeInterest ("set_activeLayer", this);

      this .disconnectTool ();
      this .removeFromLayer (this .#activeLayerNode);

      super .disposeTool ();
   }

   set_activeLayer ()
   {
      this .removeFromLayer (this .#activeLayerNode);

      this .#activeLayerNode = this .getBrowser () .getActiveLayer ();

      this .addToLayer (this .#activeLayerNode)
   }

   addToLayer (layerNode)
   {
      if (!layerNode)
         return;

      layerNode .getGroups () ._children .push (this);
   }

   removeFromLayer (layerNode)
   {
      if (!layerNode)
         return;

      const index = layerNode .getGroups () ._children .findIndex (node => node .getValue () === this);

      if (index > -1)
         layerNode .getGroups () ._children .splice (index, 1);
   }

   set_visible ()
   {
      if (this ._visible .getValue ())
         this .connectTool ();
      else
         this .disconnectTool ();
   }

   connectTool () { }

   disconnectTool () { }

   getModelMatrix ()
   {
      return new X3D .Matrix4 ();
   }
}

module .exports = X3DActiveLayerNodeTool;
