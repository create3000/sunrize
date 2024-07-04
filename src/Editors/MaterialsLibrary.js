"use strict";

const
   $           = require ("jquery"),
   X3D         = require ("../X3D"),
   LibraryPane = require ("./LibraryPane");

module .exports = class Materials extends LibraryPane
{
   id          = "MATERIALS";
   description = "Materials";

   update ()
   {
      // Clear output.

      this .output .empty ();
   }
};
