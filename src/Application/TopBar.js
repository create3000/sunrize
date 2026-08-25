"use strict";

const
   $         = require ("jquery"),
   electron  = require ("electron"),
   Interface = require ("./Interface"),
   Editor    = require("../Undo/Editor"),
   _         = require ("./GetText");

module .exports = class TopBar extends Interface
{
   constructor (element, document)
   {
      super ("Sunrize.TopBar.");

      this .document = document;
      this .topBar   = element;

      this .setup ();
   }

   async initialize ()
   {
   }

   configure ()
   {
      this .config .file .setDefaultValues ({
      });
   }
};

