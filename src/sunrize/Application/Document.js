"use strict"

const
   $ = window .jQuery = require ("jquery"),
   $ui                = require ("jquery-ui-dist/jquery-ui"),
   electron           = require ("electron"),
   fs                 = require ("fs"),
   path               = require ("path"),
   ResizeSensor       = require ("css-element-queries/src/ResizeSensor"),
   X3D                = require ("../X3D"),
   Interface          = require ("./Interface"),
   Splitter           = require ("../Controls/Splitter"),
   Dashboard          = require ("./Dashboard"),
   Footer             = require ("./Footer"),
   Sidebar            = require ("./Sidebar"),
   Editor             = require ("../Undo/Editor"),
   UndoManager        = require ("../Undo/UndoManager"),
   _                  = require ("./GetText")

module .exports = new class Document extends Interface
{
   constructor ()
   {
      super ("Sunrize.Document.")

      // Layout

      this .verticalSplitter   = new Splitter ($("#vertical-splitter"), "vertical")
      this .horizontalSplitter = new Splitter ($("#horizontal-splitter"), "horizontal")
      this .secondaryToolbar   = new Dashboard ($("#secondary-toolbar"))
      this .footer             = new Footer ($("#footer"))
      this .sidebar            = new Sidebar ($("#sidebar"))

      // Setup

      this .setup ()
   }

   /**
    *
    */
   async initialize ()
   {
      await this .browser .loadComponents (this .browser .getComponent ("Grouping"))

      this .browser .updateConcreteNode (require ("../Components/Grouping/StaticGroup"))

      await this .restoreFile ()

      UndoManager .shared .addInterest (this, () => this .undoManager ())

      // Actions

      electron .ipcRenderer .on ("activate", () => this .activate ())

      electron .ipcRenderer .on ("open-files",       (event, urls)     => this .openFile (urls [0])) // DEBUG
      electron .ipcRenderer .on ("save-file",        (event, force)    => this .saveFile (force))
      electron .ipcRenderer .on ("save-file-as",     (event, filePath) => this .saveFileAs (filePath))
      electron .ipcRenderer .on ("save-copy-as",     (event, filePath) => this .saveCopyAs (filePath))
      electron .ipcRenderer .on ("auto-save",        (event, value)    => this .autoSave = value)
      electron .ipcRenderer .on ("export-as",        (event, filePath) => this .exportAs (filePath))
      electron .ipcRenderer .on ("scene-properties", (event)           => require ("../Editors/SceneProperties") .open ())
      electron .ipcRenderer .on ("close",            (event)           => this .close ())

      electron .ipcRenderer .on ("undo",   () => this .undo ())
      electron .ipcRenderer .on ("redo",   () => this .redo ())
      electron .ipcRenderer .on ("cut",    () => this .cut ())
      electron .ipcRenderer .on ("copy",   () => this .copy ())
      electron .ipcRenderer .on ("paste",  () => this .paste ())
      electron .ipcRenderer .on ("delete", () => this .delete ())

      electron .ipcRenderer .on ("primitive-quality",  (event, value) => this .setPrimitiveQuality (value))
      electron .ipcRenderer .on ("texture-quality",    (event, value) => this .setTextureQuality (value))
      electron .ipcRenderer .on ("display-rubberband", (event, value) => this .displayRubberband (value))
      electron .ipcRenderer .on ("display-timings",    (event, value) => this .displayTimings (value))
      electron .ipcRenderer .on ("show-library",       (event)        => require ("../Editors/Library") .open (this .browser .currentScene))

      electron .ipcRenderer .on ("browser-size", () => this .browserSize .open ())

      $(window)
         .on ("focusin",  () => this .onfocus ())
         .on ("focusout", () => this .onfocus ())

      this .fullname     = await electron .ipcRenderer .invoke ("fullname")
      this .browserSize  = require ("../Editors/BrowserSize")
      this .resizeSensor = new ResizeSensor ($("#browser-frame"), this .onresize .bind (this))

      // Change undo menu items.

      this .activate ()
   }

   configure ()
   {
      this .config .file .addDefaultValues ({ inferProfileAndComponents: true })

      this .fileSaveFileTypeWarning = false
   }

   activate ()
   {
      // When tab is activated/selected.
      this .undoManager ()
   }

   activeElement = null

   onfocus ()
   {
      this .activeElement = document .activeElement ? $(document .activeElement) : null

      electron .ipcRenderer .send ("change-menu", {
         defaultEditMenu: this .activeElementIsInputOrOutput (),
      })
   }

   activeElementIsInputOrOutput ()
   {
      if (!this .activeElement)
         return false

      const activeElement = this .activeElement

      if (activeElement .is ("input"))
         return activeElement .attr ("type") === undefined || activeElement .attr ("type") === "text"

      if (activeElement .is ("textarea"))
         return true

      if (activeElement .is (".input, .output"))
         return true

      return false
   }

   async restoreFile ()
   {
      const
         location = new URL (window .location),
         fileURL  = location .searchParams .get ("url") || ""

      if (fileURL .startsWith ("id:"))
      {
         const
            id       = fileURL .substring (3),
            contents = this .config .global .addNameSpace ("unsaved.") [id]

         if (contents)
            await this .openFile (encodeURI (`data:model/x3d,${contents}`))
         else
            await this .openFile ()
      }
      else
      {
         await this .openFile (fileURL)
      }
   }

   /**
    *
    * @param {string} fileURL
    * @returns {Promise<void>} Promise
    */
   async openFile (fileURL)
   {
      try
      {
         if (fileURL)
            await this .browser .loadURL (new X3D .MFString (fileURL))
         else
            await this .browser .replaceWorld (null)
      }
      catch (error)
      {
         console .log (error)
      }
   }

   /**
    *
    * @param {boolean} force force save
    */
   saveFile (force = false)
   {
      this .footer .scriptEditor ?.apply ()

      if (!UndoManager .shared .saveNeeded && !force)
         return

      const scene = this .browser .currentScene

      // Infer profile and components.

      if (this .config .file .inferProfileAndComponents ?? true)
         Editor .inferProfileAndComponents (scene, new UndoManager ())

      // Add default meta data.

      const pkg = require ("../../../package.json")

      if (!scene .getMetaData ("created"))
         scene .setMetaData ("created", new Date () .toUTCString ())

      scene .setMetaData ("comment", `Rise and Shine`)
      scene .setMetaData ("creator", this .fullname)
      scene .setMetaData ("generator", `${pkg .productName} V${pkg .version}, ${pkg .homepage}`)
      scene .setMetaData ("identifier", scene .worldURL .startsWith ("data:") ? scene .baseURL : scene .worldURL)
      scene .setMetaData ("modified", new Date () .toUTCString ())

      // Save source code.

      if (this .filePath)
      {
         if (path .extname (this .filePath) .match (/\.(?:wrl|wrz|wrl\.gz|vrml|gltf|glb|obj|stl|ply|svg)$/i))
         {
            if (!this .fileSaveFileTypeWarning)
               console .warn (`Cannot save ${this .filePath}. File type is not supported.`)

            this .fileSaveFileTypeWarning = true;
            return
         }

         fs .writeFileSync (this .filePath, Editor .getContents (scene, path .extname (this .filePath)))

         electron .ipcRenderer .send ("save-file", this .filePath)
      }
      else
      {
         const
            location = new URL (window .location),
            fileURL  = location .searchParams .get ("url"),
            id       = fileURL .substring (3)

         this .config .global .addNameSpace ("unsaved.") [id] = Editor .getContents (scene)
      }

      UndoManager .shared .saveNeeded = false

      electron .ipcRenderer .sendToHost ("saved", true)
   }

   /**
    *
    * @param {string} filePath
    */
   saveFileAs (filePath)
   {
      const
         scene       = this .browser .currentScene,
         oldWorldURL = scene .worldURL

      this .filePath = filePath

      Editor .rewriteURLs (scene, scene, oldWorldURL, scene .worldURL)

      this .saveFile (true)
   }

   /**
    *
    * @param {string} filePath
    */
   saveCopyAs (filePath)
   {
      const
         scene       = this .browser .currentScene,
         oldFilePath = this .filePath,
         oldWorldURL = scene .worldURL,
         undoManager = new UndoManager ()

      this .filePath = filePath

      const newWorldURL = scene .worldURL

      Editor .rewriteURLs (scene, scene, oldWorldURL, newWorldURL, undoManager)

      this .saveFile (true)

      undoManager .undo ()

      this .filePath = oldFilePath
   }

   get autoSave ()
   {
      return this .config .global .autoSave
   }

   set autoSave (value)
   {
      this .config .global .autoSave = value

      if (value)
         this .registerAutoSave ()
   }

   #saveTimeoutId = undefined

   registerAutoSave ()
   {
      if (!this .autoSave)
         return

      clearTimeout (this .#saveTimeoutId)

      this .#saveTimeoutId = setTimeout (() => this .saveFile (), 3000)
   }

   exportAs (filePath)
   {
      this .saveCopyAs (filePath)
   }

   /**
    *
    */
   close ()
   {
      this .saveFile ()

      electron .ipcRenderer .sendToHost ("closed")
   }

   undo ()
   {
      UndoManager .shared .undo ()
   }

   redo ()
   {
      UndoManager .shared .redo ()
   }

   undoManager ()
   {
      electron .ipcRenderer .send ("change-menu",
      {
         undoLabel: UndoManager .shared .undoLabel,
         redoLabel: UndoManager .shared .redoLabel,
      })

      electron .ipcRenderer .sendToHost ("saved", !UndoManager .shared .saveNeeded)

      if (UndoManager .shared .saveNeeded)
         this .registerAutoSave ()
   }

   cut ()
   {
      this .sidebar .outlineEditor .cutNodes ()
   }

   copy ()
   {
      this .sidebar .outlineEditor .copyNodes ()
   }

   paste ()
   {
      this .sidebar .outlineEditor .pasteNodes ()
   }

   delete ()
   {
      this .sidebar .outlineEditor .deleteNodes ()
   }

   /**
    *
    * @param {string} value
    */
   setPrimitiveQuality (value)
   {
      this .browser .setBrowserOption ("PrimitiveQuality", value)
      this .browser .setDescription ("Primitive Quality: " + value .toLowerCase ())
   }

   /**
    *
    * @param {string} value
    */
   setTextureQuality (value)
   {
      this .browser .setBrowserOption ("TextureQuality", value)
      this .browser .setDescription ("Texture Quality: " + value .toLowerCase ())
   }

   /**
    *
    * @param {boolean} value
    */
   displayRubberband (value)
   {
      this .browser .setBrowserOption ("Rubberband", value)
      this .browser .setDescription ("Rubberband: " + (value ? "on" : "off"))
   }

   /**
    *
    * @param {boolean} value
    */
   displayTimings (value)
   {
      this .browser .setBrowserOption ("Timings", value)
   }

   /**
    * Change browser size according to aspect-ratio
    */
   onresize ()
   {
      const
         enabled          = this .browserSize .config .file .enabled,
         numerator        = this .browserSize .config .file .numerator,
         denominator      = this .browserSize .config .file .denominator,
         aspectRatio      = numerator / denominator,
         frameAspectRatio = $("#browser-frame") .width () / $("#browser-frame") .height (),
         element          = this .browser .getElement ()

      if (enabled && aspectRatio)
      {
         element .css ({ "aspect-ratio": `${numerator} / ${denominator}` })

         if (aspectRatio > frameAspectRatio)
            element .css ({ "width": "100%", "height": "auto" })
         else
            element .css ({ "width": "auto", "height": "100%" })
      }
      else
      {
         element .css ({ "aspect-ratio": "unset", "width": "100%", "height": "100%" })
      }
   }
}
