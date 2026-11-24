
"use strict";

const
   $         = require ("jquery"),
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
         .text (_("Width"))
         .appendTo (this .settings);

      this .width = $("<input>")
         .addClass ("settings")
         .attr ("title", _("Width in Pixels"))
         .attr ("type", "number")
         .attr ("min", 1)
         .attr ("step", "1")
         .attr ("placeholder", _("Enter a number."))
         .val (1024)
         .on ("change input", () => this .config .file .width = this .width .val ())
         .on ("change input", () => this .resizeFrame ())
         .appendTo (this .settings);

      $("<span></span>")
         .text (_("Height"))
         .appendTo (this .settings);

      this .height = $("<input>")
         .addClass ("settings")
         .attr ("title", _("Height in Pixels"))
         .attr ("type", "number")
         .attr ("min", 1)
         .attr ("step", "1")
         .attr ("placeholder", _("Enter a number."))
         .val (576)
         .on ("change input", () => this .config .file .height = this .height .val ())
         .on ("change input", () => this .resizeFrame ())
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
         .val (60)
         .on ("change input", () => this .config .file .duration = this .duration .val ())
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
         .addClass (["material-symbols-outlined"])
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

      this .resizeFrame ();
   }

   async chooseFile ()
   {
      const
         suffix           = VideoRecorder .formats [this .fileType .val ()] .suffix,
         defaultDirectory = $.try (() => path .dirname (url .fileURLToPath (this .browser .currentScene .getWorldURL ()))),
         defaultPath      = defaultDirectory ? path .join (defaultDirectory, `${_("Video")}.${suffix}`) : `${_("Video")}.${suffix}`,
         response         = await electron .ipcRenderer .invoke ("file-path", { type: "save", filters: VideoRecorder .filters, defaultPath });

      if (response .canceled)
         return;

      this .filename .val (response .filePath);

      this .config .file .filename = response .filePath;
   }

   #record = false;
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
      const stream = this .browser .getElement () .captureStream (30);

      this .#timeoutId = setTimeout (() => this .stopRecord (), this .duration .val () * 1_000 || 60_000);
      this .#mimeType  = VideoRecorder .formats [this .fileType .val ()] .mimeType;
      this .#recorder  = new MediaRecorder (stream, { mimeType: this .#mimeType });

      const chunks = [ ];

      this .#recorder .addEventListener ("dataavailable", event =>
      {
         if (event .data .size > 0)
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

      // Toggle State

      this .#record = true;

      this .recordButton .addClass ("active");
   }

   async stopRecord ()
   {
      clearTimeout (this .#timeoutId);

      this .#recorder .stop ();

      const
         blob   = await this .#blob,
         buffer = Buffer .from (await blob .arrayBuffer ());

      fs .writeFileSync (this .filename .val (), buffer);

      // Toggle State

      this .#record = false;

      this .recordButton .removeClass ("active");
   }

   resizeFrame ()
   {
      const
         numerator        = +this .width  .val () || 1024,
         denominator      = +this .height .val () || 576,
         aspectRatio      = numerator / denominator,
         frameAspectRatio = this .recordFrame .innerWidth () / this .recordFrame .innerHeight ();

      this .aspectFrame .css ({ "aspect-ratio": `${numerator} / ${denominator}` });

      if (aspectRatio > frameAspectRatio)
         this .aspectFrame .css ({ "width": "100%", "height": "auto" });
      else
         this .aspectFrame .css ({ "width": "auto", "height": "100%" });
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
