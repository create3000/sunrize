"use strict";

const
   X3DSnapNodeTool = require ("./X3DSnapNodeTool"),
   ActionKeys      = require ("../../Application/ActionKeys"),
   X3D             = require ("../../X3D");

class SnapTarget extends X3DSnapNodeTool
{
   #transformTools = [ ];
   #changing       = Symbol ();

   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .type = "SNAP_TARGET";
   }

   connectTool ()
   {
      super .connectTool ();

      X3DSnapNodeTool .snapTarget = true;

      X3DSnapNodeTool .addToolInterest (this, () => this .set_transform_tools ());

      this .set_transform_tools ();
   }

   disconnectTool ()
   {
      X3DSnapNodeTool .snapTarget = false;

      X3DSnapNodeTool .removeToolInterest (this);

      super .disconnectTool ();
   }

   set_transform_tools ()
   {
      for (const transformTool of this .#transformTools)
         transformTool .removeInterest ("set_transform", this);

      this .#transformTools .length = 0;

      for (const transformTool of X3DSnapNodeTool .tools)
      {
         if (!(transformTool instanceof X3D .X3DTransformNode))
            continue;

         this .#transformTools .push (transformTool);
      }

      for (const transformTool of this .#transformTools)
         transformTool .addInterest ("set_transform", this, transformTool);
   }

   set_transform (transformTool)
   {
      if (!this ._visible .getValue ())
         return;

      if (ActionKeys .value === (ActionKeys .Shift | ActionKeys .Control))
         return;

      if (!transformTool .tool .isActive)
         return;

      switch (transformTool .tool .activeTool)
      {
         case "TRANSLATE":
            this .set_translation (transformTool);
            return;
         case "ROTATE":
            this .set_rotation (transformTool);
            return;
         case "SCALE":
            this .set_scale (transformTool);
            return;
      }
   }

   set_translation (transformTool)
   {
      // if (transformTool .getUserData (this .#changing))
      // {
      //    transformTool .setUserData (this .#changing, false);
      //    return;
      // }
   }

   set_rotation (transformTool)
   {
      // if (transformTool .getUserData (this .#changing))
      // {
      //    transformTool .setUserData (this .#changing, false);
      //    return;
      // }
   }

   set_scale (transformTool)
   {
      // if (transformTool .getUserData (this .#changing))
      // {
      //    transformTool .setUserData (this .#changing, false);
      //    return;
      // }
   }
}

module .exports = SnapTarget;
