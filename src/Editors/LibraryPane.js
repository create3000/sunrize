"use strict";

module .exports = class LibraryPanel
{
   #library;

   constructor (library)
   {
      this .#library = library;
   }

   get browser ()
   {
      return this .#library .browser;
   }

   get executionContext ()
   {
      return this .#library .executionContext;
   }

   get node ()
   {
      return this .#library .node;
   }

   get field ()
   {
      return this .#library .field;
   }

   get output ()
   {
      return this .#library .output;
   }

   get importX3D ()
   {
      return this .#library .importX3D;
   }
};
