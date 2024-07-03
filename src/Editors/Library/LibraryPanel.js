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

   get input ()
   {
      return this .#library .input;
   }

   get output ()
   {
      return this .#library .output;
   }
};
