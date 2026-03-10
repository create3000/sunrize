"use strict";

const
   $           = require ("jquery"),
   X3D         = require ("../X3D"),
   LibraryPane = require ("./LibraryPane"),
   Editor      = require("../Undo/Editor"),
   _           = require ("../Application/GetText");

module .exports = class MaterialsLibrary extends LibraryPane
{
   id          = "MATERIALS";
   description = "Materials";

   #scene;
   #list;
   #physicalButton;
   #cancelRendering;
   #rendering;

   async update ()
   {
      // Fill output.

      if (this .#list)
      {
         this .output .append (this .#list);
         return;
      }

      // Create list.

      this .#list = $("<ul></ul>")
         .appendTo (this .output)
         .addClass (["library-list", "materials"]);

      const
         canvas  = $("<x3d-canvas preserveDrawingBuffer='true' xrSessionMode='NONE'></x3d-canvas>"),
         browser = canvas .prop ("browser"),
         scene   = await browser .createX3DFromURL (new X3D .MFString (`file://${__dirname}/../assets/X3D/Materials.x3d`));

      // Buttons

      const buttons = $("<li></li>")
         .appendTo (this .#list);

      this .#physicalButton = $("<input></input>")
         .attr ("title", _("Requires an EnvironmentLight node."))
         .attr ("type", "checkbox")
         .attr ("id", "use-physical-material")
         .prop ("checked", this .config .global .convertToPhysical)
         .on ("change", () => this .#rendering = this .onChangeMaterials ())
         .appendTo (buttons);

      $("<label></label>")
         .attr ("title", _("Requires an EnvironmentLight node."))
         .attr ("for", "use-physical-material")
         .text (_("Create Physical Material"))
         .appendTo (buttons);

      // Materials

      const
         materials = scene .getExportedNode ("Materials"),
         nodes     = [ ];

      for (const [g, group] of materials .children .entries ())
      {
         $("<li></li>")
            .addClass ("component")
            .text (group .getNodeName ())
            .appendTo (this .#list);

         for (const [c, node] of group .children .entries ())
         {
            const material = node .children [0] .appearance .material;

            nodes .push ($("<li></li>")
               .addClass (["node", "icon"])
               .attr ("title", material .getNodeDisplayName ())
               .attr ("group", g)
               .attr ("child", c)
               .append ($("<span></span>")
                  .addClass ("text")
                  .text (`${group .getNodeName ()} ${c + 1}`))
               .appendTo (this .#list)
               .on ("dblclick", () => this .importMaterial (material .getNodeName ())));
         }
      }

      browser .dispose ();
      canvas .remove ();

      this .#rendering = this .onChangeMaterials ();
   }

   importMaterial (name)
   {
      const material = this .#scene .getNamedNode (name);

      this .importX3D (material .getNodeName (), material .toXMLString ());
   }

   async onChangeMaterials ()
   {
      this .#cancelRendering = true;

      await this .#rendering;

      this .#cancelRendering = false;

      this .config .global .convertToPhysical = this .#physicalButton .is (":checked");

      const
         canvas  = $("<x3d-canvas preserveDrawingBuffer='true' xrSessionMode='NONE'></x3d-canvas>"),
         browser = canvas .prop ("browser"),
         scene   = await browser .createX3DFromURL (new X3D .MFString (`file://${__dirname}/../assets/X3D/Materials.x3d`));

      scene .addComponent (browser .getComponent ("X_ITE"));

      this .#scene = scene;

      const
         materials = scene .getExportedNode ("Materials"),
         viewpoint = scene .getExportedNode ("Viewpoint");

      // Create icons.

      canvas
         .css ({ "position": "absolute", "visibility": "hidden" })
         .prependTo ($("body"));

      await browser .resize (256, 256);
      await browser .replaceWorld (scene);

      for (const element of Array .from (this .output .find (".node"), e => $(e)))
      {
         if (this .#cancelRendering)
            break;

         const
            group      = element .attr ("group"),
            child      = element .attr ("child"),
            section    = materials .children [group],
            node       = section .children [child],
            appearance = node .children [0] .appearance;

         if (this .config .global .convertToPhysical)
         {
            const material = Editor .convertPhongToPhysical (scene, appearance .material, null);

            scene .updateNamedNode (appearance .material .getNodeName (), material);

            appearance .material = material;
         }

         // console .log (appearance .material .getNodeName ());

         materials .whichChoice = group;
         section   .whichChoice = child;

         viewpoint .position .x = node .translation .x;
         viewpoint .position .y = node .translation .y;
         viewpoint .position .z = 2.65;

         await browser .nextFrame ();

         element .css ("background-image", `url(${canvas [0] .toDataURL ()})`);
      }

      browser .dispose ();
      canvas .remove ();
   }
};
