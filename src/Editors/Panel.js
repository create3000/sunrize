const
   $         = require ("jquery"),
   TweakPane = require ("tweakpane"),
   Interface = require ("../Application/Interface"),
   X3D       = require ("../X3D"),
   Editor    = require ("../Undo/Editor");

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
      // Remove all blades.

      for (const folder of [... this .pane .children])
         folder .dispose ();

      if (this .node)
      {
         for (const field of this .node .getFields ())
            field .removeFieldCallback (this);
      }

      // Get new node.

      this .node = this .selection .nodes .at (-1);

      if (!this .node)
      {
         this .pane .hidden = true;
         return;
      }

      this .addBlades (this .node);

      this .pane .hidden = !this .pane .children .length;
   }

   addBlades (node)
   {
      for (const type of node .getType () .toReversed ())
      {
         switch (type)
         {
            case X3D .X3DConstants .Transform:
            {
               this .addFolder ({
                  title: node .getTypeName (),
                  node: node,
                  fields: [
                     "translation",
                     "rotation",
                     "scale",
                     "---",
                     "scaleOrientation",
                     "center",
                  ],
               });

               break;
            }
            case X3D .X3DConstants .X3DBoundedObject:
            {
               this .addFolder ({
                  title: "X3DBoundedObject",
                  node: node,
                  fields: [
                     "visible",
                     "bboxDisplay",
                     "bboxSize",
                     "bboxCenter",
                  ],
               });

               break;
            }
            case X3D .X3DConstants .X3DShapeNode:
            {
               this .addFolder ({
                  title: "X3DShapeNode",
                  node: node,
                  fields: [
                     "castShadow",
                  ],
               });

               break;
            }
         }
      }
   }

   addFolder ({ title, node, fields })
   {
      const folder = this .pane .addFolder ({
         title: title,
         expanded: this .fileConfig [`${title}.expanded`] ?? !this .pane .children .length,
      });

      // Update expanded state of folder.

      folder .on ("fold", () => this .fileConfig [`${title}.expanded`] = folder .expanded)

      // Add fields.

      const parameter = { };

      for (const name of fields)
      {
         if (name .match (/^-+$/))
            folder .addSeparator ();
         else
            this .addInput (folder, parameter, node, node .getField (name));
      }

      return folder;
   }

   addInput (folder, parameter, node, field)
   {
      switch (field .getType ())
      {
         case X3D .X3DConstants .SFBool:
         case X3D .X3DConstants .SFVec3d:
         case X3D .X3DConstants .SFVec3f:
         {
            this .refresh (parameter, node, field);

            const input = folder .addInput (parameter, field .getName ())
               .on ("change", ({ value }) => this .onchange (node, field, value));

            field .addFieldCallback (this, () =>
            {
               this .refresh (parameter, node, field);
               input .refresh ();
            });
         }
      }
   }

   refresh (parameter, node, field)
   {
      switch (field .getType ())
      {
         case X3D .X3DConstants .SFBool:
         {
            parameter [field .getName ()] = field .getValue ();
            break;
         }
         case X3D .X3DConstants .SFVec3d:
         case X3D .X3DConstants .SFVec3f:
         {
            const p = parameter [field .getName ()] ??= { };

            p .x = field .x;
            p .y = field .y;
            p .z = field .z;
            break;
         }
      }
   }

   onchange (node, field, value)
   {
      const executionContext = node .getExecutionContext ();

      switch (field .getType ())
      {
         case X3D .X3DConstants .SFBool:
         {
            Editor .setFieldValue (executionContext, node, field, value);
            break;
         }
         case X3D .X3DConstants .SFVec3d:
         case X3D .X3DConstants .SFVec3f:
         {
            Editor .setFieldValue (executionContext, node, field, new X3D .Vector3 (value .x, value .y, value .z));
            break;
         }
      }
   }
};
