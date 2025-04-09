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
   },
});

Object .assign (Switch, X3D .Switch);

module .exports = Switch;
