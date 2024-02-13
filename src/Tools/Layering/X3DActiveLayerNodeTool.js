"use strict";

const X3DChildNodeTool = require ("../Core/X3DChildNodeTool");

class X3DActiveLayerNodeTool extends X3DChildNodeTool
{
   #visible         = true;
   #activeLayerNode = null;

   constructor (executionContext)
   {
      const node = executionContext .createNode ("Group", false);

      node .setup ();

      super (node);
   }

   isVisible ()
   {
      return this .#visible;
   }

   setVisible (value)
   {
      if (this .#visible === value)
         return;

      this .#visible = value;

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

      if (this .#visible)
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
