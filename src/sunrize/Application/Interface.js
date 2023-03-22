"use strict"

const
   $           = require ("jquery"),
   url         = require ("url"),
   md5         = require ("md5"),
   X3D         = require ("../X3D"),
   DataStorage = require ("./DataStorage")

require ("../Bits/Highlight")
require ("../Bits/Beep")

module .exports = class Interface
{
   static #interfaces = new Set ()

   constructor (namespace)
   {
      Interface .#interfaces .add (this)

      this .namespace    = namespace
      this .config       = { global: this .createGlobalConfig () }
      this .config .file = this .createFileConfig ()

      this .browser .addBrowserCallback (this, this .setBrowserEvent .bind (this))
   }

   setup ()
   {
      this .initialize ()

      this .setBrowserEvent (X3D .X3DConstants .INITIALIZED_EVENT)
   }

   initialize () { }

   static #idMap     = new WeakMap ()
   static #idCounter = 0

   static getId (object)
   {
      const id = Interface .#idMap .get (object)

      if (id !== undefined)
         return id

      Interface .#idMap .set (object, ++ Interface .#idCounter)

      return Interface .#idCounter
   }

   get id ()
   {
      return Interface .getId (this)
   }

   get browser ()
   {
      return X3D .getBrowser ("#browser")
   }

   get filePath ()
   {
      const worldURL = this .browser .currentScene .worldURL

      // New unsaved file.
      if (location .href === worldURL || !worldURL .startsWith ("file:"))
         return undefined
      else
         return url .fileURLToPath (worldURL)
   }

   set filePath (value)
   {
      const
         oldWorldURL = this .browser .currentScene .worldURL,
         newWorldURL = value ? url .pathToFileURL (value) .href : location .href

      this .browser .currentScene .setWorldURL (newWorldURL)

      this .updateFileConfigs (oldWorldURL, newWorldURL)
   }

   /**
    *
    * @param {string} event
    */
   setBrowserEvent (event)
   {
      if (event !== X3D .X3DConstants .INITIALIZED_EVENT)
         return

      this .config .file = this .createFileConfig (this .browser .getWorldURL ())

      this .configure ()
   }

   /**
    *
    * @param {string} namespace
    * @returns A new data storage
    */
   createGlobalConfig (namespace = this .namespace)
   {
      return new DataStorage (localStorage, namespace)
   }

   /**
    *
    * @param {string} url
    * @returns {DataStorage}
    */
   createFileConfig (url = "", global = this .config .global)
   {
      return global .addNameSpace (md5 (url) + ".")
   }

   /**
    *
    * @param {string} from URL
    * @param {string} to URL
    */
   updateFileConfigs (from, to)
   {
      const
         fromHash = `.${md5 (from)}.`,
         toHash   = `.${md5 (to)}.`

      const config = new DataStorage (localStorage, "Sunrize.")

      for (const key of Object .keys (config))
      {
         if (!key .includes (fromHash))
            continue

         const
            value  = config [key],
            newKey = key .replace (fromHash, toHash)

         config [newKey] = value
      }

      for (const other of Interface .#interfaces)
         other .config .file = other .createFileConfig (to)
   }

   configure () { }
}
