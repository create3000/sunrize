
"use strict";

const
   $         = require ("jquery"),
   Interface = require ("../Application/Interface"),
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

      this .recorder = element;

      this .left = $("<div></div>")
         .addClass ("video-recorder-left")
         .appendTo (this .recorder);

      // Toolbar

      this .toolbar = $("<div></div>")
         .addClass (["toolbar", "vertical-toolbar", "secondary-toolbar", "video-recorder-toolbar"])
         .appendTo (this .recorder);

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

      this .settingsButton = $("<span></span>")
         .addClass (["material-symbols-outlined"])
         .attr ("title", _("Edit settings."))
         .text ("settings")
         .on ("click", () => this .showSettings ())
         .appendTo (this .toolbar);

      this .mimeTypeButton = $("<select></select>");

      for (const [name, mimeType] of VideoRecorder .mimeTypes)
      {
         if (!MediaRecorder .isTypeSupported (mimeType))
            continue;

         $("<option></option>")
            .text (name)
            .val (mimeType)
            .appendTo (this .mimeTypeButton);
      }
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

   showSettings ()
   {

   }
};
