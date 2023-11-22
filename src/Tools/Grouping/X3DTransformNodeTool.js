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
   static #transformTools = new Set ();

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DTransformNodeTool.x3d");

      X3DTransformNodeTool .#transformTools .add (this);

      this .getBrowser () .displayEvents () .addInterest ("reshapeTool", this);

      this .keys = new ActionKeys (`X3DTransformNodeTool${this .getId ()}`, this .set_keys__ .bind (this));

      this .node .addInterest ("transformGroups", this);

      this .tool .getField ("translation")      .addReference (this .node ._translation);
      this .tool .getField ("rotation")         .addReference (this .node ._rotation);
      this .tool .getField ("scale")            .addReference (this .node ._scale);
      this .tool .getField ("scaleOrientation") .addReference (this .node ._scaleOrientation);
      this .tool .getField ("center")           .addReference (this .node ._center);

      this .tool .getField ("isCenterActive") .addInterest ("set_active__",  this);
      this .tool .getField ("isActive")       .addInterest ("set_active__",  this);

      this .tool .bboxColor = this .toolBBoxColor;
   }

   disposeTool ()
   {
      X3DTransformNodeTool .#transformTools .delete (this);

      this .getBrowser () .displayEvents () .removeInterest ("reshapeTool", this);

      this .keys .dispose ();

      this .node .removeInterest ("transformGroups", this);

      super .disposeTool ();
   }

   set_keys__ (keys)
   {
      if (!this .tool .keys)
         return;

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
      this .tool .snapRotation  = keys === ActionKeys .Shift;
      this .tool .scaleMode     = scaleMode;
      this .tool .scaleUniform  = keys === ActionKeys .Shift || keys === (ActionKeys .Shift | ActionKeys .Option);
   }

   #initialTranslation;
   #initialRotation;
   #initialScale;
   #initialScaleOrientation;
   #initialCenter;

   set_active__ (active)
   {
      if (!this .tool .undo)
         return;

      if (active .getValue ())
      {
         X3DTransformNodeTool .beginUndo (this .tool .isCenterActive ? 3 : this .tool .activeTool,
            this .getTypeName (),
            this .getDisplayName ());

         // Prepare grouping.

         for (const other of X3DTransformNodeTool .#transformTools)
         {
            other .#initialMatrix .assign (other .getMatrix ());

            if (other .isHidden ())
               continue;

            if (!other ._visible .getValue ())
               continue;

            if (!this .tool .isCenterActive)
            {
               if (other .tool .name !== this .tool .name)
                  continue;
            }

            other .tool .grouped = true;
         }

         // Begin undo.

         for (const other of X3DTransformNodeTool .#transformTools)
         {
            if (!other .tool .grouped)
               continue;

            other .beginUndo ();
         }
      }
      else
      {
         // End undo.

         for (const other of X3DTransformNodeTool .#transformTools)
         {
            if (!other .tool .grouped)
               continue;

            other .endUndo ();
         }

         // Finish grouping.

         for (const other of X3DTransformNodeTool .#transformTools)
            other .tool .grouped = false;

         UndoManager .shared .endUndo ();
      }
   }

   beginUndo ()
   {
      this .#initialTranslation      = this ._translation      .copy ();
      this .#initialRotation         = this ._rotation         .copy ();
      this .#initialScale            = this ._scale            .copy ();
      this .#initialScaleOrientation = this ._scaleOrientation .copy ();
      this .#initialCenter           = this ._center           .copy ();
   }

   endUndo ()
   {
      const
         translation      = this ._translation      .copy (),
         rotation         = this ._rotation         .copy (),
         scale            = this ._scale            .copy (),
         scaleOrientation = this ._scaleOrientation .copy (),
         center           = this ._center           .copy ();

      this ._translation      = this .#initialTranslation;
      this ._rotation         = this .#initialRotation;
      this ._scale            = this .#initialScale;
      this ._scaleOrientation = this .#initialScaleOrientation;
      this ._center           = this .#initialCenter;

      Editor .setFieldValue (this .getExecutionContext (), this .node, this ._translation,      translation);
      Editor .setFieldValue (this .getExecutionContext (), this .node, this ._rotation,         rotation);
      Editor .setFieldValue (this .getExecutionContext (), this .node, this ._scale,            scale);
      Editor .setFieldValue (this .getExecutionContext (), this .node, this ._scaleOrientation, scaleOrientation);
      Editor .setFieldValue (this .getExecutionContext (), this .node, this ._center,           center);
   }

   static #tools = [
      "TRANSLATE",
      "ROTATE",
      "SCALE",
      "CENTER",
   ];

   static beginUndo (tool, typeName, name)
   {
      switch (this .#tools [tool])
      {
         case "TRANSLATE":
         {
            if (name)
               UndoManager .shared .beginUndo (_ ("Translate %s »%s«"), typeName, name);
            else
               UndoManager .shared .beginUndo (_ ("Translate %s"), typeName);
            break;
         }
         case "ROTATE":
         {
            if (name)
               UndoManager .shared .beginUndo (_ ("Rotate %s »%s«"), typeName, name);
            else
               UndoManager .shared .beginUndo (_ ("Rotate %s"), typeName);
            break;
         }
         case "SCALE":
         {
            if (name)
               UndoManager .shared .beginUndo (_ ("Scale %s »%s«"), typeName, name);
            else
               UndoManager .shared .beginUndo (_ ("Scale %s"), typeName);
            break;
         }
         case "CENTER":
         {
            if (name)
               UndoManager .shared .beginUndo (_ ("Translate Center Of %s »%s«"), typeName, name);
            else
               UndoManager .shared .beginUndo (_ ("Translate Center Of %s"), typeName);
            break;
         }
      }
   }

   #modelMatrix   = new X3D .Matrix4 ();
   #initialMatrix = new X3D .Matrix4 ();

   transformGroups ()
   {
      if (!this .tool .isActive)
         return;

      const differenceMatrix = this .#initialMatrix .copy ()
         .multRight (this .#modelMatrix)
         .inverse ()
         .multRight (this .node .getMatrix ())
         .multRight (this .#modelMatrix);

      for (const other of X3DTransformNodeTool .#transformTools)
      {
         if (other === this)
            continue;

         if (other .isHidden ())
            continue;

         if (!other ._visible .getValue ())
            continue;

         if (other .tool .name !== this .tool .name)
            continue;

         other .addAbsoluteMatrix (differenceMatrix, other .tool .keepCenter);
      }
   }

   addAbsoluteMatrix (absoluteMatrix, keepCenter)
   {
      const relativeMatrix = this .#modelMatrix .copy ()
         .multRight (absoluteMatrix)
         .multRight (this .#modelMatrix .copy () .inverse ());

      // Set matrix.

      const matrix = this .#initialMatrix .copy () .multRight (relativeMatrix);

      if (keepCenter)
         this .setMatrixKeepCenter (matrix);
      else
         this .setMatrixWithCenter (matrix, this ._center .getValue ());
   }

   setMatrixWithCenter (matrix, center)
   {
      const
         translation      = new X3D .Vector3 (0, 0, 0),
         rotation         = new X3D .Rotation4 (),
         scale            = new X3D .Vector3 (0, 0, 0),
         scaleOrientation = new X3D .Rotation4 ();

      matrix .get (translation, rotation, scale, scaleOrientation, center);

      this ._translation      = translation;
      this ._rotation         = rotation;
      this ._scale            = scale;
      this ._scaleOrientation = scaleOrientation;
      this ._center           = center;
   }

   setMatrixKeepCenter (matrix)
   {
      const center = this ._center .getValue () .copy ()
         .add (this ._translation .getValue ())
         .subtract (matrix .origin);

		matrix .copy () .inverse () .multDirMatrix (center);

		this .setMatrixWithCenter (matrix, center);
   }

   static #box = new X3D .Box3 ();

   reshapeTool ()
   {
      if (!this .tool)
         return console .warn ("reshapeTool called, although already disposed.", this .getBrowser () .displayEvents () .hasInterest ("reshapeTool", this));

      const
         bbox       = this .node .getSubBBox (X3DTransformNodeTool .#box),
         bboxSize   = bbox .size,
         bboxCenter = bbox .center;

      if (!this .tool .bboxSize .getValue () .equals (bboxSize))
         this .tool .bboxSize = bboxSize;

      if (!this .tool .bboxCenter .getValue () .equals (bboxCenter))
         this .tool .bboxCenter = bboxCenter;
   }

   traverse (type, renderObject)
   {
      switch (type)
      {
         case X3D .TraverseType .DISPLAY:
         {
            this .#modelMatrix .assign (renderObject .getModelViewMatrix () .get ())
               .multRight (renderObject .getCameraSpaceMatrix () .get ());

            break;
         }
      }

      super .traverse (type, renderObject);
   }
}

module .exports = X3DTransformNodeTool;
