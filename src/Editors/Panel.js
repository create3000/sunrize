const
   $         = require ("jquery"),
   TweakPane = require ("tweakpane"),
   Interface = require ("../Application/Interface"),
   X3D       = require ("../X3D"),
   Editor    = require ("../Undo/Editor"),
   X3DUOM    = require ("../Bits/X3DUOM");

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
         "z-index": "1",
         "bottom": this .container .css ("top"),
         "top": "unset",
         "width": "unset",
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
         this .node .getScene () .units .removeInterest ("onselection", this);

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

      this .node .getScene () .units .addInterest ("onselection", this);

      this .addBlades (this .node);

      this .pane .hidden = !this .pane .children .length;
   }

   addBlades (node)
   {
      const types = new Map (X3DUOM .find (`ConcreteNode,AbstractNodeType,AbstractObjectType`) .map (function () { return this .getAttribute ("name"); }) .get () .map (typeName => [X3D .X3DConstants [typeName], typeName]));

      const seen = new Set (["IS", "DEF", "USE", "class", "id", "style"]);

      for (const type of node .getType ())
      {
         if (type === X3D .X3DConstants .X3DPrototypeInstance)
         {
            this .addFolder ({
               title: node .getTypeName (),
               node: node,
               fields: Array .from (node .getFields ())
                  .filter (field => !seen .has (field .getName ()))
                  .map (field => field .getName ()),
            });
         }
         else
         {
            const typeName = types .get (type);

            if (!typeName)
               continue;

            switch (type)
            {
               case X3D .X3DConstants .FontStyle:
               case X3D .X3DConstants .ScreenFontStyle:
               {
                  seen .delete ("style");
                  break;
               }
            }

            const fields = new Set (X3DUOM .find (`ConcreteNode[name=${typeName}],AbstractNodeType[name=${typeName}],AbstractObjectType[name=${typeName}]`) .find ("field") .map (function () { return this .getAttribute ("name"); }) .get ());

            this .addFolder ({
               title: typeName,
               node: node,
               fields: Array .from (node .getFields ())
                  .filter (field => !seen .has (field .getName ()))
                  .filter (field => fields .has (field .getName ()))
                  .map (field => field .getName ()),
            });

            for (const name of fields)
               seen .add (name);
         }
      }

      // Expand first folder, if not otherwise specified.

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

      if (!folder .children .length)
         folder .dispose ();
   }

   addInput (folder, parameter, node, field)
   {
      if (!field .isInitializable ())
         return;

      const
         element = X3DUOM .find (`ConcreteNode[name=${node .getTypeName ()}] field[name=${field .getName ()}]`),
         options = { };

      switch (field .getType ())
      {
         case X3D .X3DConstants .SFColor:
         case X3D .X3DConstants .SFColorRGBA:
         {
            options .color = { type: "float" };
            break;
         }
         case X3D .X3DConstants .SFInt32:
         {
            options .step = 1;
            break;
         }
         case X3D .X3DConstants .SFString:
         {
            const enumerations = element .find ("enumeration") .map (function () { return this .getAttribute ("value"); }) .get ();

            if (enumerations .length)
            {
               options .options = { };

               for (const value of enumerations)
                  options .options [value] = value;
            }

            break;
         }
         case X3D .X3DConstants .SFVec2d:
         case X3D .X3DConstants .SFVec2f:
         {
            options .y = { inverted: true };
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
         case X3D .X3DConstants .SFString:
         case X3D .X3DConstants .SFTime:
         case X3D .X3DConstants .SFVec2d:
         case X3D .X3DConstants .SFVec2f:
         case X3D .X3DConstants .SFVec3d:
         case X3D .X3DConstants .SFVec3f:
         case X3D .X3DConstants .SFVec4d:
         case X3D .X3DConstants .SFVec4f:
         {
            const
               executionContext = node .getExecutionContext (),
               category         = field .getUnit (),
               min              = element .attr ("minInclusive") ?? element .attr ("minExclusive"),
               max              = element .attr ("maxInclusive") ?? element .attr ("maxExclusive");

            if (min !== undefined)
               options .min = executionContext .toUnit (category, parseFloat (min));

            if (max !== undefined)
               options .max = executionContext .toUnit (category, parseFloat (max));

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
      const
         executionContext = node .getExecutionContext (),
         category         = field .getUnit ();

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

            for (const key in field)
               p [key] = field [key];

            break;
         }
         case X3D .X3DConstants .SFDouble:
         case X3D .X3DConstants .SFFloat:
         case X3D .X3DConstants .SFInt32:
         case X3D .X3DConstants .SFString:
         case X3D .X3DConstants .SFTime:
         {
            parameter [field .getName ()] = executionContext .toUnit (category, field .getValue ());
            break;
         }
         case X3D .X3DConstants .SFRotation:
         {
            const p = parameter [field .getName ()] ??= { };

            p .x = field .x;
            p .y = field .y;
            p .z = field .z;
            p .w = executionContext .toUnit ("angle", field .angle);
            break;
         }
         case X3D .X3DConstants .SFVec2d:
         case X3D .X3DConstants .SFVec2f:
         case X3D .X3DConstants .SFVec3d:
         case X3D .X3DConstants .SFVec3f:
         case X3D .X3DConstants .SFVec4d:
         case X3D .X3DConstants .SFVec4f:
         {
            const p = parameter [field .getName ()] ??= { };

            for (const key in field)
               p [key] = executionContext .toUnit (category, field [key]);

            break;
         }
      }
   }

   onchange (node, field, value)
   {
      const
         executionContext = node .getExecutionContext (),
         category         = field .getUnit ();

      switch (field .getType ())
      {
         case X3D .X3DConstants .SFBool:
         case X3D .X3DConstants .SFString:
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
            this .assign (executionContext, node, field, executionContext .fromUnit (category, value));
            break;
         }
         case X3D .X3DConstants .SFRotation:
         {
            value = new X3D .Rotation4 (value .x,
                                        value .y,
                                        value .z,
                                        executionContext .fromUnit ("angle", value .w));

            this .assign (executionContext, node, field, value);
            break;
         }
         case X3D .X3DConstants .SFVec2d:
         case X3D .X3DConstants .SFVec2f:
         {
            value = new X3D .Vector2 (executionContext .fromUnit (category, value .x),
                                      executionContext .fromUnit (category, value .y));

            this .assign (executionContext, node, field, value);
            break;
         }
         case X3D .X3DConstants .SFVec3d:
         case X3D .X3DConstants .SFVec3f:
         {
            value = new X3D .Vector3 (executionContext .fromUnit (category, value .x),
                                      executionContext .fromUnit (category, value .y),
                                      executionContext .fromUnit (category, value .z));

            this .assign (executionContext, node, field, value);
            break;
         }
         case X3D .X3DConstants .SFVec4d:
         case X3D .X3DConstants .SFVec4f:
         {
            value = new X3D .Vector4 (executionContext .fromUnit (category, value .x),
                                      executionContext .fromUnit (category, value .y),
                                      executionContext .fromUnit (category, value .z),
                                      executionContext .fromUnit (category, value .w));

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
