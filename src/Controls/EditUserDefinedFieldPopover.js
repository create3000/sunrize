"use strict";

const
   $           = require ("jquery"),
   electron    = require ("electron"),
   DataStorage = require ("../Application/DataStorage"),
   X3D         = require ("../X3D"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require ("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

require ("./Popover");
require ("../Bits/Validate");

const config = new DataStorage (localStorage, "Sunrize.UserDefinedFieldPopover.");

config .setDefaultValues ({
   typeName:"",
   accessType: X3D .X3DConstants .initializeOnly,
});

const accessTypes = new Map ([
   [X3D .X3DConstants .initializeOnly, "initializeOnly"],
   [X3D .X3DConstants .inputOnly,      "inputOnly"],
   [X3D .X3DConstants .outputOnly,     "outputOnly"],
   [X3D .X3DConstants .inputOutput,    "inputOutput"],
]);

$.fn.editUserDefinedFieldPopover = function (executionContext, node, field = -1)
{
   // Create content.

   const content = $("<div></div>");

   const typeNameMenu = $("<select></select>")
      .appendTo (content);

   const single = $("<optgroup></optgroup>")
      .attr ("label", "Single Fields");

   Object .keys (X3D .Fields)
      .filter (typeName => typeName .startsWith ("SF"))
      .sort ()
      .forEach (typeName => single .append ($("<option></option>") .text (typeName)))

   single .appendTo (typeNameMenu);

   const multi = $("<optgroup></optgroup>")
      .attr ("label", "Multi Fields");

   Object .keys (X3D .Fields)
      .filter (typeName => typeName .startsWith ("MF"))
      .sort ()
      .forEach (typeName => multi .append ($("<option></option>") .text (typeName)))

   multi .appendTo (typeNameMenu);

   const accessTypeMenu = $("<select></select>")
      .append ($("<option></option>") .text ("initializeOnly"))
      .append ($("<option></option>") .text ("inputOnly"))
      .append ($("<option></option>") .text ("outputOnly"))
      .append ($("<option></option>") .text ("inputOutput"))
      .appendTo (content);

   $("<span></span>")
      .text (_("Name"))
      .appendTo (content);

   const nameInput = $("<input></input>")
      .attr ("placeholder", _("Enter a name"))
      .appendTo (content);

   if (field instanceof X3D .X3DField)
   {
      typeNameMenu
         .find ("option")
         .filter ((i, e) => $(e) .text () === field .getTypeName ())
         .prop ("selected", true);

      accessTypeMenu
         .find ("option")
         .filter ((i, e) => $(e) .text () === accessTypes .get (field .getAccessType ()))
         .prop ("selected", true);

      nameInput .val (field .getName ());

      $("<span></span>")
         .text (_("Application Information"))
         .appendTo (content);

      $("<input></input>")
         .addClass ("appinfo")
         .attr ("placeholder", _("Enter application information"))
         .val (field .getAppInfo ())
         .appendTo (content);

      $("<span></span>")
         .text (_("Documentation"))
         .appendTo (content);

      $("<input></input>")
         .addClass ("documentation")
         .attr ("placeholder", _("Enter documentation"))
         .val (field .getDocumentation ())
         .appendTo (content);
   }
   else
   {
      typeNameMenu
         .find ("option")
         .filter ((i, e) => $(e) .text () === config .typeName)
         .prop ("selected", true);

      accessTypeMenu
         .find ("option")
         .filter ((i, e) => $(e) .text () === accessTypes .get (config .accessType))
         .prop ("selected", true);
   }

   $("<button></button>")
      .text (_("Apply"))
      .on ("click", confirm)
      .appendTo (content);

   // Create tooltip.

   const tooltip = this .popover ({
      content: content,
      extension:
      {
         wide: field instanceof X3D .X3DField,
      },
      events: {
         show (event, api)
         {
            nameInput .off () .validate (Editor .Id, () =>
            {
               electron .shell .beep ();
               nameInput .highlight ();
            })
            .siblings (".appinfo, .documentation") .addBack () .on ("keydown", event =>
            {
               if (event .key !== "Enter")
                  return;

               confirm (event);
            });

            setTimeout (() => nameInput .trigger ("select"), 1);
         },
      },
   });

   function confirm (event)
   {
      const
         typeName   = typeNameMenu .find ("option:selected") .text (),
         type       = X3D .X3DConstants [typeName],
         accessType = X3D .X3DConstants [accessTypeMenu .find ("option:selected") .text ()],
         name       = nameInput .val ();

      config .typeName   = typeName;
      config .accessType = accessType;

      if (field instanceof X3D .X3DField)
      {
         if (node .getUserDefinedFields () .has (name) && node .getUserDefinedFields () .get (name) !== field)
         {
            // Error: field name exists.
            electron .shell .beep ();
            nameInput .highlight ();
            event .preventDefault ();
         }
         else
         {
            tooltip .qtip ("api") .toggle (false);
            event .preventDefault ();

            if (!name .length)
               return;

            // Edit field.

            const
               fields        = Array .from (node .getUserDefinedFields ()),
               appInfo       = content .children (".appinfo") .val (),
               documentation = content .children (".documentation") .val ();

            if (type === field .getType ())
            {
               UndoManager .shared .beginUndo (_("Edit Field »%s«"), field .getName ());

               if (accessType !== field .getAccessType () || name !== field .getName ())
                  Editor .updateUserDefinedField (executionContext, node, field, accessType, name);

               if (appInfo !== field .getAppInfo ())
                  Editor .updateAppInfo (field, appInfo);

               if (documentation !== field .getDocumentation ())
                  Editor .updateDocumentation (field, documentation);

               UndoManager .shared .endUndo ();
            }
            else
            {
               const
                  index    = fields .indexOf (field),
                  newField = new X3D [typeName] ();

               UndoManager .shared .beginUndo (_("Change Type of Field »%s«"), field .getName ());

               newField .setAccessType (accessType);
               newField .setName (name);
               fields .splice (index, 1, newField);

               Editor .setUserDefinedFields (executionContext, node, fields);

               if (appInfo !== field .getAppInfo ())
                  Editor .updateAppInfo (newField, appInfo);

               if (documentation !== field .getDocumentation ())
                  Editor .updateDocumentation (newField, documentation);

               UndoManager .shared .endUndo ();
            }
         }
      }
      else
      {
         if (node .getUserDefinedFields () .has (name))
         {
            // Error: field name exists.
            electron .shell .beep ();
            nameInput .highlight ();
            event .preventDefault ();
         }
         else
         {
            tooltip .qtip ("api") .toggle (false);
            event .preventDefault ();

            if (!name .length)
               return;

            // Add field.

            const newField = new X3D [typeName] ();

            newField .setAccessType (accessType);
            newField .setName (name);

            Editor .addUserDefinedField (executionContext, node, newField, field);
         }
      }
   }

   return this;
}

