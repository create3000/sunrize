"use strict"

const
   $         = require ("jquery"),
   Interface = require ("../Application/Interface"),
   Algorithm = require ("../Bits/Algorithm")

module .exports = class Splitter extends Interface
{
   constructor (element, orientation)
   {
      super (`Sunrize.Splitter.${element .attr ("id")}.`)

      this .splitter    = element
      this .orientation = orientation

      switch (this .orientation)
      {
         case "horizontal":
         {
            const top = this .splitter .find ("> .horizontal-splitter-top")

            top .resizable ({
               minHeight: 0,
               handles: "s",
               resize: () => this .position = this .position,
            })

            top .find ("> .ui-resizable-s") .append ($("<div></div>"))
            break
         }
         case "vertical":
         {
            const left = this .splitter .find ("> .vertical-splitter-left")

            left .resizable ({
               minWidth: 0,
               handles: "e",
               resize: () => this .position = this .position,
            })

            left .find ("> .ui-resizable-e") .append ($("<div></div>"))
            break
         }
      }

      this .setup ()
   }

   configure ()
   {
      if (this .config .file .position !== undefined)
         this .position = this .config .file .position
      else
         this .splitter .trigger ("position")
   }

   get position ()
   {
      switch (this .orientation)
      {
         case "horizontal":
         {
            const top = this .splitter .find ("> .horizontal-splitter-top")

            return this .position = top .outerHeight () / this .splitter .innerHeight ()
         }
         case "vertical":
         {
            const left = this .splitter .find ("> .vertical-splitter-left")

            return left .outerWidth () / this .splitter .innerWidth ()
         }
      }
   }

   /**
    * @param {number} position
    */
   set position (position)
   {
      position = Algorithm .clamp (position, 0, 1)

      this .config .file .position = position

      switch (this .orientation)
      {
         case "horizontal":
         {
            const
               top    = this .splitter .find ("> .horizontal-splitter-top"),
               bottom = this .splitter .find ("> .horizontal-splitter-bottom")

            top    .css ("height", (100 * position) + "%")
            bottom .css ("height", (100 * (1 - position)) + "%")
            break
         }
         case "vertical":
         {
            const
               left  = this .splitter .find ("> .vertical-splitter-left"),
               right = this .splitter .find ("> .vertical-splitter-right")

            left  .css ("width", (100 * position) + "%")
            right .css ("width", (100 * (1 - position)) + "%")
            break
         }
      }

      this .splitter .trigger ("position")
   }
}
