"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D");

class X3DActiveLayerNodeTool extends X3DChildNodeTool
{
   toolLayerNode = null;

   constructor (executionContext)
   {
      const node = executionContext .createNode ("Group", false);

      node ._visible = false;

      node .setup ();

      super (node);
   }

   async initializeTool (... args)
   {
      await super .initializeTool (... args);

      this .getBrowser () ._activeLayer .addInterest ("set_activeLayer", this);

      this ._visible .addInterest ("set_visible", this);

      this .set_visible ();
      this .set_activeLayer ();
   }

   disposeTool ()
   {
      this .getBrowser () ._activeLayer .removeInterest ("set_activeLayer", this);

      this .disconnectTool ();
      this .removeFromLayer (this .toolLayerNode);

      super .disposeTool ();
   }

   set_visible ()
   {
      if (this ._visible .getValue ())
         this .connectTool ();
      else
         this .disconnectTool ();
   }

   set_activeLayer ()
   {
      this .removeFromLayer (this .toolLayerNode);

      this .toolLayerNode = this .getBrowser () .getActiveLayer ();

      this .addToLayer (this .toolLayerNode);
      this .configureTool ();
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

   connectTool () { }

   disconnectTool () { }

   configureTool () { }
}

module .exports = X3DActiveLayerNodeTool;
