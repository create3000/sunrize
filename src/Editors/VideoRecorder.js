
"use strict";

const
   $         = require ("jquery"),
   X3D       = require ("../X3D"),
   Interface = require ("../Application/Interface"),
   Splitter  = require ("../Controls/Splitter"),
   electron  = require ("electron"),
   path      = require ("path"),
   url       = require ("url"),
   fs        = require ("fs"),
   _         = require ("../Application/GetText");

module .exports = class VideoRecorder extends Interface
{
   static formats = [
      { name: "MP4",  mimeType: "video/mp4",  suffix: "mp4"  },
      { name: "WebM", mimeType: "video/webm", suffix: "webm" },
      { name: "OGG",  mimeType: "video/ogg",  suffix: "ogv"  },
   ];

   static filters = [
      {
         name: _("Video"),
         extensions: ["mp4", "webm", "ogv"],
      },
   ];

   constructor (element)
   {
      super (`Sunrize.VideoRecorder.${element .attr ("id")}.`);

      this .videoRecorder = element;

      const maxRenderbufferSize = this .getMaxRenderbufferSize ();

      // Video Recorder Panel

      this .verticalSplitter = $("<div></div>")
         .attr ("id", "video-recorder-left")
         .addClass (["video-recorder-left", "vertical-splitter"])
         .appendTo (this .videoRecorder);

      this .verticalSplitterLeft = $("<div></div>")
         .addClass (["video-recorder-settings-panel", "vertical-splitter-left"])
         .css ("width", "30%")
         .appendTo (this .verticalSplitter);

      this .verticalSplitterRight = $("<div></div>")
         .addClass (["video-recorder-record-panel", "vertical-splitter-right"])
         .css ("width", "70%")
         .appendTo (this .verticalSplitter);

      this .vSplitter = new Splitter (this .verticalSplitter, "vertical");

      this .vSplitter .snapToBorder = true;

      this .vSplitter .handle .on ("position", () => this .splitterPosition ());

      // Settings

      this .settings = $("<div></div>")
         .addClass ("video-recorder-settings")
         .appendTo (this .verticalSplitterLeft);

      $("<span></span>")
         .addClass ("header")
         .text (_("Video Settings"))
         .appendTo (this .settings);

      $("<span></span>")
         .text (_("Width"))
         .appendTo (this .settings);

      this .width = $("<input>")
         .addClass ("settings")
         .attr ("title", _("Width in Pixels"))
         .attr ("type", "number")
         .attr ("min", 1)
         .attr ("max", maxRenderbufferSize)
         .attr ("step", "1")
         .attr ("placeholder", _("Enter a number."))
         .on ("change input", () => this .config .file .width = this .width .val ())
         .on ("change input", () => this .resizeFrame ())
         .on ("change input", () => this .verifySettings ())
         .appendTo (this .settings);

      $("<span></span>")
         .text (_("Height"))
         .appendTo (this .settings);

      this .height = $("<input>")
         .addClass ("settings")
         .attr ("title", _("Height in Pixels"))
         .attr ("type", "number")
         .attr ("min", 1)
         .attr ("max", maxRenderbufferSize)
         .attr ("step", "1")
         .attr ("placeholder", _("Enter a number."))
         .on ("change input", () => this .config .file .height = this .height .val ())
         .on ("change input", () => this .resizeFrame ())
         .on ("change input", () => this .verifySettings ())
         .appendTo (this .settings);

      $("<span></span>")
         .text (_("Duration"))
         .appendTo (this .settings);

      this .duration = $("<input>")
         .addClass ("settings")
         .attr ("title", _("Duration in Seconds"))
         .attr ("type", "number")
         .attr ("min", 1)
         .attr ("step", "1")
         .attr ("placeholder", _("Enter a number."))
         .on ("change input", () => this .config .file .duration = this .duration .val ())
         .on ("change input", () => this .verifySettings ())
         .appendTo (this .settings);

      $("<span></span>")
         .text (_("File Type"))
         .appendTo (this .settings);

      this .fileType = $("<select></select>")
         .addClass ("settings")
         .on ("change input", () => this .config .file .fileType = this .fileType .val ())
         .appendTo (this .settings);

      for (const [index, { name, mimeType }] of VideoRecorder .formats .entries ())
      {
         if (!MediaRecorder .isTypeSupported (mimeType))
            continue;

         $("<option></option>")
            .text (name)
            .val (index)
            .appendTo (this .fileType);
      }

      $("<span></span>")
         .text (_("Filename"))
         .appendTo (this .settings);

      this .filenameBox = $("<div></div>")
         .addClass ("filename-box")
         .appendTo (this .settings);

      this .filename = $("<input>")
         .addClass ("settings")
         .attr ("placeholder", _("Enter a filename."))
         .on ("change input", () => this .config .file .filename = this .filename .val ())
         .on ("change input", () => this .verifySettings ())
         .appendTo (this .filenameBox);

      this .fileChooser = $("<span></span>")
         .addClass (["file-chooser", "button", "material-symbols-outlined"])
         .attr ("title", _("Choose a file."))
         .text ("file_save")
         .appendTo (this .filenameBox)
         .on ("click", () => this .chooseFile ());

      // Fills remaining empty space.
      $("<span></span>")
         .css ("flex", 1)
         .appendTo (this .settings);

      // Record Panel

      this .recordFrame = $("<div></div>")
         .addClass ("video-recorder-record-frame")
         .appendTo (this .verticalSplitterRight);

      this .aspectFrame = $("<div></div>")
         .addClass ("video-recorder-aspect-frame")
         .appendTo (this .recordFrame);

      this .frameObserver = new ResizeObserver (() => this .resizeFrame ());
      this .frameObserver .observe (this .verticalSplitterRight [0]);

      // Time

      this .time = $("<div></div>")
         .addClass (["time", "mini-tip", "visible"]);

      // Toolbar

      this .toolbar = $("<div></div>")
         .addClass (["toolbar", "vertical-toolbar", "secondary-toolbar", "video-recorder-toolbar"])
         .appendTo (this .videoRecorder);

      this .toggleSidebarButton = $("<span></span>")
         .addClass ("material-symbols-outlined")
         .attr ("title", _("Toggle sidebar."))
         .text ("dock_to_right")
         .appendTo (this .toolbar)
         .on ("click", () => this .toggleSidebar ());

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      this .recordButton = $("<span></span>")
         .addClass (["disabled", "material-symbols-outlined"])
         .attr ("title", _("Start recording."))
         .text ("screen_record")
         .on ("click", () => this .toggleRecord ())
         .appendTo (this .toolbar);

      this .setup ();
   }

   configure ()
   {
      super .configure ();

      this .config .file .setDefaultValues ({
         width: 1024,
         height: 576,
         duration: 60,
         fileType: 0,
         filename: "",
      });

      this .width    .val (this .config .file .width);
      this .height   .val (this .config .file .height);
      this .duration .val (this .config .file .duration);
      this .fileType .val (this .config .file .fileType);
      this .filename .val (this .config .file .filename);

      this .verifySettings ();
      this .resizeFrame ();
   }

   async chooseFile ()
   {
      const
         worldURL         = new URL (this .browser .currentScene .getWorldURL ()),
         name             = worldURL .protocol === "data:" ? _("New Scene") : path .parse (worldURL .pathname) .name,
         suffix           = VideoRecorder .formats [this .fileType .val ()] .suffix,
         defaultDirectory = $.try (() => path .dirname (url .fileURLToPath (worldURL))),
         desktop          = await electron .ipcRenderer .invoke ("path", "desktop"),
         defaultPath      = path .join (defaultDirectory ?? desktop, `${name}.${suffix}`),
         filters          = VideoRecorder .filters,
         response         = await electron .ipcRenderer .invoke ("file-path", { type: "save", defaultPath, filters });

      if (response .canceled)
         return;

      this .filename .val (response .filePath);

      this .config .file .filename = response .filePath;

      this .verifySettings ();
   }

   verifySettings ()
   {
      const
         width    = this .width    .val ()|0,
         height   = this .height   .val ()|0,
         duration = this .duration .val ()|0,
         filename = this .filename .val ();

      const maxRenderbufferSize = this .getMaxRenderbufferSize ();

      let ok = true;

      ok &&= width > 0 && width < maxRenderbufferSize;
      ok &&= height > 0 && height < maxRenderbufferSize;
      ok &&= duration > 0;
      ok &&= filename;

      if (ok)
         this .recordButton .removeClass ("disabled");
      else
         this .recordButton .addClass ("disabled");
   }

   getMaxRenderbufferSize ()
   {
      const gl = this .browser .getContext ();

      return gl .getParameter (gl .MAX_RENDERBUFFER_SIZE);
   }

   #recordCanvas;
   #recordBrowser;
   #record = false;
   #recordTime;
   #timeoutId;
   #mimeType;
   #recorder;
   #blob;

   toggleRecord ()
   {
      if (this .#record)
         this .stopRecord ();
      else
         this .startRecord ();
   }

   async startRecord ()
   {
      const
         width    = this .width  .val ()|0,
         height   = this .height .val ()|0,
         duration = this .duration .val ()|0;

      // Disable settings.

      this .recordButton .addClass ("active");
      this .settings .find ("input") .attr ("readonly", "");
      this .settings .find ("select") .attr ("disabled", "");
      this .settings .find (".button") .addClass ("disabled");

      // Create browser.

      this .aspectFrame .empty () .css ({
         "max-width": "fit-content",
         "max-height": "fit-content",
      });

      this .#recordCanvas  = $(`<x3d-canvas splashScreen="false"></x3d-canvas>`) .appendTo (this .aspectFrame);
      this .#recordBrowser = this .#recordCanvas .prop ("browser");

      this .#recordBrowser .setBrowserOption ("Notifications", false);
      this .#recordBrowser .setBrowserOption ("Timings",       false);
      this .#recordBrowser .setBrowserOption ("ContextMenu",   false);
      this .#recordBrowser .setBrowserOption ("Mute",          true);
      this .#recordBrowser .setBrowserOption ("XRSessionMode", "NONE");

      const options = [
         "Antialiased",
         "ColorSpace",
         "Exposure",
         "LogarithmicDepthBuffer",
         "Multisampling",
         "OrderIndependentTransparency",
         "PrimitiveQuality",
         "QualityWhenMoving",
         "TextCompression",
         "TextureQuality",
         "ToneMapping",
      ];

      for (const option of options)
         this .#recordBrowser .setBrowserOption (option, this .browser .getBrowserOption (option));

      this .#recordBrowser .endUpdate ();

      await this .#recordBrowser .resize (width, height);
      await this .#recordBrowser .loadURL (new X3D .MFString (this .browser .getWorldURL ()));
      this .resizeFrame ();

      this .#recordBrowser .beginUpdate ();
      this .#recordBrowser .addBrowserEvent ();

      this .time .text (duration) .appendTo (this .aspectFrame);

      this .#recordBrowser .prepareEvents () .addFieldCallback (this, () =>
      {
         this .#recordBrowser .addBrowserEvent ();

         const time = duration - (Date .now () - this .#recordTime) / 1000;

         this .time .text (time .toFixed (1) + " s");
      });

      // Toggle state.

      this .#record     = true;
      this .#recordTime = Date .now ();

      // Create stream.

      const stream = this .#recordCanvas .get (0) .captureStream (30);

      this .#timeoutId = setTimeout (() => this .stopRecord (), duration * 1_000);
      this .#mimeType  = VideoRecorder .formats [this .fileType .val ()] .mimeType;
      this .#recorder  = new MediaRecorder (stream, { mimeType: this .#mimeType });

      const chunks = [ ];

      this .#recorder .addEventListener ("dataavailable", event =>
      {
         if (event .data .size)
            chunks .push (event .data);
      });

      this .#blob = new Promise (resolve =>
      {
         this .#recorder .addEventListener ("stop", () =>
         {
            resolve (new Blob (chunks, { type: this .#mimeType }));
         });
      });

      this .#recorder .start ();
   }

   async stopRecord ()
   {
      // Stop recording.

      clearTimeout (this .#timeoutId);

      this .#recorder .stop ();

      // Dispose browser.

      this .#recordCanvas .remove ();
      this .#recordBrowser .dispose ();

      // Save file.

      const
         blob   = await this .#blob,
         buffer = Buffer .from (await blob .arrayBuffer ());

      $.try (() => fs .writeFileSync (this .filename .val (), buffer), true);

      // Enable settings.

      this .recordButton .removeClass ("active");
      this .settings .find ("input") .removeAttr ("readonly");
      this .settings .find ("select") .removeAttr ("disabled");
      this .settings .find (".button") .removeClass ("disabled");
      this .time .detach ();

      // Toggle state.

      this .#recordCanvas  = null;
      this .#recordBrowser = null;
      this .#record        = false;

      // Show video player.

      this .resizeFrame ();

      $("<video controls></video>")
         .attr ("src", this .filename .val ())
         .appendTo (this .aspectFrame);
   }

   resizeFrame ()
   {
      const
         width            = this .width  .val ()|0,
         height           = this .height .val ()|0,
         aspectRatio      = width / height,
         frameAspectRatio = this .recordFrame .innerWidth () / this .recordFrame .innerHeight ();

      this .aspectFrame .css ({
         "aspect-ratio": `${width} / ${height}`,
         "max-width": width,
         "max-height": height,
      });

      if (aspectRatio > frameAspectRatio)
         this .aspectFrame .css ({ "width": "100%", "height": "auto" });
      else
         this .aspectFrame .css ({ "width": "auto", "height": "100%" });

      if (aspectRatio > frameAspectRatio)
         this .#recordCanvas ?.css ("scale", this .recordFrame .innerWidth () / width);
      else
         this .#recordCanvas ?.css ("scale", this .recordFrame .innerHeight () / height);
   }

   splitterPosition ()
   {
      if (this .vSplitter .position)
         this .toggleSidebarButton .addClass (["active", "fill"]);
      else
         this .toggleSidebarButton .removeClass (["active", "fill"]);
   }

   toggleSidebar ()
   {
      if (this .vSplitter .position)
         this .vSplitter .toggle ("minimize");
      else
         this .vSplitter .toggle ("restore");
   }
};
