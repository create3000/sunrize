const
   $         = require ("jquery"),
   TweakPane = require ("tweakpane"),
   Interface = require ("../Application/Interface"),
   X3D       = require ("../X3D"),
   Editor    = require ("../Undo/Editor"),
   X3DUOM    = require ("../Bits/X3DUOM"),
   _         = require ("../Application/GetText");

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
         "z-index": "95",
         "bottom": this .container .css ("top"),
         "top": "unset",
         "width": "unset",
      });

      this .container .on ("mousedown", event => this .onmousedown (event));

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

      this .container .hide (300, () => this .removeNode (this .node));
   }

   onmousedown (event)
   {
      $(document) .on ("mouseup.Panel", () => this .onmouseup ());

      this .mousedown = true;
      this .startX    = event .pageX + parseFloat (this .container .css ("right"));
      this .startY    = event .pageY + parseFloat (this .container .css ("bottom"));
   }

   onmouseup ()
   {
      $(document) .off (".Panel");

      this .mousedown = false;
   }

   onmousemove (event)
   {
      this .container .css ({
         "right":  `${this .startX - event .pageX}px`,
         "bottom": `${this .startY - event .pageY}px`,
      });
   }

   onselection ()
   {
      this .setNode (this .selection .nodes .at (-1));
   }

   setNode (node)
   {
      this .removeNode (this .node);

      this .node = node;

      this .addNode (this .node);
   }

   addNode (node)
   {
      if (!node)
      {
         this .pane .hidden = true;
         return;
      }

      // Create folders.

      const concreteNode = X3DUOM .find (`ConcreteNode[name=${node .getTypeName ()}]`);

      this .browser .currentScene .units .addInterest ("updateNode", this);

      this .addBlades (node, concreteNode);

      this .pane .hidden = !this .pane .children .length;

      // Set title.

      const interfaceDefinitionElement = concreteNode .find (`InterfaceDefinition`);

      this .container .attr ("title", this .getNodeTitle (interfaceDefinitionElement));

      // Make first folder title draggable.

      this .container .find (".tp-fldv_t") .first () .css ("cursor", "move") .on ("mousedown", () =>
      {
         $(document) .on ("mousemove.Panel", event => this .onmousemove (event));
      })
      .on ("click", event =>
      {
         event .stopPropagation ();
      });

      // Move panel in view if top, left, bottom or right is outside of window.

      const
         offset = this .container .offset (),
         width  = this .container .width (),
         height = this .container .height (),
         body   = $("body");

      let
         right  = parseFloat (this .container .css ("right"))  || 0,
         bottom = parseFloat (this .container .css ("bottom")) || 0;

      if (offset .left + width > body .width ())
         right += (offset .left + width) - body .width () + 8;

      if (offset .left < 0)
         right += offset .left - 8;

      if (offset .top + height > body .height ())
         bottom += (offset .top + height) - body .height () + 8;

      if (offset .top < 0)
         bottom += offset .top - 8;

      this .container .css ({
         "right":  `${right}px`,
         "bottom": `${bottom}px`,
      });
   }

   removeNode (node)
   {
      // Remove all folders.

      for (const folder of Array .from (this .pane .children))
         folder .dispose ();

      if (!node)
         return;

      // Disconnect interests.

      this .browser .currentScene .units .removeInterest ("updateNode", this);

      for (const field of node .getFields ())
         field .removeFieldCallback (this);
   }

   updateNode ()
   {
      this .setNode (this .node);
   }

   addBlades (node, concreteNode)
   {
      const
         seen              = new Set (["IS", "DEF", "USE", "class", "id", "style"]),
         userDefinedFields = node .getUserDefinedFields ();

      for (const type of node .getType ())
      {
         if (type === X3D .X3DConstants .X3DPrototypeInstance)
         {
            this .addFolder ({
               concreteNode: concreteNode,
               title: node .getTypeName (),
               node: node,
               fields: Array .from (node .getFields ())
                  .filter (field => !seen .has (field .getName ()))
                  .map (field => field .getName ()),
            });
         }
         else
         {
            const
               typeName = X3D .X3DConstants [type],
               fields   = new Set (X3DUOM .find (`ConcreteNode[name=${typeName}],AbstractNodeType[name=${typeName}],AbstractObjectType[name=${typeName}]`) .find ("field") .map (function () { return this .getAttribute ("name"); }) .get ());

            switch (type)
            {
               case X3D .X3DConstants .FontStyle:
               case X3D .X3DConstants .ScreenFontStyle:
               {
                  seen .delete ("style");
                  break;
               }
               case X3D .X3DConstants .Script:
               case X3D .X3DConstants .ComposedShader:
               case X3D .X3DConstants .PackagedShader:
               case X3D .X3DConstants .ShaderProgram:
               {
                  for (const field of userDefinedFields)
                     fields .add (field .getName ());

                  break;
               }
            }

            this .addFolder ({
               concreteNode: concreteNode,
               title: typeName,
               node: node,
               fields: Array .from (node .getFields ())
                  .filter (field => !seen .has (field .getName ()))
                  .filter (field => fields .has (field .getName ()))
                  .sort ((a, b) => userDefinedFields .includes (b) - userDefinedFields .includes (a))
                  .map (field => field .getName ()),
            });

            for (const name of fields)
               seen .add (name);
         }
      }
   }

   addFolder ({ concreteNode, title, node, fields })
   {
      const folder = this .pane .addFolder ({
         title: title,
         expanded: this .config .global [`${title}.expanded`] ?? true,
         index: 0,
      });

      // Update expanded state of folder.

      folder .on ("fold", () => this .config .global [`${title}.expanded`] = folder .expanded)

      // Add fields.

      const parameter = { };

      for (const name of fields)
      {
         if (name .match (/^-+$/))
            folder .addSeparator ();
         else
            this .addInput (folder, parameter, node, node .getField (name), concreteNode);
      }

      if (!folder .children .length)
         folder .dispose ();
   }

   addInput (folder, parameter, node, field, concreteNode)
   {
      if (!field .isInitializable ())
         return;

      const
         fieldElement = concreteNode .find (`field[name=${field .getName ()}]`),
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
            const enumerations = fieldElement .find ("enumeration") .map (function () { return this .getAttribute ("value"); }) .get ();

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
               executionContext = this .browser .currentScene,
               category         = field .getUnit (),
               min              = fieldElement .attr ("minInclusive") ?? fieldElement .attr ("minExclusive"),
               max              = fieldElement .attr ("maxInclusive") ?? fieldElement .attr ("maxExclusive");

            if (min !== undefined)
               options .min = executionContext .toUnit (category, parseFloat (min));

            if (max !== undefined)
               options .max = executionContext .toUnit (category, parseFloat (max));

            this .refresh (parameter, node, field);

            const input = folder .addInput (parameter, field .getName (), options);

            $(input .element) .attr ("title", this .getFieldTitle (node, field, fieldElement));

            input .on ("change", ({ value }) => this .onchange (node, field, value));

            field .addFieldCallback (this, () =>
            {
               this .refresh (parameter, node, field);
               input .refresh ();
            });

            break;
         }
         case X3D .X3DConstants .SFImage:
         case X3D .X3DConstants .SFMatrix3d:
         case X3D .X3DConstants .SFMatrix3f:
         case X3D .X3DConstants .SFMatrix4d:
         case X3D .X3DConstants .SFMatrix4f:
         case X3D .X3DConstants .MFBool:
         case X3D .X3DConstants .MFColor:
         case X3D .X3DConstants .MFColorRGBA:
         case X3D .X3DConstants .MFDouble:
         case X3D .X3DConstants .MFFloat:
         case X3D .X3DConstants .MFImage:
         case X3D .X3DConstants .MFInt32:
         case X3D .X3DConstants .MFMatrix3d:
         case X3D .X3DConstants .MFMatrix3f:
         case X3D .X3DConstants .MFMatrix4d:
         case X3D .X3DConstants .MFMatrix4f:
         case X3D .X3DConstants .MFRotation:
         case X3D .X3DConstants .MFString:
         case X3D .X3DConstants .MFTime:
         case X3D .X3DConstants .MFVec2d:
         case X3D .X3DConstants .MFVec2f:
         case X3D .X3DConstants .MFVec3d:
         case X3D .X3DConstants .MFVec3f:
         case X3D .X3DConstants .MFVec4d:
         case X3D .X3DConstants .MFVec4f:
         {
            if (process .env .SUNRISE_ENVIRONMENT !== "DEVELOPMENT")
               break;

            const tooMuchValues = (field instanceof X3D .X3DArrayField) && field .length >= 10_000;

            if (tooMuchValues)
               parameter [field .getName ()] = _("Too much values.");
            else
               this .refresh (parameter, node, field);

            const input = folder .addMonitor (parameter, field .getName (),
            {
               multiline: true,
               lineCount: tooMuchValues ? 1 : 2,
            });

            $(input .element) .attr ("title", this .getFieldTitle (node, field, fieldElement));

            if (tooMuchValues)
               break;

            const textarea = $(input .element) .find ("textarea") .removeAttr ("readonly");

            textarea .on ("focusout", () => this .onchange (node, field, textarea .val ()));

            field .addFieldCallback (this, () =>
            {
               this .refresh (parameter, node, field);
               textarea .val (parameter [field .getName ()]);
            });

            break;
         }
      }
   }

   refresh (parameter, node, field)
   {
      const
         executionContext = this .browser .currentScene,
         category         = field .getUnit ();

      switch (field .getType ())
      {
         case X3D .X3DConstants .SFBool:
         case X3D .X3DConstants .SFDouble:
         case X3D .X3DConstants .SFFloat:
         case X3D .X3DConstants .SFInt32:
         case X3D .X3DConstants .SFString:
         case X3D .X3DConstants .SFTime:
         {
            parameter [field .getName ()] = executionContext .toUnit (category, field .getValue ());
            break;
         }
         case X3D .X3DConstants .SFImage:
         case X3D .X3DConstants .SFMatrix3d:
         case X3D .X3DConstants .SFMatrix3f:
         case X3D .X3DConstants .SFMatrix4d:
         case X3D .X3DConstants .SFMatrix4f:
         {
            parameter [field .getName ()] = field .toString ();
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
         case X3D .X3DConstants .SFColor:
         case X3D .X3DConstants .SFColorRGBA:
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
         case X3D .X3DConstants .MFBool:
         case X3D .X3DConstants .MFDouble:
         case X3D .X3DConstants .MFFloat:
         case X3D .X3DConstants .MFImage:
         case X3D .X3DConstants .MFInt32:
         case X3D .X3DConstants .MFMatrix3d:
         case X3D .X3DConstants .MFMatrix3f:
         case X3D .X3DConstants .MFMatrix4d:
         case X3D .X3DConstants .MFMatrix4f:
         case X3D .X3DConstants .MFString:
         case X3D .X3DConstants .MFTime:
         {
            const
               single  = new (field .getSingleType ()) (),
               options = { scene: executionContext };

            single .setUnit (field .getUnit ());

            const value = Array .from (field, value =>
            {
               single .setValue (value);

               return single .toString (options);
            })
            .join (",\n");

            parameter [field .getName ()] = value;
            break;
         }
         case X3D .X3DConstants .MFColor:
         case X3D .X3DConstants .MFColorRGBA:
         case X3D .X3DConstants .MFRotation:
         case X3D .X3DConstants .MFVec2d:
         case X3D .X3DConstants .MFVec2f:
         case X3D .X3DConstants .MFVec3d:
         case X3D .X3DConstants .MFVec3f:
         case X3D .X3DConstants .MFVec4d:
         case X3D .X3DConstants .MFVec4f:
         {
            const
               single  = new (field .getSingleType ()) (),
               options = { scene: executionContext };

            single .setUnit (field .getUnit ());

            const value = Array .from (field, value =>
            {
               single .assign (value);

               return single .toString (options);
            })
            .join (",\n");

            parameter [field .getName ()] = value;
            break;
         }
      }
   }

   onchange (node, field, value)
   {
      const
         executionContext = this .browser .currentScene,
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
         case X3D .X3DConstants .SFImage:
         case X3D .X3DConstants .SFMatrix3d:
         case X3D .X3DConstants .SFMatrix3f:
         case X3D .X3DConstants .SFMatrix4d:
         case X3D .X3DConstants .SFMatrix4f:
         {
            try
            {
               Editor .setFieldFromString (executionContext, node, field, value);
            }
            catch
            {
               $ .beep ();
            }

            break;
         }
         case X3D .X3DConstants .MFBool:
         case X3D .X3DConstants .MFColor:
         case X3D .X3DConstants .MFColorRGBA:
         case X3D .X3DConstants .MFDouble:
         case X3D .X3DConstants .MFFloat:
         case X3D .X3DConstants .MFImage:
         case X3D .X3DConstants .MFInt32:
         case X3D .X3DConstants .MFMatrix3d:
         case X3D .X3DConstants .MFMatrix3f:
         case X3D .X3DConstants .MFMatrix4d:
         case X3D .X3DConstants .MFMatrix4f:
         case X3D .X3DConstants .MFRotation:
         case X3D .X3DConstants .MFString:
         case X3D .X3DConstants .MFTime:
         case X3D .X3DConstants .MFVec2d:
         case X3D .X3DConstants .MFVec2f:
         case X3D .X3DConstants .MFVec3d:
         case X3D .X3DConstants .MFVec3f:
         case X3D .X3DConstants .MFVec4d:
         case X3D .X3DConstants .MFVec4f:
         {
            try
            {
               Editor .setFieldFromString (executionContext, node, field, `[${value}]`);
            }
            catch
            {
               $ .beep ();
            }

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

   getNodeTitle (interfaceDefinitionElement)
   {
      const description = interfaceDefinitionElement .attr ("appinfo");

      let title = "";

      if (description)
         title += `Description:\n\n${description}`;

      return title;
   }

   getFieldTitle (node, field, fieldElement)
   {
      const description = fieldElement .attr ("description");

      let title = "";

      if (description)
         title += `Description:\n\n${description}\n\n`;

      title += `Type: ${field .getTypeName ()}\n`;

      if (field instanceof X3D .X3DArrayField)
         title += `Number of values: ${field .length}`;
      else
         title += `Current value: ${field .toString ({ scene: this .browser .currentScene })}`;

      return title;
   }
};
