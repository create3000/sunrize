const
   $         = require ("jquery"),
   TweakPane = require ("tweakpane"),
   Interface = require ("../Application/Interface");

module .exports = new class Panel extends Interface
{
   constructor ()
   {
      super ();

      this .pane      = new TweakPane .Pane ({ title: "Transform" });
      this .container = $(this .pane .element) .parent ();
      this .selection = require ("../Application/Selection");

      this .container .hide () .appendTo ($("#browser-frame"));

      this .container .css ({
         "bottom": this .container .css ("top"),
         "top": "unset",
         "z-index": "1000",
      });

      this .container .on ("mousedown", () => this .onmousedown ())

      this .pane .on ("fold", () => this .onfold ());

      this .selection .addInterest (this, () => this .onselection ());


      const parameter = {
         translation: { x: 0, y: 0, z: 0 },
         rotation: { x: 0, y: 0, z: 1, w: 0 },
         scale: { x: 0, y: 0, z: 0 },
      };

      this .pane .addInput (parameter, "translation")
         .on ("change", ({ value }) => console .log (value .x, value .y, value .z));
      this .pane .addInput (parameter, "rotation");
      this .pane .addInput (parameter, "scale");


      this .setup ();
   }

   configure ()
   {
      this .fileConfig .setDefaultValues ({
         expanded: true,
      });

      this .pane .expanded = this .fileConfig .expanded;
   }

   get visible ()
   {
      return this .container .is (":visible");
   }

   show ()
   {
      this .container .show (300);
   }

   hide ()
   {
      this .container .hide (300);
   }

   onfold ()
   {
      this .fileConfig .expanded = this .pane .expanded;
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
      const
         node     = this .selection .nodes .at (-1),
         typeName = node ?.getTypeName ();

      this .pane .hidden = !node;
      this .pane .title  = typeName;

      // Remove all blades.

      for (const blade of [... this .pane .children])
         this .pane .remove (blade);
   }
};
