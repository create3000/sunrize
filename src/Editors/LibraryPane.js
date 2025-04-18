"use strict";

module .exports = class LibraryPane
{
   #library;

   constructor (library)
   {
      this .#library = library;
   }

   get config ()
   {
      return this .#library .config;
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

   get element ()
   {
      return this .#library .element;
   }

   get output ()
   {
      return this .#library .output;
   }

   get importX3D ()
   {
      return this .#library .importX3D;
   }

   get expandToAndSelectNode ()
   {
      return this .#library .expandToAndSelectNode;
   }

   open () { }
};
