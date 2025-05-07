"use strict";

const X3D = require ("../../X3D");

function LOD (executionContext)
{
   X3D .LOD .call (this, executionContext);

   this .editChild = null;
}

Object .assign (Object .setPrototypeOf (LOD .prototype, X3D .LOD .prototype),
{
   getEditChild ()
   {
      return this .editChild;
   },
   setEditChild (childNode)
   {
      this .editChild = childNode;

      this .set_children__ ();

      this .getBrowser () .addBrowserEvent ();
   },
   addChild (childNode)
   {
      X3D .LOD .prototype .addChild .call (this, this .editChild ?.getTool () ?? this .editChild ?? childNode);
   },
});

Object .assign (LOD, X3D .LOD);

module .exports = LOD;
