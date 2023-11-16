"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D"),
   Editor           = require ("../../Undo/Editor"),
   UndoManager      = require ("../../Undo/UndoManager"),
   _                = require ("../../Application/GetText");

class X3DTransformNodeTool extends X3DChildNodeTool
{
   async initialize ()
   {
      await super .initialize (__dirname, "X3DTransformNodeTool.x3d");

      this .getBrowser () .displayEvents () .addInterest ("reshape", this);

      this .tool .getField ("isActive") .addInterest ("set_active", this);

      this .tool .getField ("translation")      .addReference (this .toolNode ._translation);
      this .tool .getField ("rotation")         .addReference (this .toolNode ._rotation);
      this .tool .getField ("scale")            .addReference (this .toolNode ._scale);
      this .tool .getField ("scaleOrientation") .addReference (this .toolNode ._scaleOrientation);
      this .tool .getField ("center")           .addReference (this .toolNode ._center);

      this .tool .centerDisplay = false;
      this .tool .bboxDisplay   = true;
      this .tool .bboxColor     = this .toolBBoxColor;
   }

   removeTool ()
   {
      this .getBrowser () .displayEvents () .removeInterest ("reshape", this);

      return super .removeTool ();
   }

   set_active (active)
   {
      if (active .getValue ())
      {
         this .initialTranslation      = this ._translation      .copy ();
         this .initialRotation         = this ._rotation         .copy ();
         this .initialScale            = this ._scale            .copy ();
         this .initialScaleOrientation = this ._scaleOrientation .copy ();
         this .initialCenter           = this ._center           .copy ();
      }
      else
      {
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

         switch (this .tool .activeTool)
         {
            case 1:
               UndoManager .shared .beginUndo (_ ("Move Transform"));
               break;
            case 2:
               UndoManager .shared .beginUndo (_ ("Rotate Transform"));
               break;
            case 3:
               UndoManager .shared .beginUndo (_ ("Scale Transform"));
               break;
         }

         Editor .setFieldValue (this .getExecutionContext (), this .toolNode, this ._translation,      translation);
         Editor .setFieldValue (this .getExecutionContext (), this .toolNode, this ._rotation,         rotation);
         Editor .setFieldValue (this .getExecutionContext (), this .toolNode, this ._scale,            scale);
         Editor .setFieldValue (this .getExecutionContext (), this .toolNode, this ._scaleOrientation, scaleOrientation);
         Editor .setFieldValue (this .getExecutionContext (), this .toolNode, this ._center,           center);

         UndoManager .shared .endUndo ()
      }
   }

   static box = new X3D .Box3 ();

   reshape ()
   {
      const
         bbox       = this .toolNode .getBBox (X3DTransformNodeTool .box),
         bboxSize   = bbox .size,
         bboxCenter = bbox .center;

      if (!this .tool .bboxSize .getValue () .equals (bboxSize))
         this .tool .bboxSize = bboxSize;

      if (!this .tool .bboxCenter .getValue () .equals (bboxCenter))
         this .tool .bboxCenter = bboxCenter;
   }
}

module .exports = X3DTransformNodeTool
