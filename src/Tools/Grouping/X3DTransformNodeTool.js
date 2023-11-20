"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D"),
   Editor           = require ("../../Undo/Editor"),
   UndoManager      = require ("../../Undo/UndoManager"),
   ActionKeys       = require ("../../Application/ActionKeys"),
   _                = require ("../../Application/GetText");

class X3DTransformNodeTool extends X3DChildNodeTool
{
   undoEnabled = true;

   #tools = [
      "TRANSLATE",
      "ROTATE",
      "SCALE",
   ];

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DTransformNodeTool.x3d");

      this .getBrowser () .displayEvents () .addInterest ("reshapeTool", this);

      this .keys = new ActionKeys (`X3DTransformNodeTool${this .getId ()}`, this .set_keys__ .bind (this));

      this .tool .getField ("translation")      .addReference (this .node ._translation);
      this .tool .getField ("rotation")         .addReference (this .node ._rotation);
      this .tool .getField ("scale")            .addReference (this .node ._scale);
      this .tool .getField ("scaleOrientation") .addReference (this .node ._scaleOrientation);
      this .tool .getField ("center")           .addReference (this .node ._center);

      this .tool .getField ("isCenterActive") .addInterest ("set_active__", this);
      this .tool .getField ("isActive")       .addInterest ("set_active__", this);

      this .tool .bboxColor = this .toolBBoxColor;
   }

   disposeTool ()
   {
      this .getBrowser () .displayEvents () .removeInterest ("reshapeTool", this);
      this .keys .dispose ();

      super .disposeTool ();
   }

   set_keys__ (keys)
   {
      if (this .tool .tools .includes ("TRANSLATE"))
      {
         var scaleMode = keys === ActionKeys .Option || keys === (ActionKeys .Shift | ActionKeys .Option)
            ? "SCALE_FROM_OPPOSITE_HANDLE"
            : "SCALE_FROM_CENTER";
      }
      else
      {
         var scaleMode = "SCALE_FROM_CENTER";
      }

      this .tool .translateMode = keys === ActionKeys .Option ? "TRANSLATE_ALONG_PLANE" : "TRANSLATE_ALONG_AXIS";
      this .tool .scaleMode     = scaleMode;
      this .tool .scaleUniform  = keys === ActionKeys .Shift || keys === (ActionKeys .Shift | ActionKeys .Option);
   }

   set_active__ (active)
   {
      if (!this .undoEnabled)
         return;

      if (active .getValue ())
      {
         this .initialTranslation      = this ._translation      .copy ();
         this .initialRotation         = this ._rotation         .copy ();
         this .initialScale            = this ._scale            .copy ();
         this .initialScaleOrientation = this ._scaleOrientation .copy ();
         this .initialCenter           = this ._center           .copy ();

         this .specialTool = this .tool .isCenterActive ? "CENTER" : undefined;
      }
      else
      {
         switch (this .specialTool ?? this .#tools [this .tool .activeTool])
         {
            case "TRANSLATE":
            {
               if (this .getDisplayName ())
                  UndoManager .shared .beginUndo (_ ("Translate %s '%s'"), this .getTypeName (), this .getDisplayName ());
               else
                  UndoManager .shared .beginUndo (_ ("Translate %s"), this .getTypeName ());
               break;
            }
            case "ROTATE":
            {
               if (this .getDisplayName ())
                  UndoManager .shared .beginUndo (_ ("Rotate %s '%s'"), this .getTypeName (), this .getDisplayName ());
               else
                  UndoManager .shared .beginUndo (_ ("Rotate %s"), this .getTypeName ());
               break;
            }
            case "SCALE":
            {
               if (this .getDisplayName ())
                  UndoManager .shared .beginUndo (_ ("Scale %s '%s'"), this .getTypeName (), this .getDisplayName ());
               else
                  UndoManager .shared .beginUndo (_ ("Scale %s"), this .getTypeName ());
               break;
            }
            case "CENTER":
            {
               if (this .getDisplayName ())
                  UndoManager .shared .beginUndo (_ ("Translate Center Of %s '%s'"), this .getTypeName (), this .getDisplayName ());
               else
                  UndoManager .shared .beginUndo (_ ("Translate Center Of %s"), this .getTypeName ());
               break;
            }
         }

         const
            translation      = this ._translation      .copy (),
            rotation         = this ._rotation         .copy (),
            scale            = this ._scale            .copy (),
            scaleOrientation = this ._scaleOrientation .copy (),
            center           = this ._center           .copy ();

         this ._translation      = this .initialTranslation;
         this ._rotation         = this .initialRotation;
         this ._scale            = this .initialScale;
         this ._scaleOrientation = this .initialScaleOrientation;
         this ._center           = this .initialCenter;

         Editor .setFieldValue (this .getExecutionContext (), this .node, this ._translation,      translation);
         Editor .setFieldValue (this .getExecutionContext (), this .node, this ._rotation,         rotation);
         Editor .setFieldValue (this .getExecutionContext (), this .node, this ._scale,            scale);
         Editor .setFieldValue (this .getExecutionContext (), this .node, this ._scaleOrientation, scaleOrientation);
         Editor .setFieldValue (this .getExecutionContext (), this .node, this ._center,           center);

         UndoManager .shared .endUndo ();

         this .specialTool = undefined;
      }
   }

   static box = new X3D .Box3 ();

   reshapeTool ()
   {
      const
         bbox       = this .node .getSubBBox (X3DTransformNodeTool .box),
         bboxSize   = bbox .size,
         bboxCenter = bbox .center;

      if (!this .tool .bboxSize .getValue () .equals (bboxSize))
         this .tool .bboxSize = bboxSize;

      if (!this .tool .bboxCenter .getValue () .equals (bboxCenter))
         this .tool .bboxCenter = bboxCenter;
   }
}

module .exports = X3DTransformNodeTool;
