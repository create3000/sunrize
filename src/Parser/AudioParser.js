"use strict";

const
   X3D = require ("../X3D"),
   $   = require ("jquery");

class AudioParser extends X3D .X3DParser
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

      if (!worldURL .pathname .match (/\.(?:mp3|wav)$/i))
         return;

      return true;
   }

   parseIntoScene (resolve, reject)
   {
      this .audio ()
         .then (resolve)
         .catch (reject);
   }

   async audio ()
   {
      const
         browser = this .getBrowser (),
         scene   = this .getScene ();

      scene .setEncoding ("AUDIO");
      scene .setProfile (browser .getProfile ("Interchange"));
      scene .addComponent (browser .getComponent ("Sound"));

      await this .loadComponents ();

      // Rectangle

      const
         soundNode     = scene .createNode ("Sound"),
         audioClipNode = scene .createNode ("AudioClip");

      audioClipNode .url  = new X3D .MFString (scene .worldURL);
      audioClipNode .loop = true;

      soundNode .source = audioClipNode;

      scene .rootNodes .push (soundNode);

      // Name

      const
         worldURL = new URL (this .getScene () .worldURL),
         name     = worldURL .pathname .match (/([^\/]+)\.[^.]+$/);

      if (name)
      {
         audioClipNode .description = decodeURIComponent (name [1]);

         scene .addNamedNode (this .sanitizeName (decodeURIComponent (name [1])), soundNode);
      }

      return scene;
   }
}

module .exports = AudioParser;
