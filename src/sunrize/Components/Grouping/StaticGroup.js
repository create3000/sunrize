"use strict"

const X3D = require ("../../X3D");

function StaticGroup (executionContext)
{
   X3D .X3DChildNode     .call (this, executionContext);
   X3D .X3DBoundedObject .call (this, executionContext);

   this .addType (X3D .X3DConstants .StaticGroup);

   this .groupNode = new X3D .Group (this .getExecutionContext ());
}

Object .assign (Object .setPrototypeOf (StaticGroup .prototype, X3D .X3DChildNode .prototype),
   X3D .X3DBoundedObject .prototype,
{
   initialize ()
   {
      X3D .X3DChildNode     .prototype .initialize .call (this);
      X3D .X3DBoundedObject .prototype .initialize .call (this);

      this ._bboxSize   .addFieldInterest (this .groupNode ._bboxSize);
      this ._bboxCenter .addFieldInterest (this .groupNode ._bboxCenter);
      this ._children   .addFieldInterest (this .groupNode ._children);

      this .groupNode ._bboxSize   = this ._bboxSize;
      this .groupNode ._bboxCenter = this ._bboxCenter;
      this .groupNode ._children   = this ._children;
      this .groupNode .setPrivate (true);
      this .groupNode .setup ();

      // Connect after Group setup.
      this .groupNode ._isCameraObject   .addFieldInterest (this ._isCameraObject);
      this .groupNode ._isPickableObject .addFieldInterest (this ._isPickableObject);

      this .setCameraObject   (this .groupNode .isCameraObject ());
      this .setPickableObject (this .groupNode .isPickableObject ());
   },
   getBBox (bbox, shadows)
   {
      return this .groupNode .getBBox (bbox, shadows);
   },
   traverse (type, renderObject)
   {
      this .groupNode .traverse (type, renderObject);
   },
   dispose ()
   {
      X3D .X3DBoundedObject .prototype .dispose .call (this);
      X3D .X3DChildNode     .prototype .dispose .call (this);
   },
});

Object .defineProperties (StaticGroup,
{
   typeName:
   {
      value: "StaticGroup",
   },
   componentName:
   {
      value: "Grouping",
   },
   containerField:
   {
      value: "children",
   },
   specificationRange:
   {
      value: Object .freeze (["3.0", "Infinity"]),
   },
   fieldDefinitions:
   {
      value: new X3D .FieldDefinitionArray ([
         new X3D .X3DFieldDefinition (X3D .X3DConstants .inputOutput,    "metadata",    new X3D .SFNode ()),
         new X3D .X3DFieldDefinition (X3D .X3DConstants .inputOutput,    "visible",     new X3D .SFBool (true)),
         new X3D .X3DFieldDefinition (X3D .X3DConstants .inputOutput,    "bboxDisplay", new X3D .SFBool ()),
         new X3D .X3DFieldDefinition (X3D .X3DConstants .initializeOnly, "bboxSize",    new X3D .SFVec3f (-1, -1, -1)),
         new X3D .X3DFieldDefinition (X3D .X3DConstants .initializeOnly, "bboxCenter",  new X3D .SFVec3f ()),
         new X3D .X3DFieldDefinition (X3D .X3DConstants .initializeOnly, "children",    new X3D .MFNode ()),
      ]),
   },
});

module .exports = StaticGroup;
