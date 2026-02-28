"use strict";

const
   $           = require ("jquery"),
   X3D         = require ("../X3D"),
   LibraryPane = require ("./LibraryPane"),
   _           = require ("../Application/GetText");

module .exports = class Materials extends LibraryPane
{
   id          = "MATERIALS";
   description = "Materials";

   #list;
   #pbrButton;

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

      scene .addComponent (browser .getComponent ("X_ITE"));

      const buttons = $("<li></li>")
         .appendTo (this .#list);

      // Buttons

      this .#pbrButton = $("<input></input>")
         .attr ("title", _("Requires an EnvironmentLight."))
         .attr ("type", "checkbox")
         .attr ("id", "use-physical-material")
         .prop ("checked", this .config .global .convertToPBR)
         .on ("change", () => this .config .global .convertToPBR = this .#pbrButton .is (":checked"))
         .appendTo (buttons);

      $("<label></label>")
         .attr ("title", _("Requires an EnvironmentLight."))
         .attr ("for", "use-physical-material")
         .text (_("Create Physical Material"))
         .appendTo (buttons);

      // Materials

      const
         materials = scene .getExportedNode ("Materials"),
         viewpoint = scene .getExportedNode ("Viewpoint"),
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
               .attr ("group", g)
               .attr ("child", c)
               .append ($("<span></span>")
                  .addClass ("text")
                  .text (`${group .getNodeName ()} ${c + 1}`))
               .appendTo (this .#list)
               .on ("dblclick", () => this .importMaterial (material)));
         }
      }

      // Create icons.

      canvas
         .css ({ "position": "absolute", "visibility": "hidden" })
         .prependTo ($("body"));

      await browser .resize (256, 256);
      await browser .replaceWorld (scene);

      for (const element of Array .from (this .output .find (".node"), e => $(e)))
      {
         const
            group   = element .attr ("group"),
            child   = element .attr ("child"),
            section = materials .children [group],
            node    = section .children [child];

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

   importMaterial (phong)
   {
      const
         pbr      = this .#pbrButton .is (":checked"),
         material = pbr ? this .convertPhongToPBR (phong .getValue () .getExecutionContext (), phong) : phong;

      this .importX3D (material .getNodeName (), material .toXMLString ());
   }

   convertPhongToPBR (executionContext, phong)
   {
      let
         physical          = executionContext .createNode ("PhysicalMaterial"),
         baseColor         = phong .diffuseColor .sRGBToLinear (),
         specularColor     = [... phong .specularColor .sRGBToLinear ()],
         specularIntensity = Math .max (... specularColor),
         metallic          = Math .min (Math .max ((specularIntensity - 0.04) / (1.0 - 0.04), 0), 1) * 0.5,
         roughness         = 1 - phong .shininess,
         emissiveColor     = phong .emissiveColor .sRGBToLinear (),
         transparency      = phong .transparency,
         transmission      = transparency ** (1/3);

      if (specularColor .some (Boolean) && phong .shininess)
      {
         const specularMaterial = executionContext .createNode ("SpecularMaterialExtension");

         specularMaterial .specularColor    = specularColor;
         specularMaterial .specularStrength = 10 * phong .shininess;

         physical .extensions .push (specularMaterial);
      }

      if (transparency)
      {
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
