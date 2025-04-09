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
   setEditChild (childNode)
   {
      this .editChild = childNode;

      this .set_children__ ();

      this .getBrowser () .addBrowserEvent ();
   },
   setChild (childNode)
   {
      X3D .Switch .prototype .setChild .call (this, this .editChild ?.getTool () ?? this .editChild ?? childNode);
   },
});

Object .assign (Switch, X3D .Switch);

module .exports = Switch;
