"use strict";

const
   $           = require ("jquery"),
   X3D         = require ("../X3D"),
   LibraryPane = require ("./LibraryPane"),
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
         scene   = await browser .createX3DFromURL (new X3D .MFString (`file://${__dirname}/Materials.x3d`));

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
               .on ("click", () => this .importMaterial (material .getNodeName ())));
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
         scene   = await browser .createX3DFromURL (new X3D .MFString (`file://${__dirname}/Materials.x3d`));

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
            const material = MaterialsLibrary .convertPhongToPhysical (scene, appearance .material);

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

   static convertPhongToPhysical (executionContext, phong)
   {
      let
         browser           = executionContext .getBrowser (),
         physical          = executionContext .createNode ("PhysicalMaterial"),
         baseColor         = phong .diffuseColor .sRGBToLinear (),
         specularColor     = phong .specularColor .sRGBToLinear (),
         specularIntensity = Math .max (... specularColor),
         metallic          = Math .min (Math .max ((specularIntensity - 0.04) / (1.0 - 0.04), 0), 1) * 0.5,
         roughness         = 1 - phong .shininess,
         emissiveColor     = phong .emissiveColor .sRGBToLinear (),
         transparency      = phong .transparency,
         transmission      = transparency ** (1/3);

      if ([... specularColor] .some (Boolean) && roughness)
      {
         if (!executionContext .hasComponent ("X_ITE"))
            executionContext .addComponent (browser .getComponent ("X_ITE"));

         const specularMaterial = executionContext .createNode ("SpecularMaterialExtension");

         specularMaterial .specularColor    = specularColor;
         specularMaterial .specularStrength = 10 * roughness;

         physical .extensions .push (specularMaterial);

         metallic  *= 0.1;
         roughness *= 0.5;
      }

      if (transparency)
      {
         if (!executionContext .hasComponent ("X_ITE"))
            executionContext .addComponent (browser .getComponent ("X_ITE"));

         const transmissionMaterial = executionContext .createNode ("TransmissionMaterialExtension");

         transmissionMaterial .transmission = transmission;

         physical .extensions .push (transmissionMaterial);

         roughness *= 0.5 * (1 - transparency);
      }

      physical .baseColor     = baseColor;
      physical .metallic      = metallic;
      physical .roughness     = roughness;
      physical .emissiveColor = emissiveColor;

      return physical;
   }
};
