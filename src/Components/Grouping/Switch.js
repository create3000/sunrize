"use strict";

const X3D = require ("../../X3D");

function Switch (executionContext)
{
   X3D .Switch .call (this, executionContext);

   this .editChild = null;
}

Object .assign (Object .setPrototypeOf (Switch .prototype, X3D .Switch .prototype),
{
   getEditChild ()
   {
      return this .editChild;
   },
   setEditChild (child)
   {
      this .editChild = child;

      this .set_children__ ();
   },
   ... [
      "boundedObject",
      "pointingObject",
      "cameraObject",
      "pickableObject",
      "collisionObject",
      "shadowObject",
      "visibleObject",
   ]
   .reduce ((object, property) =>
   {
      object [`set_${property}s__`] = function ()
      {
         this [property] = this .editChild ?.getTool () ?? this .editChild ?? this [property];

         this .boundedObject = X3D .X3DCast (X3D .X3DConstants .X3DBoundedObject, this .editChild ?.getTool () ?? this .editChild) ?? this .boundedObject;

         X3D .Switch .prototype [`set_${property}s__`] .call (this);

         this .getBrowser () .addBrowserEvent ();
      };

      return object;
   },
   { }),
});

Object .assign (Switch, X3D .Switch);

module .exports = Switch;
