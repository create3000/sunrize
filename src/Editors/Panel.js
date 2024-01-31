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
      for (const type of node .getType ())
      {
         switch (type)
         {
            case X3D .X3DConstants .Inline:
            {
               this .addFolder ({
                  title: node .getTypeName (),
                  node: node,
                  fields: [
                     "global",
                  ],
               });

               break;
            }
            case X3D .X3DConstants .Material:
            {
               this .addFolder ({
                  title: node .getTypeName (),
                  node: node,
                  fields: [
                     "ambientIntensity",
                     "diffuseColor",
                     "specularColor",
                     "shininess",
                     "occlusionStrength",
                  ],
               });

               break;
            }
            case X3D .X3DConstants .PhysicalMaterial:
            {
               this .addFolder ({
                  title: node .getTypeName (),
                  node: node,
                  fields: [
                     "baseColor",
                     "metallic",
                     "roughness",
                     "occlusionStrength",
                  ],
               });

               break;
            }
            case X3D .X3DConstants .Switch:
            {
               this .addFolder ({
                  title: node .getTypeName (),
                  node: node,
                  fields: [
                     "whichChoice",
                  ],
               });

               break;
            }
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
            case X3D .X3DConstants .X3DOneSidedMaterialNode:
            {
               this .addFolder ({
                  title: "X3DOneSidedMaterialNode",
                  node: node,
                  fields: [
                     "emissiveColor",
                     "normalScale",
                     "transparency",
                  ],
               });

               break;
            }
            case X3D .X3DConstants .X3DPrototypeInstance:
            {
               this .addFolder ({
                  title: node .getTypeName (),
                  node: node,
                  fields: Array .from (node .getFields (), field => field .getName ()),
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
            case X3D .X3DConstants .X3DUrlObject:
            {
               this .addFolder ({
                  title: "X3DUrlObject",
                  node: node,
                  fields: [
                     "description",
                     "load",
                     "url",
                     "autoRefresh",
                     "autoRefreshTimeLimit",
                     ],
               });

               break;
            }
         }
      }

      if (this .pane .children .length)
         this .pane .children [0] .expanded = this .fileConfig [`${this .pane .children [0] .title}.expanded`] ?? true;
   }

   addFolder ({ title, node, fields })
   {
      const folder = this .pane .addFolder ({
         title: title,
         expanded: this .fileConfig [`${title}.expanded`] ?? false,
         index: 0,
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
      if (!field .isInitializable ())
         return;

      switch (field .getType ())
      {
         case X3D .X3DConstants .SFColor:
         case X3D .X3DConstants .SFColorRGBA:
         {
            var options = { color: { type: "float" }};
            break;
         }
         case X3D .X3DConstants .SFInt32:
         {
            var options = { step: 1 };
            break;
         }
      }

      switch (field .getType ())
      {
         case X3D .X3DConstants .SFBool:
         case X3D .X3DConstants .SFColor:
         case X3D .X3DConstants .SFColorRGBA:
         case X3D .X3DConstants .SFDouble:
         case X3D .X3DConstants .SFFloat:
         case X3D .X3DConstants .SFInt32:
         case X3D .X3DConstants .SFRotation:
         case X3D .X3DConstants .SFTime:
         case X3D .X3DConstants .SFVec3d:
         case X3D .X3DConstants .SFVec3f:
         {
            this .refresh (parameter, node, field);

            const input = folder .addInput (parameter, field .getName (), options);

            input .on ("change", ({ value }) => this .onchange (node, field, value));

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
         case X3D .X3DConstants .SFColor:
         {
            const p = parameter [field .getName ()] ??= { };

            p .r = field .r;
            p .g = field .g;
            p .b = field .b;
            break;
         }
         case X3D .X3DConstants .SFColorRGBA:
         {
            const p = parameter [field .getName ()] ??= { };

            p .r = field .r;
            p .g = field .g;
            p .b = field .b;
            p .a = field .a;
            break;
         }
         case X3D .X3DConstants .SFDouble:
         case X3D .X3DConstants .SFFloat:
         case X3D .X3DConstants .SFInt32:
         case X3D .X3DConstants .SFTime:
         {
            parameter [field .getName ()] = field .getValue ();
            break;
         }
         case X3D .X3DConstants .SFRotation:
         {
            const p = parameter [field .getName ()] ??= { };

            p .x = field .x;
            p .y = field .y;
            p .z = field .z;
            p .w = field .angle;
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
         case X3D .X3DConstants .SFColor:
         {
            value = new X3D .Color3 (value .r, value .g, value .b);

            this .assign (executionContext, node, field, value);
            break;
         }
         case X3D .X3DConstants .SFColorRGBA:
         {
            value = new X3D .Color4 (value .r, value .g, value .b, value .a);

            this .assign (executionContext, node, field, value);
            break;
         }
         case X3D .X3DConstants .SFDouble:
         case X3D .X3DConstants .SFFloat:
         case X3D .X3DConstants .SFInt32:
         case X3D .X3DConstants .SFTime:
         {
            this .assign (executionContext, node, field, value);
            break;
         }
         case X3D .X3DConstants .SFRotation:
         {
            value = new X3D .Rotation4 (value .x, value .y, value .z, value .w);

            this .assign (executionContext, node, field, value);
            break;
         }
         case X3D .X3DConstants .SFVec3d:
         case X3D .X3DConstants .SFVec3f:
         {
            value = new X3D .Vector3 (value .x, value .y, value .z);

            this .assign (executionContext, node, field, value);
            break;
         }
      }
   }

   assign (executionContext, node, field, value)
   {
      if (this .mousedown)
      {
         this .field ??= field .copy ();

         field .setValue (value);
      }
      else
      {
         if (this .field)
            field .assign (this .field);

         Editor .setFieldValue (executionContext, node, field, value);

         this .field = null;
      }
   }
};
