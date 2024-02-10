"use strict";

const
   $ = window .jQuery = require ("jquery"),
   $ui                = require ("jquery-ui-dist/jquery-ui"),
   electron           = require ("electron"),
   fs                 = require ("fs"),
   path               = require ("path"),
   X3D                = require ("../X3D"),
   Interface          = require ("./Interface"),
   Splitter           = require ("../Controls/Splitter"),
   Dashboard          = require ("./Dashboard"),
   Footer             = require ("./Footer"),
   Sidebar            = require ("./Sidebar"),
   Editor             = require ("../Undo/Editor"),
   UndoManager        = require ("../Undo/UndoManager"),
   _                  = require ("./GetText");

module .exports = class Document extends Interface
{
   constructor ()
   {
      super ("Sunrize.Document.");

      // Layout

      this .verticalSplitter   = new Splitter ($("#vertical-splitter"), "vertical");
      this .horizontalSplitter = new Splitter ($("#horizontal-splitter"), "horizontal");
      this .secondaryToolbar   = new Dashboard ($("#secondary-toolbar"));
      this .footer             = new Footer ($("#footer"));
      this .sidebar            = new Sidebar ($("#sidebar"));
   }

   /**
    *
    */
   async initialize ()
   {
      await this .restoreFile ();

      // Actions

      electron .ipcRenderer .on ("activate", () => this .activate ());

      electron .ipcRenderer .on ("open-files",       (event, urls)     => this .loadURL (urls [0])); // DEBUG
      electron .ipcRenderer .on ("save-file",        (event, force)    => this .saveFile (force));
      electron .ipcRenderer .on ("save-file-as",     (event, filePath) => this .saveFileAs (filePath));
      electron .ipcRenderer .on ("save-copy-as",     (event, filePath) => this .saveCopyAs (filePath));
      electron .ipcRenderer .on ("auto-save",        (event, value)    => this .autoSave = value);
      electron .ipcRenderer .on ("export-as",        (event, filePath) => this .exportAs (filePath));
      electron .ipcRenderer .on ("scene-properties", (event)           => require ("../Editors/SceneProperties") .open ());
      electron .ipcRenderer .on ("close",            (event)           => this .close ());

      electron .ipcRenderer .on ("undo",   () => this .undo ());
      electron .ipcRenderer .on ("redo",   () => this .redo ());
      electron .ipcRenderer .on ("cut",    () => this .cut ());
      electron .ipcRenderer .on ("copy",   () => this .copy ());
      electron .ipcRenderer .on ("paste",  () => this .paste ());
      electron .ipcRenderer .on ("delete", () => this .delete ());

      electron .ipcRenderer .on ("primitive-quality",  (event, value) => this .setPrimitiveQuality (value));
      electron .ipcRenderer .on ("texture-quality",    (event, value) => this .setTextureQuality (value));
      electron .ipcRenderer .on ("display-rubberband", (event, value) => this .setDisplayRubberband (value));
      electron .ipcRenderer .on ("display-timings",    (event, value) => this .setDisplayTimings (value));
      electron .ipcRenderer .on ("show-library",       (event)        => require ("../Editors/Library") .open (this .browser .currentScene));

      electron .ipcRenderer .on ("browser-size", () => this .browserSize .open ());
      electron .ipcRenderer .on ("grid", (event, typeName, visible) => this .setGridTool (typeName, visible));

      $(window)
         .on ("focusin",  () => this .onfocus ())
         .on ("focusout", () => this .onfocus ());

      this .fullname       = await electron .ipcRenderer .invoke ("fullname");
      this .browserSize    = require ("../Editors/BrowserSize");
      this .resizeObserver = new ResizeObserver (this .onresize .bind (this));

      this .resizeObserver .observe ($("#browser-frame") [0]);

      // Change undo menu items.

      UndoManager .shared .addInterest (this, () => this .undoManager ());

      this .browser .getBrowserOptions () .getField ("PrimitiveQuality") .addInterest ("set_primitiveQuality", this);
      this .browser .getBrowserOptions () .getField ("TextureQuality")   .addInterest ("set_textureQuality",   this);
      this .browser .getBrowserOptions () .getField ("Rubberband")       .addInterest ("set_rubberband",       this);
      this .browser .getBrowserOptions () .getField ("Timings")          .addInterest ("set_timings",          this);

      this .activate ();
   }

   configure ()
   {
      const grids = [
         "GridTool",
         "AngleGridTool",
         "AxonometricGridTool",
      ];

      this .fileConfig .setDefaultValues ({
         inferProfileAndComponents: true,
         primitiveQuality: "MEDIUM",
         textureQuality: "MEDIUM",
         rubberband: true,
         timings: false,
      });

      this .fileSaveFileTypeWarning = false;

      setTimeout (() => this .setPrimitiveQuality (this .fileConfig .primitiveQuality));
      this .setTextureQuality (this .fileConfig .textureQuality);
      this .setDisplayRubberband (this .fileConfig .rubberband);
      this .setDisplayTimings (this .fileConfig .timings);

      for (const typeName of grids)
      {
         const gridConfig = this .fileConfig .addNameSpace (`${typeName}.`);

         if (gridConfig .visible)
            this .setGridTool (typeName, gridConfig .visible);
      }
   }

   activate ()
   {
      // When tab is activated/selected.
      this .updateMenu ();
   }

   updateMenu ()
   {
      const menu = { };

      this .updateUndoMenus (menu);
      this .updatePrimitiveQualityMenu (menu);
      this .updateTextureQualityMenu (menu);
      this .updateTimingsMenu (menu);
      this .updateRubberbandMenu (menu);
      this .updateGridMenus (menu);

      electron .ipcRenderer .send ("change-menu", menu);
   }

   activeElement = null

   onfocus ()
   {
      this .activeElement = document .activeElement ? $(document .activeElement) : null;

      electron .ipcRenderer .send ("change-menu", {
         defaultEditMenu: this .activeElementIsInputOrOutput (),
      });
   }

   activeElementIsInputOrOutput ()
   {
      if (!this .activeElement)
         return false;

      const activeElement = this .activeElement;

      if (activeElement .is ("input"))
         return activeElement .attr ("type") === undefined || activeElement .attr ("type") === "text";

      if (activeElement .is ("textarea"))
         return true;

      if (activeElement .is (".input, .output"))
         return true;

      return false;
   }

   async restoreFile ()
   {
      $("body") .addClass ("modal");

      await this .browser .loadComponents (this .browser .getComponent ("Grouping"));

      this .browser .updateConcreteNode (require ("../Components/Grouping/StaticGroup"));

      if (this .fileId)
      {
         const contents = this .globalConfig .addNameSpace ("unsaved.") [this .fileId];

         if (contents)
            await this .loadURL (encodeURI (`data:model/x3d,${contents}`));
         else
            await this .loadURL ();
      }
      else
      {
         const
            location = new URL (window .location),
            fileURL  = location .searchParams .get ("url") || "";

         await this .loadURL (fileURL);
      }

      $("body") .removeClass ("modal");
   }

   /**
    *
    * @param {string} fileURL
    * @returns {Promise<void>} Promise
    */
   async loadURL (fileURL)
   {
      try
      {
         if (fileURL)
            await this .browser .loadURL (new X3D .MFString (fileURL));
         else
            await this .browser .replaceWorld (null);
      }
      catch (error)
      {
         // console .error (error);
      }
   }

   /**
    *
    * @param {boolean} force force save
    */
   saveFile (force = false)
   {
      this .footer .scriptEditor ?.apply ();

      if (!UndoManager .shared .saveNeeded && !force)
         return;

      const scene = this .browser .currentScene;

      // Infer profile and components.

      if (this .fileConfig .inferProfileAndComponents ?? true)
         Editor .inferProfileAndComponents (scene, new UndoManager ());

      // Add default meta data.

      const pkg = require ("../../package.json");

      if (!scene .getMetaData ("created"))
         scene .setMetaData ("created", new Date () .toUTCString ());

      scene .setMetaData ("comment", `Rise and Shine`);
      scene .setMetaData ("creator", this .fullname);
      scene .setMetaData ("generator", `${pkg .productName} V${pkg .version}, ${pkg .homepage}`);
      scene .setMetaData ("modified", new Date () .toUTCString ());

      // Save source code.

      if (this .filePath)
      {
         if (path .extname (this .filePath) .match (/\.(?:wrl|wrz|wrl\.gz|vrml|gltf|glb|obj|stl|ply|svg)$/i))
         {
            if (!this .fileSaveFileTypeWarning)
               console .warn (`Couldn't save '${this .filePath}'. File type is not supported.`);

            this .fileSaveFileTypeWarning = true;
            return;
         }

         fs .writeFile (this .filePath, Editor .getContents (scene, path .extname (this .filePath)), Function .prototype);

         electron .ipcRenderer .send ("add-recent-document", this .filePath);
      }
      else
      {
         const id = this .fileId;

         if (!id)
         {
            if (!this .fileSaveFileTypeWarning)
               console .warn (`Couldn't save '${this .browser .getWorldURL ()}'. The file is a remote file.`);

            this .fileSaveFileTypeWarning = true;
            return;
         }

         this .globalConfig .addNameSpace ("unsaved.") [id] = Editor .getContents (scene);
      }

      UndoManager .shared .saveNeeded = false;

      electron .ipcRenderer .sendToHost ("saved", true);
   }

   /**
    *
    * @param {string} filePath
    */
   saveFileAs (filePath)
   {
      const
         scene       = this .browser .currentScene,
         oldWorldURL = scene .worldURL;

      this .filePath = filePath;

      Editor .rewriteURLs (scene, scene, oldWorldURL, scene .worldURL);

      this .saveFile (true);
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
         undoManager = new UndoManager ();

      this .filePath = filePath;

      const newWorldURL = scene .worldURL;

      Editor .rewriteURLs (scene, scene, oldWorldURL, newWorldURL, undoManager);

      this .saveFile (true);

      undoManager .undo ();

      this .filePath = oldFilePath;
   }

   get autoSave ()
   {
      return this .globalConfig .autoSave;
   }

   set autoSave (value)
   {
      this .globalConfig .autoSave = value;

      if (value)
         this .registerAutoSave ();
   }

   #saveTimeoutId = undefined;

   registerAutoSave ()
   {
      if (!this .autoSave)
         return;

      clearTimeout (this .#saveTimeoutId);

      this .#saveTimeoutId = setTimeout (() => this .saveFile (), 1000);
   }

   exportAs (filePath)
   {
      this .saveCopyAs (filePath);
   }

   /**
    *
    */
   close ()
   {
      this .saveFile ();

      electron .ipcRenderer .sendToHost ("closed");
   }

   undo ()
   {
      UndoManager .shared .undo ();
   }

   redo ()
   {
      UndoManager .shared .redo ();
   }

   undoManager ()
   {
      this .updateMenu ();

      electron .ipcRenderer .sendToHost ("saved", !UndoManager .shared .saveNeeded);

      if (UndoManager .shared .saveNeeded)
         this .registerAutoSave ();
   }

   updateUndoMenus (menu)
   {
      Object .assign (menu,
      {
         undoLabel: UndoManager .shared .undoLabel,
         redoLabel: UndoManager .shared .redoLabel,
      });
   }

   cut ()
   {
      this .sidebar .outlineEditor .cutNodes ();
   }

   copy ()
   {
      this .sidebar .outlineEditor .copyNodes ();
   }

   paste ()
   {
      this .sidebar .outlineEditor .pasteNodes ();
   }

   delete ()
   {
      this .sidebar .outlineEditor .deleteNodes ();
   }

   /**
    *
    * @param {string} value
    */
   setPrimitiveQuality (value)
   {
      const live = this .browser .isLive ();

      this .browser .beginUpdate ();
      this .browser .setBrowserOption ("PrimitiveQuality", value);
      this .browser .setDescription (`Primitive Quality: ${value .toLowerCase ()}`);

      if (!live)
      {
         this .browser .finishedEvents () .addFieldCallback (this, () =>
         {
            this .browser .finishedEvents () .removeFieldCallback (this);
            this .browser .endUpdate ();
         });
      }
   }

   updatePrimitiveQualityMenu (menu)
   {
      Object .assign (menu,
      {
         primitiveQuality: this .fileConfig .primitiveQuality,
      });
   }

   set_primitiveQuality ()
   {
      this .fileConfig .primitiveQuality = this .browser .getBrowserOption ("PrimitiveQuality");

      this .updateMenu ();
   }

   /**
    *
    * @param {string} value
    */
   setTextureQuality (value)
   {
      this .browser .setBrowserOption ("TextureQuality", value);
      this .browser .setDescription (`Texture Quality: ${value .toLowerCase ()}`);
   }

   updateTextureQualityMenu (menu)
   {
      Object .assign (menu,
      {
         textureQuality: this .fileConfig .textureQuality,
      });
   }

   set_textureQuality ()
   {
      this .fileConfig .textureQuality = this .browser .getBrowserOption ("TextureQuality");

      this .updateMenu ();
   }

   /**
    *
    * @param {boolean} value
    */
   setDisplayRubberband (value)
   {
      this .browser .setBrowserOption ("Rubberband", value);
      this .browser .setDescription (`Rubberband: ${value ? "on" : "off"}`);
   }

   updateRubberbandMenu (menu)
   {
      Object .assign (menu,
      {
         rubberband: this .fileConfig .rubberband,
      });
   }

   set_rubberband ()
   {
      this .fileConfig .rubberband = this .browser .getBrowserOption ("Rubberband");

      this .updateMenu ();
   }

   /**
    *
    * @param {boolean} value
    */
   setDisplayTimings (value)
   {
      this .browser .setBrowserOption ("Timings", value);
   }

   updateTimingsMenu (menu)
   {
      Object .assign (menu,
      {
         timings: this .fileConfig .timings,
      });
   }

   set_timings ()
   {
      this .fileConfig .timings = this .browser .getBrowserOption ("Timings");

      this .updateMenu ();
   }

   /**
    * Change browser size according to aspect-ratio
    */
   onresize ()
   {
      const
         enabled          = this .browserSize .fileConfig .enabled,
         numerator        = this .browserSize .fileConfig .numerator,
         denominator      = this .browserSize .fileConfig .denominator,
         aspectRatio      = numerator / denominator,
         frameAspectRatio = $("#browser-frame") .width () / $("#browser-frame") .height (),
         element          = this .browser .getElement ();

      if (enabled && aspectRatio)
      {
         element .css ({ "aspect-ratio": `${numerator} / ${denominator}` });

         if (aspectRatio > frameAspectRatio)
            element .css ({ "width": "100%", "height": "auto" });
         else
            element .css ({ "width": "auto", "height": "100%" });
      }
      else
      {
         element .css ({ "aspect-ratio": "unset", "width": "100%", "height": "100%" });
      }
   }

   #grids = new Map ();

   setGridTool (typeName, visible)
   {
      const
         GridTool   = require (`../Tools/Grid/${typeName}`),
         grid       = this .#grids .get (typeName) ?? new GridTool (this .browser),
         gridConfig = this .fileConfig .addNameSpace (`${typeName}.`);

      this .#grids .forEach (grid => grid .setEnabled (false));
      this .#grids .set (typeName, grid);

      grid .setEnabled (visible);

      gridConfig .visible = visible;

      this .updateMenu ();
   }

   updateGridMenus (menu)
   {
      Object .assign (menu,
      {
         GridTool: false,
         AngleGridTool: false,
         AxonometricGridTool: false,
      });

      this .#grids .forEach ((grid, typeName) => menu [typeName] = grid .getEnabled ());

      electron .ipcRenderer .send ("change-menu", menu);
   }
};
