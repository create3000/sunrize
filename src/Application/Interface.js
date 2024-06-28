"use strict";

const
   $           = require ("jquery"),
   url         = require ("url"),
   md5         = require ("md5"),
   X3D         = require ("../X3D"),
   CSS         = require ("../Application/CSS"),
   DataStorage = require ("./DataStorage");

require ("../Tools");
require ("../Bits/Highlight");

Object .assign ($,
{
   sleep (ms)
   {
      return new Promise (resolve => setTimeout (resolve, ms));
   },
   try (callback, logError = false)
   {
      try
      {
         return callback ();
      }
      catch (error)
      {
         if (logError)
            console .error (error .message);
      }
   },
});

module .exports = class Interface
{
   static #interfaces   = new Set ();
   static #initialScene = X3D .getBrowser ("#browser") .currentScene;

   constructor (namespace)
   {
      Interface .#interfaces .add (this);

      this .namespace      = namespace;
      this .config         = { };
      this .config .global = this .#createGlobalConfig ();
      this .config .file   = this .#createFileConfig ("");
      this .config .last   = this .config .file;

      $(window) .on ("unload", () => this .set_browser_initialized ());
      this .browser .addBrowserCallback (this, X3D .X3DConstants .INITIALIZED_EVENT, this .set_browser_initialized .bind (this));
      CSS .colorScheme .addEventListener ("change", event => this .colorScheme (!! event .matches));
   }

   setup ()
   {
      this .initialize ();

      // Configure

      this .set_browser_initialized ();
   }

   initialize () { }

   static #idMap     = new WeakMap ();
   static #idCounter = 0;

   static getId (object)
   {
      const id = Interface .#idMap .get (object);

      if (id !== undefined)
         return id;

      Interface .#idMap .set (object, ++ Interface .#idCounter);

      return Interface .#idCounter;
   }

   get id ()
   {
      return Interface .getId (this);
   }

   get browser ()
   {
      return X3D .getBrowser ("#browser");
   }

   get filePath ()
   {
      const worldURL = this .browser .currentScene .worldURL;

      // New, unsaved or remote file.
      if (location .href === worldURL || !worldURL .startsWith ("file:"))
         return undefined;

      return url .fileURLToPath (worldURL);
   }

   set filePath (value)
   {
      const
         oldFilePath = this .filePath ?? this .fieldId ?? this .browser .getWorldURL (),
         newWorldURL = value ? url .pathToFileURL (value) .href : location .href;

      this .browser .currentScene .setWorldURL (newWorldURL);

      this .updateFileConfigs (oldFilePath, value);
   }

   get fileId ()
   {
      const
         location = new URL (window .location),
         id       = new URL (location .searchParams .get ("url"));

      if (id .protocol !== "id:")
         return undefined;

      return id .pathname;
   }

   get isInitialScene ()
   {
      return this .browser .currentScene === Interface .#initialScene;
   }

   /**
    *
    * @param {string} event
    */
   set_browser_initialized ()
   {
      this .config .last = this .config .file;
      this .config .file = this .#createFileConfig ();

      this .configure ();
      this .colorScheme (!! CSS .colorScheme .matches);
   }

   /**
    * @param {object} event
    */
   colorScheme (shouldUseDarkColors) { }

   /**
    *
    * @param {string} namespace
    * @returns A new data storage
    */
   #createGlobalConfig (namespace = this .namespace)
   {
      return new DataStorage (localStorage, namespace);
   }

   /**
    *
    * @param {string} filePath path|URL
    * @returns {DataStorage}
    */
   #createFileConfig (filePath, global = this .config .global)
   {
      if (!filePath && this .isInitialScene)
         return this .config .global .addNameSpace ("default.");

      filePath ??= this .filePath ?? this .fileId ?? this .browser .getWorldURL ();

      return global .addNameSpace (md5 (filePath) + ".");
   }

   /**
    *
    * @param {string} from path|URL
    * @param {string} to path|URL
    */
   updateFileConfigs (from, to)
   {
      const
         fromHash = `.${md5 (from)}.`,
         toHash   = `.${md5 (to)}.`;

      const config = new DataStorage (localStorage, "Sunrize.");

      for (const key of Object .keys (config))
      {
         if (!key .includes (fromHash))
            continue;

         const
            value  = config [key],
            newKey = key .replace (fromHash, toHash);

         config [newKey] = value;
      }

      for (const other of Interface .#interfaces)
      {
         const
            oldFileConfig = other .config .file,
            newFileConfig = other .#createFileConfig (to);

         newFileConfig .setDefaultValues (oldFileConfig .getDefaultValues ());

         other .config .file = newFileConfig;

         this .browser .currentScene .setUserData (other .config .global, newFileConfig);
      }
   }

   configure () { }

   linearTosRGB (node, color)
   {
      if (this .browser .getBrowserOption ("ColorSpace") === "SRGB")
         return color;

      if (this .browser .getBrowserOption ("ColorSpace") === "LINEAR_WHEN_PHYSICAL_MATERIAL" && !this .isPhysical (node))
      {
         return color;
      }

      const args = [
         Math .pow (color .r, 1 / 2.2),
         Math .pow (color .g, 1 / 2.2),
         Math .pow (color .b, 1 / 2.2),
      ];

      if (color .a !== undefined)
         args .push (color .a);

      return new (color .constructor) (... args);
   }

   sRGBtoLinear (node, color)
   {
      if (this .browser .getBrowserOption ("ColorSpace") === "SRGB")
         return color;

      if (this .browser .getBrowserOption ("ColorSpace") === "LINEAR_WHEN_PHYSICAL_MATERIAL" && !this .isPhysical (node))
      {
         return color;
      }

      const args = [
         Math .pow (color .r, 2.2),
         Math .pow (color .g, 2.2),
         Math .pow (color .b, 2.2),
      ];

      if (color .a !== undefined)
         args .push (color .a);

      return new (color .constructor) (... args);
   }

   isPhysical (node)
   {
      if (node .getType () .includes (X3D .X3DConstants .PhysicalMaterial))
         return true;

      if (node .getType () .includes (X3D .X3DConstants .X3DMaterialExtensionNode))
         return true;

      if (node .getType () .includes (X3D .X3DConstants .SpecularGlossinessMaterial))
         return true;

      return false;
   }
};
