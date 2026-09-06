"use strict";

const Document = require ("./Document");

class Window extends Document
{
   constructor ()
   {
      super ();

      // Setup

      this .setup ();
   }
};

module .exports = new Window ();
