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
      const types = new Map ();

      for (const element of X3DUOM .find (`ConcreteNode,AbstractNodeType,AbstractObjectType`))
         types .set (X3D .X3DConstants [$(element) .attr ("name")], $(element) .attr ("name"));

      const fieldsIndex = new Set (["IS", "DEF", "USE", "class", "id", "style"]);

      for (const type of node .getType ())
      {
         if (type === X3D .X3DConstants .X3DPrototypeInstance)
         {
            this .addFolder ({
               title: node .getTypeName (),
               node: node,
               fields: Array .from (node .getFields ())
                  .filter (field => !fieldsIndex .has (field .getName ()))
                  .map (field => field .getName ()),
            });
         }
         else
         {
            const typeName = types .get (type);

            if (!typeName)
               continue;

            const fields = new Set (X3DUOM .find (`ConcreteNode[name="${typeName}"],AbstractNodeType[name="${typeName}"],AbstractObjectType[name="${typeName}"]`) .find ("field") .map (function () { return $(this) .attr ("name"); }) .get ());

            this .addFolder ({
               title: typeName,
               node: node,
               fields: Array .from (node .getFields ())
                  .filter (field => !fieldsIndex .has (field .getName ()))
                  .filter (field => fields .has (field .getName ()))
                  .map (field => field .getName ()),
            });

            for (const name of fields)
               fieldsIndex .add (name);
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

      if (!folder .children .length)
         folder .dispose ();
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
