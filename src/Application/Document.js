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
   ActionKeys         = require ("./ActionKeys"),
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
      $("body") .addClass ("modal");

      // Actions

      electron .ipcRenderer .on ("activate", () => this .activate ());

      $(window)
         .on ("focusin",  () => this .onfocus ())
         .on ("focusout", () => this .onfocus ());

      $(window) .on ("keydown", event => this .onkeydown (event));

      // File Menu

      electron .ipcRenderer .on ("open-files",       (event, urls)     => this .loadURL (urls [0])); // DEBUG
      electron .ipcRenderer .on ("save-file",        (event, force)    => this .saveFile (force));
      electron .ipcRenderer .on ("save-file-as",     (event, filePath) => this .saveFileAs (filePath));
      electron .ipcRenderer .on ("save-copy-as",     (event, filePath) => this .saveCopyAs (filePath));
      electron .ipcRenderer .on ("auto-save",        (event, value)    => this .autoSave = value);
      electron .ipcRenderer .on ("export-as",        (event, filePath) => this .exportAs (filePath));
      electron .ipcRenderer .on ("scene-properties", (event)           => require ("../Editors/SceneProperties") .open ());
      electron .ipcRenderer .on ("close",            (event)           => this .close ());

      // Edit Menu

      electron .ipcRenderer .on ("undo", () => this .undo ());
      electron .ipcRenderer .on ("redo", () => this .redo ());

      $(window)
         .on ("cut",   () => this .cut ())
         .on ("copy",  () => this .copy ())
         .on ("paste", () => this .paste ());

      electron .ipcRenderer .on ("delete", () => this .delete ());

      // Selection Menu

      electron .ipcRenderer .on ("select-all", () => this .selectAll ());

      // View Menu

      electron .ipcRenderer .on ("primitive-quality",  (event, value) => this .setPrimitiveQuality (value));
      electron .ipcRenderer .on ("texture-quality",    (event, value) => this .setTextureQuality (value));
      electron .ipcRenderer .on ("display-rubberband", (event, value) => this .setDisplayRubberband (value));
      electron .ipcRenderer .on ("display-timings",    (event, value) => this .setDisplayTimings (value));
      electron .ipcRenderer .on ("show-library",       (event)        => this .showLibrary ());

      // Layout Menu

      electron .ipcRenderer .on ("browser-frame", () => this .browserFrame .open ());
      electron .ipcRenderer .on ("grid-tool", (event, typeName, visible) => this .activateGridTool (typeName, visible));
      electron .ipcRenderer .on ("grid-options", () => this .showGridOptions ());

      electron .ipcRenderer .on ("activate-snap-target",                 (event, visible) => this .activateSnapTarget (visible));
      electron .ipcRenderer .on ("activate-snap-source",                 (event, visible) => this .activateSnapSource (visible));
      electron .ipcRenderer .on ("center-snap-target-in-selection",      () => this .centerSnapTargetInSelection ());
      electron .ipcRenderer .on ("move-selection-to-snap-target",        () => this .moveSelectionToSnapTarget ());
      electron .ipcRenderer .on ("move-selection-center-to-snap-target", () => this .moveSelectionCenterToSnapTarget ());

      // Browser Size

      this .fullname     = await electron .ipcRenderer .invoke ("fullname");
      this .browserFrame = require ("../Editors/BrowserFrame");

      // Change undo menu items.

      UndoManager .shared .addInterest (this, () => this .undoManager ());

      // Connect browser options.

      this .browser .getBrowserOptions () .getField ("PrimitiveQuality") .addInterest ("set_primitiveQuality", this);
      this .browser .getBrowserOptions () .getField ("TextureQuality")   .addInterest ("set_textureQuality",   this);
      this .browser .getBrowserOptions () .getField ("Rubberband")       .addInterest ("set_rubberband",       this);
      this .browser .getBrowserOptions () .getField ("Timings")          .addInterest ("set_timings",          this);

      this .browser .setBrowserOption ("AlwaysUpdateGeometries", true);
      this .browser .setBrowserOption ("MetadataReference", require ("../../package.json") .homepage);

      // Connect browser events.

      this .browser ._activeLayer .addInterest ("toggleGrids", this);

      // Connect for Snap Target and Snap Source.

      $(this .browser .element .shadowRoot) .find ("canvas")
         .on ("mousedown", event => this .onmousedown (event))
         .on ("mouseup",   event => this .onmouseup   (event));

      // Restore

      await this .restoreFile ();

      if (!this .isInitialScene)
         $("body") .removeClass ("modal");
   }

   configure ()
   {
      this .config .file .setDefaultValues ({
         inferProfileAndComponents: true,
         primitiveQuality: "MEDIUM",
         textureQuality: "MEDIUM",
         rubberband: true,
         timings: false,
      });

      this .fileSaveFileTypeWarning = false;

      // Configure browser options.

      this .setPrimitiveQuality  (this .config .file .primitiveQuality);
      this .setTextureQuality    (this .config .file .textureQuality);
      this .setDisplayRubberband (this .config .file .rubberband);
      this .setDisplayTimings    (this .config .file .timings);

      // Configure grids.

      this .#grids .forEach (grid => grid .dispose ());

      this .#grids      .clear ();
      this .#gridFields .clear ();

      // Remove Snap Target and Snap Source.

      this .#snapTarget ?.dispose ();
      this .#snapSource ?.dispose ();

      this .#snapTarget = null;
      this .#snapSource = null;

      // Run activate.

      this .activate ();
   }

   /**
    * Run actions when tab is activated/selected.
    */
   activate ()
   {
      this .updateMenu ();

      electron .ipcRenderer .sendToHost ("focus");
   }

   updateMenu ()
   {
      const menu = { };

      this .updateUndoMenus (menu);
      this .updateBrowserOptionsMenus (menu);
      this .updateGridMenus (menu);
      this .updateSnapToolMenus (menu);

      electron .ipcRenderer .send ("update-menu", menu);
   }

   // Active (Focused) Element

   activeElement = null

   onfocus ()
   {
      this .activeElement = document .activeElement ? $(document .activeElement) : null;

      electron .ipcRenderer .send ("update-menu",
      {
         defaultEditMenu: this .activeElementIsInputOrOutput (),
         monacoEditor: this .activeElement .attr ("role") === "textbox" && this .activeElement .closest (".monaco-editor") .length,
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

   // Menu Accelerators

   onkeydown (event)
   {
      switch (event .key)
      {
         case "a":
         {
            if (this .activeElementIsInputOrOutput ())
               break;

            if (ActionKeys .value === ActionKeys .CommandOrControl)
            {
               this .selectAll ();
               return false;
            }

            break;
         }
      }
   }

   /*
    * File Menu
    */

   async restoreFile ()
   {
      await this .browser .loadComponents (this .browser .getComponent ("Grouping"));

      this .browser .updateConcreteNode (require ("../Components/Grouping/StaticGroup"));

      if (this .fileId)
      {
         const contents = this .config .global .addNameSpace ("unsaved.") [this .fileId];

         if (contents)
         {
            await this .loadURL (encodeURI (`data:model/x3d+xml,${contents}`));
         }
         else
         {
            await this .loadURL (`data:model/x3d+vrml,
Viewpoint {
   description "Initial View"
   position 2.869677 3.854335 8.769781
   orientation -0.7765887 0.6177187 0.1238285 0.5052317
}
            `);

            this .activateGridTool ("GridTool", true);
         }
      }
      else
      {
         const
            location = new URL (window .location),
            fileURL  = location .searchParams .get ("url") || "";

         await this .loadURL (fileURL);
      }
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

      if (this .config .file .inferProfileAndComponents ?? true)
         Editor .inferProfileAndComponents (scene, new UndoManager ());

      // Add default meta data.

      const
         pkg       = require ("../../package.json"),
         generator = scene .getMetaData ("generator") ?.filter (value => !value .startsWith (pkg .productName)) ?? [ ];

      generator .push (`${pkg .productName} V${pkg .version}, ${pkg .homepage}`);

      if (!scene .getMetaData ("created"))
         scene .setMetaData ("created", new Date () .toUTCString ());

      if (!scene .getMetaData ("creator") ?.some (value => value .includes (this .fullname)))
         scene .addMetaData ("creator", this .fullname);

      scene .setMetaData ("generator", generator);
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

         this .config .global .addNameSpace ("unsaved.") [id] = Editor .getContents (scene);
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
      return this .config .global .autoSave;
   }

   set autoSave (value)
   {
      this .config .global .autoSave = value;

      if (value)
         this .registerAutoSave ();
   }

   #saveTimeoutId = undefined;

   registerAutoSave ()
   {
      if (!this .autoSave)
         return;

      clearTimeout (this .#saveTimeoutId);

      this .#saveTimeoutId = setTimeout (() => this .saveFile (false), 1000);
   }

   exportAs (filePath)
   {
      this .saveCopyAs (filePath);
   }

   close ()
   {
      this .saveFile (false);

      electron .ipcRenderer .sendToHost ("closed");
   }

   /*
    * Edit Menu
    */

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

      if (UndoManager .shared .saveNeeded)
         this .registerAutoSave ();

      electron .ipcRenderer .sendToHost ("saved", !UndoManager .shared .saveNeeded);
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
      if (this .activeElementIsInputOrOutput ())
         return;

      this .sidebar .outlineEditor .cutNodes ();
      return false;
   }

   copy ()
   {
      if (this .activeElementIsInputOrOutput ())
         return;

      this .sidebar .outlineEditor .copyNodes ();
      return false;
   }

   paste ()
   {
      if (this .activeElementIsInputOrOutput ())
         return;

      this .sidebar .outlineEditor .pasteNodes ();
      return false;
   }

   delete ()
   {
      this .sidebar .outlineEditor .deleteNodes ();
   }

   /*
    * Selection Menu
    */

   selectAll ()
   {
      this .sidebar .outlineEditor .selectAll ();
   }

   /*
    * View Menu
    */

   /**
    *
    * @param {string} value
    */
   setPrimitiveQuality (value)
   {
      this .browser .setBrowserOption ("PrimitiveQuality", value);
      this .browser .setDescription (`Primitive Quality: ${value .toLowerCase ()}`);
   }

   set_primitiveQuality ()
   {
      this .config .file .primitiveQuality = this .browser .getBrowserOption ("PrimitiveQuality");

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

   set_textureQuality ()
   {
      this .config .file .textureQuality = this .browser .getBrowserOption ("TextureQuality");

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

   set_rubberband ()
   {
      this .config .file .rubberband = this .browser .getBrowserOption ("Rubberband");

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

   set_timings ()
   {
      this .config .file .timings = this .browser .getBrowserOption ("Timings");

      this .updateMenu ();
   }

   updateBrowserOptionsMenus (menu)
   {
      Object .assign (menu,
      {
         primitiveQuality: this .config .file .primitiveQuality,
         textureQuality: this .config .file .textureQuality,
         rubberband: this .config .file .rubberband,
         timings: this .config .file .timings,
      });
   }

   showLibrary ()
   {
      require ("../Editors/Library") .open (this .browser .currentScene);
   }

   /*
    * Layout Menu
    */

   static #Grids = [
      "GridTool",
      "AngleGridTool",
      "AxonometricGridTool",
   ];

   #grids      = new Map ();
   #gridFields = new Map ();

   toggleGrids ()
   {
      const configNode = Editor .getConfigNode (this .browser);

      for (const typeName of Document .#Grids)
      {
         const [visible = false] = configNode ?.getMetaData (`Sunrize/${typeName}/visible`) ?? [ ];

         if (!this .#grids .has (typeName) && !visible)
            continue;

         this .activateGridTool (typeName, visible, false);
      }
   }

   async activateGridTool (typeName, visible, undo = true)
   {
      const
         Tool = require (`../Tools/Grids/${typeName}`),
         grid = this .#grids .get (typeName) ?? new Tool (this .browser .currentScene),
         tool = await grid .getToolInstance ();

      grid ._visible .addInterest ("updateMenu", this);
      tool .getField ("isActive") .addInterest ("handleUndoForGrid", this, typeName);

      UndoManager .shared .beginUndo (_ ("Change Visibility of %s"), typeName);

      if (visible)
      {
         for (const [typeName, grid] of this .#grids)
         {
            if (undo)
               Editor .setFieldValue (this .browser .currentScene, grid .tool .getValue (), grid ._visible, false);
            else
               grid ._visible = false;
         }
      }

      this .#grids .set (typeName, grid);

      if (undo)
         Editor .setFieldValue (this .browser .currentScene, grid .tool .getValue (), grid ._visible, visible);
      else
         grid ._visible = visible;

      UndoManager .shared .endUndo ();
   }

   async handleUndoForGrid (typeName)
   {
      const
         grid = this .#grids .get (typeName),
         tool = await grid .getToolInstance ();

      if (tool .isActive)
      {
         this .#gridFields .set (typeName, new Map ([... tool .getValue () .getFields ()]
            .filter (field => field .isInitializable ())
            .map (field => [field .getName (), field .copy ()])));
      }
      else
      {
         const
            executionContext = tool .getValue () .getExecutionContext (),
            initialValues    = this .#gridFields .get (typeName);

         UndoManager .shared .beginUndo (_("Change Properties of %s"), typeName);

         for (const field of tool .getValue () .getFields ())
         {
            if (!field .isInitializable ())
               continue;

            const initialValue = initialValues .get (field .getName ());

            if (field .equals (initialValue))
               continue;

            const value = field .copy ();

            field .assign (initialValue);

            Editor .setFieldValue (executionContext, tool .getValue (), field, value);
         }

         UndoManager .shared .endUndo ();
      }
   }

   updateGridMenus (menu)
   {
      Document .#Grids .forEach (typeName => menu [typeName] = false);

      this .#grids .forEach ((grid, typeName) => menu [typeName] = grid ._visible .getValue ());
   }

   async showGridOptions ()
   {
      for (const grid of this .#grids .values ())
      {
         if (!grid ._visible .getValue ())
            continue;

         const tool = await grid .getToolInstance ();

         this .secondaryToolbar .togglePanel (true);
         this .secondaryToolbar .panel .setNode (tool .getValue ());
      }
   }

   #snapTarget = null;
   #snapSource = null;

   async onmousedown (event)
   {
      if (event .button !== 2)
         return;

      switch (ActionKeys .value)
      {
         case ActionKeys .None:
         {
            if (this .#snapTarget ?._visible .getValue ())
               break;

            this .activateSnapTarget (true);

            await this .#snapTarget .getToolInstance ();

            this .#snapTarget .onmousedown (event, true);
            break;
         }
         case ActionKeys .Option:
         {
            if (this .#snapSource ?._visible .getValue ())
               break;

            this .activateSnapSource (true);

            await this .#snapSource .getToolInstance ();

            this .#snapSource .onmousedown (event, true);
            break;
         }
      }
   }

   async onmouseup (event)
   {
      if (ActionKeys .value & ActionKeys .Control)
         event .button = 2;

      if (event .button !== 2)
         return;

      await this .#snapSource ?.getToolInstance ();
      await this .#snapTarget ?.getToolInstance ();

      this .#snapSource ?.onmouseup (event);
      this .#snapTarget ?.onmouseup (event);
   }

   activateSnapTarget (visible)
   {
      const SnapTarget = require ("../Tools/SnapTool/SnapTarget");

      this .#snapTarget ??= new SnapTarget (this .browser .currentScene);

      this .#snapTarget ._visible .addInterest ("updateMenu", this);

      this .#snapTarget ._visible = visible;
   }

   activateSnapSource (visible)
   {
      const SnapSource = require ("../Tools/SnapTool/SnapSource");

      this .#snapSource ??= new SnapSource (this .browser .currentScene);

      this .#snapSource ._visible .addInterest ("updateMenu", this);

      this .#snapSource ._visible = visible;
   }

   async centerSnapTargetInSelection ()
   {
      this .activateSnapTarget (true);

      const
         selection        = require ("./Selection"),
         target           = await this .#snapTarget .getToolInstance (),
         executionContext = this .browser .currentScene,
         layerNode        = this .browser .getActiveLayer (),
         nodes            = selection .nodes,
         [values, bbox]   = Editor .getModelMatricesAndBBoxes (executionContext, layerNode, nodes);

      if (!bbox .size .magnitude ())
         return;

      UndoManager .shared .beginUndo (_("Center SnapTarget in Selection"));

      Editor .setFieldValue (executionContext, target .getValue (), target .position, bbox .center);

      UndoManager .shared .endUndo ();
   }

   async moveSelectionToSnapTarget ()
   {
      const
         selection        = require ("./Selection"),
         target           = await this .#snapTarget .getToolInstance (),
         source           = this .#snapSource ?._visible .getValue () ? await this .#snapSource .getToolInstance () : null,
         executionContext = this .browser .currentScene,
         layerNode        = this .browser .getActiveLayer (),
         nodes            = selection .nodes,
         targetPosition   = target .position .getValue (),
         targetNormal     = target .normal .getValue (),
         sourcePosition   = this .#snapSource ?._visible .getValue () ? source ?.position .getValue () : undefined,
         sourceNormal     = this .#snapSource ?._visible .getValue () ? source ?.normal   .getValue () : undefined;

      UndoManager .shared .beginUndo (_("Move Selection to SnapTarget"));

      Editor .moveNodesToTarget (executionContext, layerNode, nodes, targetPosition, targetNormal, sourcePosition, sourceNormal, false);

      if (this .#snapSource ?._visible .getValue ())
      {
         Editor .setFieldValue (executionContext, source .getValue (), source .position, target .position);
         Editor .setFieldValue (executionContext, source .getValue (), source .normal,   target .normal .negate ());
      }

      UndoManager .shared .endUndo ();
   }

   async moveSelectionCenterToSnapTarget ()
   {
      const
         selection        = require ("./Selection"),
         target           = await this .#snapTarget .getToolInstance (),
         source           = this .#snapSource ?._visible .getValue () ? await this .#snapSource .getToolInstance () : null,
         executionContext = this .browser .currentScene,
         layerNode        = this .browser .getActiveLayer (),
         nodes            = selection .nodes,
         targetPosition   = target .position .getValue (),
         targetNormal     = target .normal .getValue (),
         sourcePosition   = this .#snapSource ?._visible .getValue () ? source ?.position .getValue () : undefined,
         sourceNormal     = this .#snapSource ?._visible .getValue () ? source ?.normal   .getValue () : undefined;

      UndoManager .shared .beginUndo (_("Move Selection Center to SnapTarget"));

      Editor .moveNodesToTarget (executionContext, layerNode, nodes, targetPosition, targetNormal, sourcePosition, sourceNormal, true);

      if (this .#snapSource ?._visible .getValue ())
      {
         Editor .setFieldValue (executionContext, source .getValue (), source .position, target .position);
         Editor .setFieldValue (executionContext, source .getValue (), source .normal,   target .normal .negate ());
      }

      UndoManager .shared .endUndo ();
   }

   updateSnapToolMenus (menu)
   {
      menu .SnapTarget = this .#snapTarget ?._visible .getValue () ?? false;
      menu .SnapSource = this .#snapSource ?._visible .getValue () ?? false;
   }
};
