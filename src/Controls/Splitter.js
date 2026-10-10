"use strict";

const
   $         = require ("jquery"),
   Interface = require ("../Application/Interface"),
   Algorithm = require ("../Bits/Algorithm");

module .exports = class Splitter extends Interface
{
   constructor (element, orientation)
   {
      super (`Sunrize.Splitter.${element .attr ("id")}.`);

      this .splitter    = element;
      this .orientation = orientation;

      switch (this .orientation)
      {
         case "horizontal":
         {
            this .handle = this .splitter .find ("> .horizontal-splitter-top");

            this .handle .resizable ({
               minHeight: 0,
               handles: "s",
            })
            .on ("resizestart", () => this .start ())
            .on ("resize", () => this .position = this .position);

            this .handle .find ("> .ui-resizable-s") .append ($("<div></div>"));
            break;
         }
         case "vertical":
         {
            this .handle = this .splitter .find ("> .vertical-splitter-left");

            this .handle .resizable ({
               minWidth: 0,
               handles: "e",
            })
            .on ("resizestart", () => this .start ())
            .on ("resize", () => this .position = this .position);

            this .handle .find ("> .ui-resizable-e") .append ($("<div></div>"));
            break;
         }
      }

      this .setup ();
   }

   configure ()
   {
      this .config .file .setDefaultValues ({
         startPosition: 0,
      });

      if (!this .isInitialScene && this .config .file .position !== undefined)
         this .position = this .config .file .position;
      else
         this .handle .trigger ("position");
   }

   get position ()
   {
      switch (this .orientation)
      {
         case "horizontal":
         {
            const top = this .splitter .find ("> .horizontal-splitter-top");

            return Algorithm .clamp ((top .outerHeight () / this .splitter .innerHeight ()) || 0, 0, 1);
         }
         case "vertical":
         {
            const left = this .splitter .find ("> .vertical-splitter-left");

            return Algorithm .clamp ((left .outerWidth () / this .splitter .innerWidth ()) || 0, 0, 1);
         }
      }

      return 0.5;
   }

   snapToBorder = false;
   snapDistance = 30;

   /**
    * @param {number} position
    */
   set position (position)
   {
      position = Algorithm .clamp (position, 0, 1);

      if (this .snapToBorder)
         position = this .snap (position);

      this .config .file .position = position;

      switch (this .orientation)
      {
         case "horizontal":
         {
            const
               top    = this .splitter .find ("> .horizontal-splitter-top"),
               bottom = this .splitter .find ("> .horizontal-splitter-bottom");

            top    .css ("height", `${100 * position}%`);
            bottom .css ("height", `${100 * (1 - position)}%`);
            break;
         }
         case "vertical":
         {
            const
               left  = this .splitter .find ("> .vertical-splitter-left"),
               right = this .splitter .find ("> .vertical-splitter-right");

            left  .css ("width", `${100 * position}%`);
            right .css ("width", `${100 * (1 - position)}%`);
            break;
         }
      }

      this .handle .trigger ("position");
   }

   start ()
   {
      const position = this .position;

      if (position > 0 && position < 1)
         this .config .file .startPosition = this .position;
   }

   toggle (action)
   {
      switch (action)
      {
         case "minimize":
         {
            const position = this .position;

            if (position > 0 && position < 1)
               this .config .file .startPosition = position;

            this .position = 0;
            break;
         }
         case "maximize":
         {
            const position = this .position;

            if (position > 0 && position < 1)
               this .config .file .startPosition = position;
            
            this .position = 1;
            break;
         }
         case "restore":
         {
            const snapStartPosition = this .snap (this .config .file .startPosition);

            if (snapStartPosition === 0 || snapStartPosition === 1)
            {
               this .config .file .position = undefined;

               switch (this .orientation)
               {
                  case "horizontal":
                     this .splitter .find ("> *") .css ("height", "");
                     break;
                  case "vertical":
                     this .splitter .find ("> *") .css ("width", "");
                     break;
               }

               this .handle .trigger ("position");
            }
            else
            {
               this .position = this .config .file .startPosition;
            }

            break;
         }
      }
   }

   snap (position)
   {
      let size = 0;

      switch (this .orientation)
      {
         case "horizontal":
         {
            size = this .splitter .innerHeight ();
            break;
         }
         case "vertical":
         {
            size = this .splitter .innerWidth ();
            break;
         }
      }

      if (!size)
         return position;

      if (position < this .snapDistance / size)
         return 0;

      if (position > 1 - this .snapDistance / size)
         return 1;

      return position;
   }
};
