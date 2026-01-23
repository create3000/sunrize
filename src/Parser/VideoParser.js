"use strict";

const
   X3D  = require ("../X3D"),
   url  = require ("url"),
   path = require ("path");

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

      if (!worldURL .pathname .match (/\.(?:mp4|webm|ogv)$/i))
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
         scene   = this .getScene ();

      scene .setEncoding ("VIDEO");
      scene .setProfile (browser .getProfile ("Interchange"));
      scene .updateComponent (browser .getComponent ("Geometry2D", 1));
      scene .updateComponent (browser .getComponent ("Sound", 1));

      await this .loadComponents ();

      // Rectangle

      const
         transformNode  = scene .createNode ("Transform"),
         shapeNode      = scene .createNode ("Shape"),
         appearanceNode = scene .createNode ("Appearance"),
         textureNode    = scene .createNode ("MovieTexture"),
         rectangleNode  = scene .createNode ("Rectangle2D"),
         soundNode      = scene .createNode ("Sound");

      textureNode .url     = new X3D .MFString (this .getURL (scene .worldURL));
      textureNode .loop    = true;
      textureNode .repeatS = false;
      textureNode .repeatT = false;

      await textureNode .getValue () .loading ();

      appearanceNode .texture = textureNode;

      rectangleNode .size .x = textureNode .getValue () .getWidth ()  / 72 * 0.0254;
      rectangleNode .size .y = textureNode .getValue () .getHeight () / 72 * 0.0254;

      shapeNode .appearance = appearanceNode;
      shapeNode .geometry   = rectangleNode;

      soundNode .source = textureNode;

      transformNode .children .push (shapeNode, soundNode);

      scene .rootNodes .push (transformNode);

      // Name

      const
         worldURL = new URL (scene .worldURL),
         name     = worldURL .pathname .match (/([^\/]+)\.[^.]+$/);

      if (name)
      {
         textureNode .description = decodeURIComponent (name [1]);

         scene .addNamedNode (this .sanitizeName (decodeURIComponent (name [1])), transformNode);
      }

      return scene;
   }

   getURL (worldURL)
   {
      try
      {
         return encodeURIComponent (path .basename (url .fileURLToPath (worldURL)));
      }
      catch
      {
         return worldURL;
      }
   }
}

module .exports = VideoParser;
