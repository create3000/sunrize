"use strict";

const
   X3D = require ("../X3D"),
   $   = require ("jquery");

class VideoParser extends X3D .X3DParser
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

      if (!worldURL .pathname .match (/\.(?:mp4|webm|ogg)$/i))
         return;

      return true;
   }

   parseIntoScene (resolve, reject)
   {
      this .video ()
         .then (resolve)
         .catch (reject);
   }

   async video ()
   {
      const
         browser = this .getBrowser (),
         scene   = this .getScene (),
         video   = $("<video></video>");

      await new Promise ((resolve, reject) => video
         .on ("loadeddata", resolve)
         .on ("abort error", event => reject (new Error (event .type)))
         .prop ("crossOrigin", "Anonymous")
         .prop ("preload", "auto")
         .attr ("src", scene .worldURL));

      scene .setEncoding ("VIDEO");
      scene .setProfile (browser .getProfile ("Interchange"));
      scene .addComponent (browser .getComponent ("Geometry2D", 2));

      await this .loadComponents ();

      // Rectangle

      const
         transformNode  = scene .createNode ("Transform"),
         shapeNode      = scene .createNode ("Shape"),
         appearanceNode = scene .createNode ("Appearance"),
         textureNode    = scene .createNode ("MovieTexture"),
         rectangleNode  = scene .createNode ("Rectangle2D"),
         soundNode      = scene .createNode ("Sound");

      textureNode .url     = new X3D .MFString (scene .worldURL);
      textureNode .loop    = true;
      textureNode .repeatS = false;
      textureNode .repeatT = false;

      appearanceNode .texture = textureNode;

      rectangleNode .size .x = video .prop ("videoWidth")  / 72 * 0.0254;
      rectangleNode .size .y = video .prop ("videoHeight") / 72 * 0.0254;

      shapeNode .appearance = appearanceNode;
      shapeNode .geometry   = rectangleNode;

      soundNode .source = textureNode;

      transformNode .children .push (shapeNode, soundNode);

      scene .rootNodes .push (transformNode);

      // Name

      const
         worldURL = new URL (this .getScene () .worldURL),
         name     = worldURL .pathname .match (/([^\/]+)\.[^.]+$/);

      if (name)
         scene .addNamedNode (this .sanitizeName (decodeURIComponent (name [1])), transformNode);

      return scene;
   }
}

module .exports = VideoParser;
