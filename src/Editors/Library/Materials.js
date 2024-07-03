"use strict";

const
   $            = require ("jquery"),
   X3D          = require ("../../X3D"),
   LibraryPanel = require ("./LibraryPanel");

module .exports = class Materials extends LibraryPanel
{
   id          = "MATERIALS";
   description = "Materials";

   update ()
   {
      this .list .empty ();
   }
};
