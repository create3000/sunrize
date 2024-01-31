const
   $         = require ("jquery"),
   TweakPane = require ("tweakpane"),
   Interface = require ("../Application/Interface"),
   X3D       = require ("../X3D");

module .exports = new class Panel extends Interface
{
   constructor ()
   {
      super ("Sunrize.Panel.");

      this .pane      = new TweakPane .Pane ();
      this .container = $(this .pane .element) .parent ();
      this .selection = require ("../Application/Selection");

      this .container .hide () .appendTo ($("#browser-frame"));

      this .container .css ({
         "bottom": this .container .css ("top"),
         "top": "unset",
         "z-index": "1000",
      });

      this .container .on ("mousedown", () => this .onmousedown ())

      this .setup ();
   }

   configure () { }

   get visible ()
   {
      return this .container .is (":visible");
   }

   show ()
   {
      this .selection .addInterest (this, () => this .onselection ());

      this .onselection ();

      this .container .show (300);
   }

   hide ()
   {
      this .selection .removeInterest (this);

      this .container .hide (300);
   }

   onmousedown ()
   {
      $(document) .on ("mouseup.Panel", () => this .onmouseup ());

      this .mousedown = true;
   }

   onmouseup ()
   {
      $(document) .off ("mouseup.Panel");

      this .mousedown = false;
   }

   onselection ()
   {
      const node = this .selection .nodes .at (-1);


      // Remove all blades.

      for (const folder of [... this .pane .children])
         folder .dispose ();

      if (!node)
      {
         this .pane .hidden = true;
         return;
      }

      // Add new blades.

      for (const type of node .getType () .toReversed ())
      {
         switch (type)
         {
            case X3D .X3DConstants .Shape:
            {
               const folder = this .pane .addFolder ({
                  title: "Shape",
                  expanded: this .fileConfig [`Shape.expanded`] ?? true,
               });

               const parameter = {
                  castShadow: node ._castShadow .getValue (),
               };

               folder .addInput (parameter, "castShadow");

               break;
            }
            case X3D .X3DConstants .Transform:
            {
               const folder = this .pane .addFolder ({
                  title: node .getTypeName (),
                  expanded: this .fileConfig [`${node .getTypeName ()}.expanded`] ?? true,
               });

               const parameter = {
                  translation: { x: node ._translation .x, y: node ._translation .y, z: node ._translation .z },
                  rotation: { x: node ._rotation .x, y: node ._rotation .y, z: node ._rotation .z, w: node ._rotation .angle },
                  scale: { x: node ._scale .x, y: node ._scale .y, z: node ._scale .z },
               };

               folder .addInput (parameter, "translation")
                  .on ("change", ({ value }) => console .log (value .x, value .y, value .z));
               folder .addInput (parameter, "rotation");
               folder .addInput (parameter, "scale");

               break;
            }
            case X3D .X3DConstants .X3DBoundedObject:
            {
               const folder = this .pane .addFolder ({
                  title: "X3DBoundedObject",
                  expanded: this .fileConfig [`X3DBoundedObject.expanded`] ?? false,
               });

               const parameter = {
                  visible: node ._visible .getValue (),
                  bboxDisplay: node ._bboxDisplay .getValue (),
                  bboxSize: { x: node ._bboxSize .x, y: node ._bboxSize .y, z: node ._bboxSize .z },
                  bboxCenter: { x: node ._bboxCenter .x, y: node ._bboxCenter .y, z: node ._bboxCenter .z },
               };

               folder .addInput (parameter, "visible");
               folder .addInput (parameter, "bboxDisplay");
               folder .addInput (parameter, "bboxSize");
               folder .addInput (parameter, "bboxCenter");

               break;
            }
         }
      }

      this .pane .hidden = !this .pane .children .length;

      // Update expanded state of folder.

      for (const folder of this .pane .children)
         folder .on ("fold", () => this .fileConfig [`${folder .title}.expanded`] = folder .expanded)
   }
};
