"use strict"

const
   $           = require ("jquery"),
   url         = require ("url"),
   md5         = require ("md5"),
   X3D         = require ("../X3D"),
   CSS         = require ("../Application/CSS"),
   DataStorage = require ("./DataStorage")

require ("../Bits/Highlight")
require ("../Bits/Beep")

module .exports = class Interface
{
   static #interfaces   = new Set ()
   static #initialScene = X3D .getBrowser ("#browser") .currentScene

   constructor (namespace)
   {
      Interface .#interfaces .add (this)

      this .namespace    = namespace
      this .globalConfig = this .#createGlobalConfig ()
      this .fileConfig   = this .#createFileConfig ("")

      this .browser .addBrowserCallback (this, X3D .X3DConstants .INITIALIZED_EVENT, this .browserInitialized .bind (this))
      CSS .colorScheme .addEventListener ("change", event => this .colorScheme (!! event .matches))
   }

   setup ()
   {
      this .initialize ()

      // Configure

      this .browserInitialized (X3D .X3DConstants .INITIALIZED_EVENT)
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

      // New, unsaved or remote file.
      if (location .href === worldURL || !worldURL .startsWith ("file:"))
         return undefined

      return url .fileURLToPath (worldURL)
   }

   set filePath (value)
   {
      const
         oldFilePath = this .filePath ?? this .fieldId ?? this .browser .getWorldURL (),
         newWorldURL = value ? url .pathToFileURL (value) .href : location .href

      this .browser .currentScene .setWorldURL (newWorldURL)

      this .updateFileConfigs (oldFilePath, value)
   }

   get fileId ()
   {
      const
         location = new URL (window .location),
         id       = new URL (location .searchParams .get ("url"))

      if (id .protocol !== "id:")
         return undefined

      return id .pathname
   }

   /**
    *
    * @param {string} event
    */
   browserInitialized (event)
   {
      this .fileConfig = this .#createFileConfig ()

      this .browser .currentScene .setUserData (this .globalConfig, this .fileConfig)

      this .configure ()
      this .colorScheme (!! CSS .colorScheme .matches)
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
      return new DataStorage (localStorage, namespace)
   }

   /**
    *
    * @param {string} filePath path|URL
    * @returns {DataStorage}
    */
   #createFileConfig (filePath, global = this .globalConfig)
   {
      if (!filePath && this .browser .currentScene === Interface .#initialScene)
         return this .globalConfig .addNameSpace ("default.")

      filePath ??= this .filePath ?? this .fileId ?? this .browser .getWorldURL ()

      return global .addNameSpace (md5 (filePath) + ".")
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @returns {DataStorage}
    */
   getFileConfig (executionContext)
   {
      return executionContext .getUserData (this .globalConfig)
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
      {
         const
            oldFileConfig = other .fileConfig,
            newFileConfig = other .#createFileConfig (to)

         newFileConfig .addDefaultValues (oldFileConfig .getDefaultValues ())

         other .fileConfig = newFileConfig

         this .browser .currentScene .setUserData (other .globalConfig, newFileConfig)
      }
   }

   configure () { }
}
