"use strict";

const
   X3D = require ("../X3D"),
   $   = require ("jquery");

class ImageParser extends X3D .X3DParser
{
   constructor (scene)
   {
      super (scene);
   }

   getEncoding ()
   {
      return "ARRAY_BUFFER";
   }

   setInput (input)
   { }

   isValid ()
   {
      const worldURL = new URL (this .getScene () .worldURL);

      if (!worldURL .pathname .match (/\.(?:png|jpg|jpeg|gif|webp)$/i))
         return;

      return true;
   }

   parseIntoScene (resolve, reject)
   {
      this .image ()
         .then (resolve)
         .catch (reject);
   }

   async image ()
   {
      const
         browser = this .getBrowser (),
         scene   = this .getScene (),
         image   = $("<img></img>");

      await new Promise ((resolve, reject) => image
         .on ("load", resolve)
         .on ("abort error", reject)
         .prop ("crossOrigin", "Anonymous")
         .attr ("src", scene .worldURL));

      scene .setEncoding ("IMAGE");
      scene .setProfile (browser .getProfile ("Interchange"));
      scene .addComponent (browser .getComponent ("Geometry2D", 2));

      await this .loadComponents ();

      // Rectangle

      const
         transformNode  = scene .createNode ("Transform"),
         shapeNode      = scene .createNode ("Shape"),
         appearanceNode = scene .createNode ("Appearance"),
         textureNode    = scene .createNode ("ImageTexture"),
         rectangleNode  = scene .createNode ("Rectangle2D");

      textureNode .url     = new X3D .MFString (scene .worldURL);
      textureNode .repeatS = false;
      textureNode .repeatT = false;

      appearanceNode .texture = textureNode;

      rectangleNode .size .x = image .prop ("width")  / 72 * 0.0254;
      rectangleNode .size .y = image .prop ("height") / 72 * 0.0254;

      shapeNode .appearance = appearanceNode;
      shapeNode .geometry   = rectangleNode;

      transformNode .children .push (shapeNode);

      scene .rootNodes .push (transformNode);

      // Name

      const
         worldURL = new URL (this .getScene () .worldURL),
         name     = worldURL .pathname .match (/([^\/]+)\.[^.]+$/);

      if (name)
         scene .addNamedNode (this .sanitizeName (name [1]), transformNode);

      return scene;
   }
}

module .exports = ImageParser;
