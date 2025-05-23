"use strict";

const X3D = require ("../../X3D");

function StaticGroup (executionContext)
{
   X3D .X3DChildNode     .call (this, executionContext);
   X3D .X3DBoundedObject .call (this, executionContext);

   this .addType (X3D .X3DConstants .StaticGroup);

   // Private properties

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

      this .connectChildNode (this .groupNode, [X3D .TraverseType .CAMERA]);
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
      value: X3D .StaticGroup .typeName,
      enumerable: true,
   },
   componentInfo:
   {
      value: X3D .StaticGroup .componentInfo,
      enumerable: true,
   },
   containerField:
   {
      value: X3D .StaticGroup .containerField,
      enumerable: true,
   },
   specificationRange:
   {
      value: X3D .StaticGroup .specificationRange,
      enumerable: true,
   },
   fieldDefinitions:
   {
      value: X3D .StaticGroup .fieldDefinitions,
      enumerable: true,
   },
});

module .exports = StaticGroup;
