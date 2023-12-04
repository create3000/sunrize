"use strict";

const Document = require ("./Document");

module .exports = new class Window extends Document
{
   constructor ()
   {
      super ();

      // Setup

      this .setup ();
   }
};
