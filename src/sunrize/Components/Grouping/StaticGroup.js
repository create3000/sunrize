"use strict"

const
   X3D                  = require ("../../X3D"),
   Fields               = X3D .require ("x_ite/Fields"),
   X3DFieldDefinition   = X3D .require ("x_ite/Base/X3DFieldDefinition"),
   FieldDefinitionArray = X3D .require ("x_ite/Base/FieldDefinitionArray"),
   X3DConstants         = X3D .require ("x_ite/Base/X3DConstants"),
   X3DChildNode         = X3D .require ("x_ite/Components/Core/X3DChildNode"),
   X3DBoundedObject     = X3D .require ("x_ite/Components/Grouping/X3DBoundedObject"),
   Group                = X3D .require ("x_ite/Components/Grouping/Group");

function StaticGroup (executionContext)
{
   X3DChildNode     .call (this, executionContext);
   X3DBoundedObject .call (this, executionContext);

   this .addType (X3DConstants .StaticGroup);

   this .groupNode = new Group (this .getExecutionContext ());
}

StaticGroup .prototype = Object .assign (Object .create (X3DChildNode .prototype),
   X3DBoundedObject .prototype,
{
   constructor: StaticGroup,
   [Symbol .for ("X_ITE.X3DBaseNode.fieldDefinitions")]: new FieldDefinitionArray ([
      new X3DFieldDefinition (X3DConstants .inputOutput,    "metadata",    new Fields .SFNode ()),
      new X3DFieldDefinition (X3DConstants .inputOutput,    "visible",     new Fields .SFBool (true)),
      new X3DFieldDefinition (X3DConstants .inputOutput,    "bboxDisplay", new Fields .SFBool ()),
      new X3DFieldDefinition (X3DConstants .initializeOnly, "bboxSize",    new Fields .SFVec3f (-1, -1, -1)),
      new X3DFieldDefinition (X3DConstants .initializeOnly, "bboxCenter",  new Fields .SFVec3f ()),
      new X3DFieldDefinition (X3DConstants .initializeOnly, "children",    new Fields .MFNode ()),
   ]),
   getTypeName: function ()
   {
      return "StaticGroup";
   },
   getComponentName: function ()
   {
      return "Grouping";
   },
   getContainerField: function ()
   {
      return "children";
   },
   getSpecificationRange: function ()
   {
      return ["3.0", "Infinity"];
   },
   initialize: function ()
   {
      X3DChildNode     .prototype .initialize .call (this);
      X3DBoundedObject .prototype .initialize .call (this);

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
   getBBox: function (bbox, shadows)
   {
      return this .groupNode .getBBox (bbox, shadows);
   },
   traverse: function (type, renderObject)
   {
      this .groupNode .traverse (type, renderObject);
   },
   dispose: function ()
   {
      X3DBoundedObject .prototype .dispose .call (this);
      X3DChildNode     .prototype .dispose .call (this);
   },
});

module .exports = StaticGroup;
