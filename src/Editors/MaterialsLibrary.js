"use strict";

const
   $           = require ("jquery"),
   X3D         = require ("../X3D"),
   LibraryPane = require ("./LibraryPane");

const fs = require ("fs");

module .exports = class Materials extends LibraryPane
{
   id          = "MATERIALS";
   description = "Materials";

   #scene;

   async update ()
   {
      this .#scene ??= await this .browser .createX3DFromURL (new X3D .MFString (`file://${__dirname}/Materials.x3d`));

      // Clear output.

      this .output .empty ();

      const materials = this .#scene .getExportedNode ("Materials");

      for (const group of materials .children)
      {
         console .log (group .getNodeName ());
      }
   }
};
