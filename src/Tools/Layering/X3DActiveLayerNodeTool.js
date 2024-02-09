"use strict";

const X3DChildNodeTool = require ("../Core/X3DChildNodeTool");

class X3DActiveLayerNodeTool extends X3DChildNodeTool
{
   #enabled         = true;
   #activeLayerNode = null;

   constructor (browser)
   {
      const node = browser .getPrivateScene () .createNode ("Group", false);

      node .setup ();

      super (node);
   }

   setEnabled (value)
   {
      if (this .#enabled === value)
         return;

      this .#enabled = value;

      this .set_activeLayer ();
   }

   async initializeTool (... args)
   {
      await super .initializeTool (... args);

      this .getBrowser () .getActiveLayer () .addInterest ("set_activeLayer", this);

      this .set_activeLayer ();
   }

   disposeTool ()
   {
      this .getBrowser () .getActiveLayer () .removeInterest ("set_activeLayer", this);

      this .removeFromLayer (this .#activeLayerNode);

      super .disposeTool ();
   }

   set_activeLayer ()
   {
      this .removeFromLayer (this .#activeLayerNode);

      this .#activeLayerNode = this .getBrowser () .getActiveLayer ();

      if (this .#enabled)
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
}

module .exports = X3DActiveLayerNodeTool;
