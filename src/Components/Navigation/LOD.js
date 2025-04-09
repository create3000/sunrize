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
   setEditChild (child)
   {
      this .editChild = child;

      this .set_children__ ();

      this .getBrowser () .addBrowserEvent ();
   },
   set_children__ ()
   {
      if (this .editChild)
         this .setChild (this .editChild .getTool () ?? this .editChild);
      else
         X3D .LOD .prototype .set_children__ .call (this);
   },
});

Object .assign (LOD, X3D .LOD);

module .exports = LOD;
