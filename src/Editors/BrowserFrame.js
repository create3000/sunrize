"use strict";

const
   $      = require ("jquery"),
   Dialog = require ("../Controls/Dialog"),
   _      = require ("../Application/GetText");

module .exports = new class BrowserFrame extends Dialog
{
   constructor ()
   {
      super ("Sunrize.BrowserFrame.");

      this .setup ();
   }

   initialize ()
   {
      super .initialize ();

      // Add class.

      this .element .addClass ("browser-frame");

      this .table         = $("<table></table>") .appendTo (this .element);
      this .table .header = $("<thead></thead>") .appendTo (this .table);
      this .table .body   = $("<tbody></tbody>") .appendTo (this .table);

      $("<tr></tr>")
         .append ($("<th></th>")
            .attr ("colspan", "2")
            .text (_("Browser Frame")))
         .appendTo (this .table .header);

      this .width = $("<input></input>")
         .attr ("type", "number")
         .attr ("min", 1)
         .attr ("step", "1")
         .css ("width", "calc((100% - 20px) / 2)")
         .on ("change", () => this .onsize ());

      const x = $("<span></span>")
         .css ({ "display": "inline-block", "width": "20px", "text-align": "center" })
         .text ("✕");

      this .height = $("<input></input>")
          .attr ("type", "number")
         .attr ("min", 1)
          .attr ("step", "1")
          .css ("width", "calc((100% - 20px) / 2)")
          .on ("change", () => this .onsize ());

      $("<tr></tr>")
         .append ($("<th></th>")
            .text (_("Size")))
         .append ($("<td></td>")
            .append (this .width)
            .append (x)
            .append (this .height))
         .appendTo (this .table .body);

      this .fixedSize = $("<input></input>")
         .attr ("id", "browser-frame-fixed-size")
         .attr ("type", "checkbox")
         .on ("change", () => this .onchange ());

      $("<tr></tr>")
         .append ($("<th></th>"))
         .append ($("<td></td>")
            .append (this .fixedSize)
            .append ($("<label></label>")
               .attr ("for", "browser-frame-fixed-size")
               .text (_("Fixed Size"))))
         .appendTo (this .table .body);

      this .numerator = $("<input></input>")
         .attr ("type", "number")
         .attr ("min", 1)
         .attr ("step", "1")
         .css ("width", "calc((100% - 20px) / 2)")
         .on ("change", () => this .onchange ());

      const slash = $("<span></span>")
         .css ({ "display": "inline-block", "width": "20px", "text-align": "center" })
         .text ("/");

      this .denominator = $("<input></input>")
          .attr ("type", "number")
         .attr ("min", 1)
          .attr ("step", "1")
          .css ("width", "calc((100% - 20px) / 2)")
          .on ("change", () => this .onchange ());

      $("<tr></tr>")
         .append ($("<th></th>")
            .text (_("Aspect Ratio")))
         .append ($("<td></td>")
            .append (this .numerator)
            .append (slash)
            .append (this .denominator))
         .appendTo (this .table .body);

      this .backgroundColor = $("<input></input>")
         .attr ("title", _("A background color which is applied to the <x3d-canvas> element."))
         .attr ("placeholder", "Enter any CSS color here.")
         .on ("change", () => this .onchange ());

      $("<tr></tr>")
         .append ($("<th></th>") .text (_("Background Color")))
         .append ($("<td></td>") .append (this .backgroundColor))
         .appendTo (this .table .body);

      this .paneObserver = new ResizeObserver (() => this .updateSize ());
      this .paneObserver .observe ($("#browser-pane") [0]);

      this .frameObserver = new ResizeObserver (() => this .onresize ());
      this .frameObserver .observe ($("#browser-frame") [0]);
   }

   configure ()
   {
      super .configure ({ size: [388, 175] });

      this .config .file .setDefaultValues ({
         fixedSize: false,
         numerator: 1,
         denominator: 1,
         backgroundColor: "",
      });

      this .updateInputs ();
      this .onresize ();
   }

   updateInputs ()
   {
      const
         fixedSize       = this .config .file .fixedSize,
         numerator       = this .config .file .numerator,
         denominator     = this .config .file .denominator,
         backgroundColor = this .config .file .backgroundColor;

      this .updateSize ();

      this .fixedSize .prop ("checked", fixedSize);
      this .numerator .val (numerator);
      this .denominator .val (denominator);
      this .backgroundColor .val (backgroundColor);
   }

   updateSize ()
   {
      this .width .val ($("#browser-pane") .width ());
      this .height .val ($("#browser-pane") .height ());
   }

   onchange ()
   {
      this .config .file .fixedSize       = this .fixedSize .prop ("checked");
      this .config .file .numerator       = this .numerator .val ();
      this .config .file .denominator     = this .denominator .val ();
      this .config .file .backgroundColor = this .backgroundColor .val ();

      this .onresize ();
   }

   /**
    * Change browser size according to aspect-ratio.
    */
   onresize ()
   {
      const
         fixedSize        = this .config .file .fixedSize,
         numerator        = this .config .file .numerator,
         denominator      = this .config .file .denominator,
         backgroundColor  = this .config .file .backgroundColor,
         aspectRatio      = numerator / denominator,
         frameAspectRatio = $("#browser-frame") .width () / $("#browser-frame") .height (),
         element          = $(this .browser .element);

      if (fixedSize && aspectRatio)
      {
         element .css ({ "aspect-ratio": `${numerator} / ${denominator}` });

         if (aspectRatio > frameAspectRatio)
            element .css ({ "width": "100%", "height": "auto" });
         else
            element .css ({ "width": "auto", "height": "100%" });
      }
      else
      {
         element .css ({ "aspect-ratio": "unset", "width": "100%", "height": "100%" });
      }

      element .css ("background-color", `${backgroundColor}` .replace (/\b(?:transparent|unset|initial)\b/g, ""));
   }

   onsize ()
   {
      const document = require ("../Application/Window");

      document .verticalSplitter   .position = this .width  .val () / $("body") .width ();
      document .horizontalSplitter .position = this .height .val () / $("body") .height ();
   }
};
