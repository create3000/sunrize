"use strict";

const
   $           = require ("jquery"),
   X3D         = require ("../X3D"),
   Dialog      = require ("../Controls/Dialog"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require ("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

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
         .attr ("step", "1")
         .css ("width", "calc((100% - 20px) / 2)")
         .on ("change", () => this .onchange ());

      const slash = $("<span></span>")
         .css ({ "display": "inline-block", "width": "20px", "text-align": "center" })
         .text ("/");

      this .denominator = $("<input></input>")
          .attr ("type", "number")
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

      this .resizeObserver = new ResizeObserver (() => this .onresize ());

      this .resizeObserver .observe ($("#browser-frame") [0]);
   }

   configure ()
   {
      super .configure ({ size: [400, 127] });

      this .connect (Editor .getWorldInfo (this .browser .currentScene));
      this .updateInputs ();
   }

   connect (worldInfoNode)
   {
      worldInfoNode ?.addMetaDataCallback (this, "Sunrize/BrowserFrame/fixedSize",       () => this .updateInputs ());
      worldInfoNode ?.addMetaDataCallback (this, "Sunrize/BrowserFrame/aspectRatio",     () => this .updateInputs ());
      worldInfoNode ?.addMetaDataCallback (this, "Sunrize/BrowserFrame/backgroundColor", () => this .updateInputs ());
   }

   updateInputs ()
   {
      const
         worldInfoNode                    = Editor .getWorldInfo (this .browser .currentScene),
         [fixedSize = false]              = worldInfoNode ?.getMetaData ("Sunrize/BrowserFrame/fixedSize") ?? [ ],
         [numerator = 1, denominator = 1] = worldInfoNode ?.getMetaData ("Sunrize/BrowserFrame/aspectRatio") ?? [ ],
         [backgroundColor = ""]           = worldInfoNode ?.getMetaData ("Sunrize/BrowserFrame/backgroundColor") ?? [ ];

      this .fixedSize .prop ("checked", fixedSize);
      this .numerator .val (numerator);
      this .denominator .val (denominator);
      this .backgroundColor .val (backgroundColor);
   }

   onchange ()
   {
      const
         worldInfoNode   = Editor .getWorldInfo (this .browser .currentScene, true),
         fixedSize       = new X3D .SFBool (this .fixedSize .prop ("checked")),
         aspectRatio     = new X3D .MFDouble (this .numerator .val (), this .denominator .val ()),
         backgroundColor = new X3D .SFString (this .backgroundColor .val ());

      this .connect (worldInfoNode);

      UndoManager .shared .beginUndo (_("Change Browser Frame"));

      Editor .setNodeMetaData (worldInfoNode, "Sunrize/BrowserFrame/fixedSize",       fixedSize);
      Editor .setNodeMetaData (worldInfoNode, "Sunrize/BrowserFrame/aspectRatio",     aspectRatio);
      Editor .setNodeMetaData (worldInfoNode, "Sunrize/BrowserFrame/backgroundColor", backgroundColor);
      Editor .deferFunction (() => this .onresize ());

      UndoManager .shared .endUndo ();
   }

   /**
    * Change browser size according to aspect-ratio.
    */
   onresize ()
   {
      const
         worldInfoNode                    = Editor .getWorldInfo (this .browser .currentScene),
         [fixedSize = false]              = worldInfoNode ?.getMetaData ("Sunrize/BrowserFrame/fixedSize") ?? [ ],
         [numerator = 1, denominator = 1] = worldInfoNode ?.getMetaData ("Sunrize/BrowserFrame/aspectRatio") ?? [ ],
         [backgroundColor = ""]           = worldInfoNode ?.getMetaData ("Sunrize/BrowserFrame/backgroundColor") ?? [ ],
         aspectRatio                      = numerator / denominator,
         frameAspectRatio                 = $("#browser-frame") .width () / $("#browser-frame") .height (),
         element                          = $(this .browser .element);

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
};
