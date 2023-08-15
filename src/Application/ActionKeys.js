"use strict"

const $ = require ("jquery")

module .exports = class ActionKeys
{
   static Shift    = 0b0001
   static Control  = 0b0010
   static Alt      = 0b0100
   static Option   = 0b0100
   static AltGraph = 0b1000
   static Command  = 0b1000

   constructor ()
   {
      this .value = 0

      $(window)
         .on ("keydown", this .onkeydown .bind (this))
         .on ("keyup",   this .onkeyup   .bind (this))
   }

   onkeydown (event)
   {
      //console .log (event .key)

      switch (event .key)
      {
         case "Shift":
         {
            this .value |= ActionKeys .Shift
            break
         }
         case "Control":
         {
            this .value |= ActionKeys .Control
            break
         }
         case "Alt": // Alt/Option
         {
            this .value |= ActionKeys .Alt
            break
         }
         case "Meta": // AltGr/Command
         {
            this .value |= ActionKeys .AltGraph
            break
         }
      }
   }

   onkeyup (event)
   {
      //console .log (event .key)

      switch (event .key)
      {
         case "Shift":
         {
            this .value &= ~ActionKeys .Shift
            break
         }
         case "Control":
         {
            this .value &= ~ActionKeys .Control
            break
         }
         case "Alt": // Alt/Option
         {
            this .value &= ~ActionKeys .Alt
            break
         }
         case "Meta": // AltGr/Command
         {
            this .value &= ~ActionKeys .AltGraph
            break
         }
      }
   }
}
