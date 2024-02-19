"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D"),
   Editor           = require ("../../Undo/Editor"),
   ActionKeys       = require ("../../Application/ActionKeys");

console .info ("Double-click on one of the axes handles to cycle through translation, rotation and scaling tools.");

class X3DTransformNodeTool extends X3DChildNodeTool
{
   static #transformTools = new Set ();

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DTransformNodeTool.x3d");

      X3DTransformNodeTool .#transformTools .add (this);

      this .getBrowser () .displayEvents () .addInterest ("reshapeTool", this);

      this .keys = new ActionKeys (`X3DTransformNodeTool${this .getId ()}`, this .set_keys .bind (this));

      this .node .addInterest ("transformGroups", this);

      this .tool .getField ("translation")      .addReference (this .node ._translation);
      this .tool .getField ("rotation")         .addReference (this .node ._rotation);
      this .tool .getField ("scale")            .addReference (this .node ._scale);
      this .tool .getField ("scaleOrientation") .addReference (this .node ._scaleOrientation);
      this .tool .getField ("center")           .addReference (this .node ._center);

      this .tool .getField ("isActive") .addInterest ("handleUndo", this);

      this .tool .bboxColor = this .toolBBoxColor;
   }

   disposeTool ()
   {
      X3DTransformNodeTool .#transformTools .delete (this);

      this .getBrowser () .displayEvents () .removeInterest ("reshapeTool", this);

      this .keys ?.dispose ();

      this .node .removeInterest ("transformGroups", this);

      super .disposeTool ();
   }

   set_keys (keys)
   {
      if ((keys & ActionKeys .Option) && !this .tool .keys .includes ("OPTION"))
         return;

      if ((keys & ActionKeys .Shift) && !this .tool .keys .includes ("SHIFT"))
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

   prepareUndo ()
   {
      super .prepareUndo ();
   }

   beginUndo ()
   {
      if (this .isHidden ())
         return false;

      if (!this ._visible .getValue ())
         return false;

      this .#initialMatrix .assign (this .getMatrixFromFields ());

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

      Editor .roundToIntegerIfAlmostEqual (translation);
      Editor .roundToIntegerIfAlmostEqual (rotation);
      Editor .roundToIntegerIfAlmostEqual (scale);
      Editor .roundToIntegerIfAlmostEqual (scaleOrientation);

      if (Editor .almostEqual (scale .x, scale .y) && Editor .almostEqual (scale .x, scale .z))
         scaleOrientation .assign (new X3D .SFRotation ());

      Editor .setFieldValue (this .getExecutionContext (), this .node, this ._translation,      translation);
      Editor .setFieldValue (this .getExecutionContext (), this .node, this ._rotation,         rotation);
      Editor .setFieldValue (this .getExecutionContext (), this .node, this ._scale,            scale);
      Editor .setFieldValue (this .getExecutionContext (), this .node, this ._scaleOrientation, scaleOrientation);
      Editor .setFieldValue (this .getExecutionContext (), this .node, this ._center,           center);
   }

   #modelMatrix   = new X3D .Matrix4 ();
   #initialMatrix = new X3D .Matrix4 ();

   transformGroups ()
   {
      if (!this .tool .isActive)
         return;

      if (!this .tool .activeTool .match (/^(?:TRANSLATE|ROTATE|SCALE)$/))
         return;

      if (this .isHidden ())
         return;

      if (!this ._visible .getValue ())
         return;

      if (this .tool .group === "NONE")
         return;

      const differenceMatrix = this .#initialMatrix .copy ()
         .multRight (this .#modelMatrix)
         .inverse ()
         .multRight (this .getMatrixFromFields ())
         .multRight (this .#modelMatrix);

      for (const other of X3DTransformNodeTool .#transformTools)
      {
         if (other === this)
            continue;

         if (other .isHidden ())
            continue;

         if (!other ._visible .getValue ())
            continue;

         if (other .tool .group !== this .tool .group)
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

      const
         matrix           = this .#initialMatrix .copy () .multRight (relativeMatrix),
         translation      = new X3D .Vector3 (0, 0 ,0),
         rotation         = new X3D .Rotation4 (),
         scale            = new X3D .Vector3 (1, 1, 1),
         scaleOrientation = new X3D .Rotation4 ();

		matrix .get (translation, rotation, scale, scaleOrientation);

		if (!this .tool .tools .includes ("TRANSLATE"))
			translation .set (0, 0, 0);

		if (!this .tool .tools .includes ("ROTATE"))
			rotation .set (0, 0, 1, 0);

		if (!this .tool .tools .includes ("SCALE"))
      {
			scale .set (1, 1, 1);
			scaleOrientation .set (0, 0, 1, 0);
      }

		matrix .set (translation, rotation, scale, scaleOrientation);

      if (keepCenter)
         this .setMatrixKeepCenter (matrix);
      else
         this .setMatrixWithCenter (matrix);
   }

   setMatrixKeepCenter (matrix)
   {
      const center = this ._center .getValue () .copy ()
         .add (this ._translation .getValue ())
         .subtract (matrix .origin);

		matrix .copy () .inverse () .multDirMatrix (center);

		this .setMatrixWithCenter (matrix, center);
   }

   setMatrixWithCenter (matrix, center = this ._center .getValue ())
   {
      const
         translation      = new X3D .Vector3 (0, 0, 0),
         rotation         = new X3D .Rotation4 (),
         scale            = new X3D .Vector3 (1, 1, 1),
         scaleOrientation = new X3D .Rotation4 ();

      matrix .get (translation, rotation, scale, scaleOrientation, center);

      this ._translation      = translation;
      this ._rotation         = rotation;
      this ._scale            = scale;
      this ._scaleOrientation = scaleOrientation;
      this ._center           = center;
   }

   getMatrixFromFields ()
   {
      const matrix = new X3D .Matrix4 ();

      matrix .set (this ._translation .getValue (),
                   this ._rotation .getValue (),
                   this ._scale .getValue (),
                   this ._scaleOrientation .getValue (),
                   this ._center .getValue ());

      return matrix;
   }

   getModelMatrix ()
   {
      return this .#modelMatrix;
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
