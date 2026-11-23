
"use strict";

const
   $         = require ("jquery"),
   Interface = require ("../Application/Interface"),
   Splitter  = require ("../Controls/Splitter"),
   electron  = require ("electron"),
   fs        = require ("fs"),
   _         = require ("../Application/GetText");

module .exports = class VideoRecorder extends Interface
{
   static mimeTypes = [
      ["MP4", "video/mp4", "mp4"],
      ["WebM", "video/webm", "webm"],
      ["OGG", "video/ogg", "ogv"],
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
         .addClass (["video-recorder-browser", "vertical-splitter-right"])
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
         .attr ("type", "number")
         .attr ("min", 1)
         .attr ("step", "1")
         .val (1024)
         .appendTo (this .settings);

      $("<span></span>")
         .text (_("Height"))
         .appendTo (this .settings);

      this .height = $("<input>")
         .addClass ("settings")
         .attr ("type", "number")
         .attr ("min", 1)
         .attr ("step", "1")
         .val (768)
         .appendTo (this .settings);

      $("<span></span>")
         .text (_("Duration"))
         .appendTo (this .settings);

      this .duration = $("<input>")
         .addClass ("settings")
         .attr ("type", "number")
         .attr ("min", 1)
         .attr ("step", "1")
         .val (60)
         .appendTo (this .settings);

      $("<span></span>")
         .text (_("File Type"))
         .appendTo (this .settings);

      this .fileType = $("<select></select>")
         .addClass ("settings")
         .appendTo (this .settings);

      for (const [name, mimeType] of VideoRecorder .mimeTypes)
      {
         if (!MediaRecorder .isTypeSupported (mimeType))
            continue;

         $("<option></option>")
            .text (name)
            .val (mimeType)
            .appendTo (this .fileType);
      }

      $("<span></span>")
         .text (_("Filename"))
         .appendTo (this .settings);

      this .duration = $("<input>")
         .addClass ("settings")
         .attr ("placeholder", _("Filename"))
         .appendTo (this .settings);

      // Fills remaining empty space.
      $("<span></span>")
         .css ("flex", 1)
         .appendTo (this .settings);

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

      this .setup ();
   }

   #desktop;

   async initialize ()
   {
      this .#desktop = await electron .ipcRenderer .invoke ("path", "desktop");

      // Toolbar

      this .recordButton = $("<span></span>")
         .addClass (["material-symbols-outlined"])
         .attr ("title", _("Start recording."))
         .text ("screen_record")
         .on ("click", () => this .toggleRecord ())
         .appendTo (this .toolbar);
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

      this .#timeoutId = setTimeout (() => this .stopRecord (), 60_000);
      this .#mimeType  = this .mimeTypeButton .val ();
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
         suffix = VideoRecorder .mimeTypes .find (([, mimeType]) => mimeType === this .#mimeType) [2],
         blob   = await this .#blob,
         buffer = Buffer .from (await blob .arrayBuffer ());

      fs .writeFileSync (`${this .#desktop}/test.${suffix}`, buffer);

      // Toggle State

      this .#record = false;

      this .recordButton .removeClass ("active");
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
