"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D");

class X3DActiveLayerNodeTool extends X3DChildNodeTool
{
   #layerNode = null;

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
      this .removeFromLayer (this .#layerNode);

      super .disposeTool ();
   }

   set_activeLayer ()
   {
      this .removeFromLayer (this .#layerNode);

      this .#layerNode = this .getBrowser () .getActiveLayer ();

      this .addToLayer (this .#layerNode)
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
      const layoutGroupNode = X3D .X3DCast (X3D .X3DConstants .LayoutGroup, this .#layerNode .getGroups () ._children [0]);

      if (layoutGroupNode)
         return layoutGroupNode .getMatrix ();

      return new X3D .Matrix4 ();
   }
}

module .exports = X3DActiveLayerNodeTool;
