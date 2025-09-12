"use strict";

const
   $           = require ("jquery"),
   capitalize  = require ("capitalize"),
   Dialog      = require ("../Controls/Dialog"),
   Tabs        = require ("../Controls/Tabs"),
   Algorithm   = require ("../Bits/Algorithm"),
   Units       = require ("./Units"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require ("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

require ("../Fields");

module .exports = new class SceneProperties extends Dialog
{
   constructor ()
   {
      super ("Sunrize.SceneProperties.");

      this .setup ();
   }

   initialize ()
   {
      super .initialize ();

      // Add class.

      this .element .addClass ("scene-properties");

      // Add tabs.

      this .tabs = new Tabs ($("<div></div>") .attr ("id", "scene-properties-tabs"), "top");

      this .tabs .addTextTab ("profile-and-components", _("Profile & Components"));
      this .tabs .addTextTab ("units",                  _("Units"));
      this .tabs .addTextTab ("meta-data",              _("Meta Data"));
      this .tabs .addTextTab ("world-info",             _("World Info"));

      this .tabs .setup ();
      this .tabs .element .appendTo (this .element);

      // Add panels.

      this .profileAndComponents = $("#profile-and-components") .addClass ("scrollable");
      this .units                = $("#units") .addClass ("scrollable");
      this .metaData             = $("#meta-data") .addClass ("scrollable");
      this .worldInfo            = $("#world-info") .addClass ("scrollable");

      // Profile And Components

      this .profileAndComponents .table       = $("<table></table>") .appendTo (this .profileAndComponents);
      this .profileAndComponents .table .body = $("<tbody></tbody>") .appendTo (this .profileAndComponents .table);
      this .profileAndComponents .inputs      = { };

      this .profileAndComponents .inputs .checkbox = $("<input></input>")
         .attr ("id", "infer-profile-and-components-checkbox")
         .attr ("type", "checkbox")
         .on ("click", () => this .toggleInferProfileAndComponents ());

      this .profileAndComponents .inputs .profile = $("<select></select>")
         .on ("change", () => this .changeProfile ());

      this .profileAndComponents .components        = $("<div></div>") .css ({ "overflow-y": "auto", "height": "20em" });
      this .profileAndComponents .components .table = $("<table></table>") .appendTo (this .profileAndComponents .components);
      this .profileAndComponents .components .body  = $("<tbody></tbody>") .appendTo (this .profileAndComponents .components .table);

      for (const profile of this .browser .getSupportedProfiles ())
      {
         $("<option></option>")
            .text (profile .title)
            .val (profile .name)
            .appendTo (this .profileAndComponents .inputs .profile);
      }

      for (const component of this .browser .getSupportedComponents ())
      {
         $("<tr></tr>")
            .append ($("<td></td>")
               .append ($("<input></input>")
                  .attr ("type", "checkbox")
                  .attr ("component", component .name)
                  .on ("change", () => this .changeComponents ())))
            .append ($("<td></td>") .text (component .title))
            .append ($("<td></td>") .append ($("<input></input>")
               .attr ("component", component .name)
               .attr ("level", component .level)
               .val (component .level)
               .on ("change", () => this .changeComponents ())))
            .appendTo (this .profileAndComponents .components .body);
      }

      this .profileAndComponents .checkboxRow = $("<tr></tr>")
         .append ($("<th></th>"))
         .append ($("<td></td>")
            .append (this .profileAndComponents .inputs .checkbox)
            .append ($("<label></label>") .attr ("for", "infer-profile-and-components-checkbox") .text ("Infer Profile and Components from Source")))
         .appendTo (this .profileAndComponents .table .body);

      $("<tr></tr>")
         .append ($("<th></th>") .text (_("Profile")))
         .append ($("<td></td>") .append (this .profileAndComponents .inputs .profile))
         .appendTo (this .profileAndComponents .table .body);

      $("<tr></tr>")
         .append ($("<th></th>") .text (_("Components")))
         .append ($("<td></td>") .append (this .profileAndComponents .components))
         .appendTo (this .profileAndComponents .table .body);

      // Units

      this .units .table       = $("<table></table>") .appendTo (this .units);
      this .units .table .head = $("<thead></thead>") .appendTo (this .units .table);
      this .units .table .body = $("<tbody></tbody>") .appendTo (this .units .table);

      this .units .inputs = new Map (Units .map (unit => [unit .category,
      {
         name: $("<input></input>") .attr ("list", unit .category),
         conversionFactor: $("<input></input>") .attr ("category", unit .category),
      }]));

      $("<tr></tr>")
         .append ($("<th></th>"))
         .append ($("<th></th>") .text (_("Name")))
         .append ($("<th></th>") .text (_("Conversion Factor")))
         .appendTo (this .units .table .head);

      for (const units of Units)
      {
         $("<tr></tr>")
            .append ($("<th></th>") .text (capitalize (units .category)))
            .append ($("<td></td>") .css ("width", "50%") .append (this .units .inputs .get (units .category) .name))
            .append ($("<td></td>") .css ("width", "50%") .append (this .units .inputs .get (units .category) .conversionFactor))
            .appendTo (this .units .table .body);

         const datalist = $("<datalist></datalist>")
            .attr ("id", units .category)
            .appendTo (this .units);

         for (const unit of units .units)
            $("<option></option>") .attr ("value", unit .name) .appendTo (datalist);
      }

      this .units .find ("input[list]")
         .on ("click", function ()
         {
            if (!$(this) .val ())
               return

            $(this) .attr ("placeholder", $(this) .val ())
            $(this) .val ("")
         })
         .on ("mouseleave", function ()
         {
            if ($(this) .val ())
               return

            $(this) .val ($(this) .attr ("placeholder"))
         })
         .on ("change", event => this .changeUnitName (event));

      this .units .find ("input[category]") .on ("change", event => this .changeUnitValue (event));

      // Meta Data

      this .metaData .table       = $("<table></table>") .addClass ("sticky-headers") .appendTo (this .metaData);
      this .metaData .table .head = $("<thead></thead>") .appendTo (this .metaData .table);
      this .metaData .table .body = $("<tbody></tbody>") .appendTo (this .metaData .table);

      $("<tr></tr>")
         .append ($("<th></th>") .css ("width", "30%") .text (_("Key")))
         .append ($("<th></th>") .css ("width", "70%") .text (_("Value")))
         .appendTo (this .metaData .table .head);

      // World Info

      this .worldInfo .table       = $("<table></table>") .appendTo (this .worldInfo);
      this .worldInfo .table .body = $("<tbody></tbody>") .appendTo (this .worldInfo .table);
      this .worldInfo .inputs      = { };

      this .worldInfo .inputs .checkbox = $("<input></input>")
         .attr ("id", "world-info-checkbox")
         .attr ("type", "checkbox")
         .on ("click", () => this .toggleWorldInfo ());

      this .worldInfo .inputs .title = $("<input></input>");
      this .worldInfo .inputs .info  = $("<textarea></textarea>");

      this .worldInfo .checkboxRow = $("<tr></tr>")
         .append ($("<th></th>"))
         .append ($("<td></td>")
            .append (this .worldInfo .inputs .checkbox)
            .append ($("<label></label>") .attr ("for", "world-info-checkbox") .text ("World Info")))
         .appendTo (this .worldInfo .table .body);

      $("<tr></tr>")
         .append ($("<th></th>") .text (_("Title")))
         .append ($("<td></td>") .append (this .worldInfo .inputs .title))
         .appendTo (this .worldInfo .table .body);

      $("<tr></tr>")
         .append ($("<th></th>") .text (_("Info")))
         .append ($("<td></td>") .append (this .worldInfo .inputs .info))
         .appendTo (this .worldInfo .table .body);
   }

   configure ()
   {
      super .configure ({ size: [600, 400] });

      if (this .executionContext)
         this .onclose ();

      this .executionContext = this .browser .currentScene;

      this .onopen ();
   }

   onopen ()
   {
      this .executionContext .profile_changed  .addInterest ("updateProfile",    this);
      this .executionContext .components       .addInterest ("updateComponents", this);
      this .executionContext .units            .addInterest ("updateUnits",      this);
      this .executionContext .metadata_changed .addInterest ("updateMetaData",   this);

      this .executionContext .getWorldInfos () .addInterest ("updateWorldInfo", this);

      const app = require ("../Application/Window");

      this .profileAndComponents .inputs .checkbox .prop ("checked", app .config .file .inferProfileAndComponents);

      this .toggleInferProfileAndComponents ();
      this .updateProfile ();
      this .updateComponents ();
      this .updateUnits ();
      this .updateMetaData ();
      this .updateWorldInfo ();
   }

   onclose ()
   {
      this .executionContext .profile_changed  .removeInterest ("updateProfile",    this);
      this .executionContext .components       .removeInterest ("updateComponents", this);
      this .executionContext .units            .removeInterest ("updateUnits",      this);
      this .executionContext .metadata_changed .removeInterest ("updateMetaData",   this);

      this .executionContext .getWorldInfos () .removeInterest ("updateWorldInfo", this);
   }

   toggleInferProfileAndComponents ()
   {
      const app = require ("../Application/Window");

      app .config .file .inferProfileAndComponents = this .profileAndComponents .inputs .checkbox .prop ("checked");

      if (this .profileAndComponents .inputs .checkbox .prop ("checked"))
         this .profileAndComponents .checkboxRow .addClass ("disabled");
      else
         this .profileAndComponents .checkboxRow .removeClass ("disabled");
   }

   updateProfile ()
   {
      const profile = this .executionContext .getProfile ();

      this .profileAndComponents .inputs .profile .find (`option[value=${profile ? profile .name : "Full"}]`).prop ("selected", true);
   }

   changeProfile ()
   {
      const profile = this .browser .getProfile (this .profileAndComponents .inputs .profile .val ());

      Editor .setProfile (this .executionContext, profile);
   }

   updateComponents ()
   {
      this .profileAndComponents .components
         .find ("input[type=checkbox]:checked") .prop ("checked", false);

      for (const component of this .executionContext .getComponents ())
      {
         this .profileAndComponents .components
            .find (`input[type=checkbox][component=${component .name}]`) .prop ("checked", true);
         this .profileAndComponents .components
            .find (`input[level][component=${component .name}]`) .val (component .level);
      }
   }

   changeComponents ()
   {
      const components = Array .from (this .profileAndComponents .components .body .children ()) .map (e =>
      {
         const
            element    = $(e),
            checkbox   = element .find ("input[type=checkbox]"),
            name       = checkbox .attr ("component"),
            levelInput = element .find ("input[level]");

         if (!checkbox .prop ("checked"))
            return;

         const
            level    = parseInt (levelInput .val ()),
            maxLevel = parseInt (levelInput .attr ("level"));

         return this .browser .getComponent (name, Algorithm .clamp (level, 1, maxLevel) || maxLevel);
      })
      .filter (v => v);

      Editor .setComponents (this .executionContext, components);
   }

   updateUnits ()
   {
      for (const unit of this .executionContext .getUnits ())
      {
         const inputs = this .units .inputs .get (unit .category);

         inputs .name             .val (unit .name);
         inputs .conversionFactor .val (unit .conversionFactor);
      }
   }

   getDefaultUnit (category)
   {
      const
         units = Units .find (units => units .category === category) .units,
         unit  = units .find (unit => unit .conversionFactor === 1);

      return unit;
   }

   changeUnitName (event)
   {
      const
         category         = $(event .currentTarget) .attr ("list"),
         name             = this .units .inputs .get (category) .name,
         conversionFactor = this .units .inputs .get (category) .conversionFactor;

      if (!name .val ())
         name .val (this .getDefaultUnit (category) .name);

      const
         units = Units .find (units => units .category === category) .units,
         unit  = units .find (unit => unit .name === name .val ());

      if (unit)
         conversionFactor .val (unit .conversionFactor);

      Editor .updateUnit (this .executionContext, category, name .val (), conversionFactor .val ());
   }

   changeUnitValue (event)
   {
      const
         category         = $(event .currentTarget) .attr ("category"),
         name             = this .units .inputs .get (category) .name,
         conversionFactor = this .units .inputs .get (category) .conversionFactor;

      Editor .updateUnit (this .executionContext, category, name .val (), conversionFactor .val ());
   }

   updateMetaData ()
   {
      const
         scrollTop  = this .metaData .table .scrollTop (),
         scrollLeft = this .metaData .table .scrollLeft ();

      this .metaData .table .body .empty ();

      const metaData = Array .from (this .executionContext .getMetaDatas ())
         .sort ((a, b) => Algorithm .cmp (a [0], b [0]));

      for (const [key, values] of metaData)
      {
         for (const value of values)
         {
            $("<tr></tr>")
               .append ($("<td></td>")
                  .css ("width", "unset")
                  .append ($("<input></input>")
                  .attr ("placeholder", _("Insert meta key here."))
                  .val (key) .on ("change", (event) => this .changeMetaData (event, key))))
               .append ($("<td></td>")
                  .css ("width", "unset")
                  .append ($("<input></input>")
                  .attr ("placeholder", _("Insert meta value here."))
                  .val (value) .on ("change", (event) => this .changeMetaData (event, key))))
               .appendTo (this .metaData .table);
         }
      }

      $("<tr></tr>")
         .append ($("<td></td>")
            .css ("width", "unset")
            .append ($("<input></input>")
            .attr ("placeholder", _("Add new meta key."))
            .on ("change", event => this .changeMetaData (event, ""))))
         .append ($("<td></td>")
            .css ("width", "unset")
            .append ($("<input></input>")
            .prop ("readonly", true)
            .on ("change", event => this .changeMetaData (event, ""))))
         .appendTo (this .metaData .table);

      this .metaData .table .scrollTop (scrollTop);
      this .metaData .table .scrollLeft (scrollLeft);
   }

   changeMetaData (event, oldKey)
   {
      const
         inputs = $(event .target) .closest ("tr") .find ("input"),
         key    = $(inputs .get (0));

      if (key .val ())
         UndoManager .shared .beginUndo (_("Change Meta Data »%s«"), key .val ());
      else
         UndoManager .shared .beginUndo (_("Remove Meta Data »%s«"), oldKey);

      const metaData = Array .from (this .metaData .table .find ("tr")) .map (element =>
      {
         const
            inputs = $(element) .find ("input"),
            key    = $(inputs .get (0)),
            value  = $(inputs .get (1));

         return [key .val (), value .val ()];
      })
      .filter (([key]) => key)
      .sort ((a, b) => Algorithm .cmp (a [0], b [0]));

      Editor .setMetaData (this .executionContext, metaData);

      UndoManager .shared .endUndo ();
   }

   updateWorldInfo ()
   {
      if (this .worldInfoNode)
      {
         this .worldInfo .inputs .title .SFStringInput ();
         this .worldInfo .inputs .info .MFStringTextArea ();
      }

      if (this .executionContext .getWorldInfos () .length)
      {
         this .worldInfoNode = this .executionContext .getWorldInfos () .at (-1) .getValue ();

         this .worldInfo .inputs .title .SFStringInput (this .worldInfoNode, "title");
         this .worldInfo .inputs .info .MFStringTextArea (this .worldInfoNode, "info");

         this .worldInfo .checkboxRow .removeClass ("disabled");
         this .worldInfo .inputs .checkbox .prop ("checked", true);
      }
      else
      {
         this .worldInfoNode = null;

         this .worldInfo .checkboxRow .addClass ("disabled");
         this .worldInfo .inputs .checkbox .prop ("checked", false);
         this .worldInfo .inputs .title .val ("");
         this .worldInfo .inputs .info .val ("");
      }
   }

   toggleWorldInfo ()
   {
      if (this .worldInfo .inputs .checkbox .prop ("checked"))
         Editor .addWorldInfo (this .executionContext);
      else
         Editor .removeWorldInfo (this .executionContext, this .worldInfoNode);
   }
};
