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

      this .getBrowser () .addBrowserEvent ();
   },
   set_children__ ()
   {
      if (this .editChild)
         this .setChild (this .editChild .getTool () ?? this .editChild);
      else
         X3D .Switch .prototype .set_children__ .call (this);
   },
});

Object .assign (Switch, X3D .Switch);

module .exports = Switch;
