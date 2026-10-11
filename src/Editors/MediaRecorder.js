
"use strict";

const
   $         = require ("jquery"),
   Interface = require ("../Application/Interface"),
   fs        = require ("fs"),
   _         = require ("../Application/GetText");

module .exports = class MediaRecorderPanel extends Interface
{
   static mimeTypes = [
      ["MP4", "video/mp4", "mp4"],
      ["WebM", "video/webm", "webm"],
      ["OGG", "video/ogg", "ogv"],
   ];

   constructor (element)
   {
      super (`Sunrize.MediaRecorder.${element .attr ("id")}.`);

      this .recorder = element;

      this .left = $("<div></div>")
         .addClass ("media-recorder-left")
         .appendTo (this .recorder);

      this .recordButton = $("<span></span>")
         .addClass (["material-symbols-outlined", "button"])
         .attr ("title", _("Start recording."))
         .text ("screen_record")
         .on ("click", () => this .toggleRecord ())
         .appendTo (this .left);

      this .mimeTypeButton = $("<select></select>")
         .appendTo (this .left);

      for (const [name, mimeType] of MediaRecorderPanel .mimeTypes)
      {
         if (!MediaRecorder .isTypeSupported (mimeType))
            continue;

         $("<option></option>")
            .text (name)
            .val (mimeType)
            .appendTo (this .mimeTypeButton);
      }

      // Toolbar

      this .toolbar = $("<div></div>")
         .addClass (["toolbar", "vertical-toolbar", "secondary-toolbar", "media-recorder-toolbar"])
         .appendTo (this .recorder);

      this .setup ();
   }

   #record = false;
   #recorder;
   #mimeType;
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

      this .#mimeType = this .mimeTypeButton .val ();
      this .#recorder = new MediaRecorder (stream, { mimeType: this .#mimeType });

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
      this .#recorder .stop ();

      const
         suffix = MediaRecorderPanel .mimeTypes .find (([, mimeType]) => mimeType === this .#mimeType) [2],
         blob   = await this .#blob,
         buffer = Buffer .from (await blob .arrayBuffer ());

      fs .writeFileSync (`/Users/holger/Desktop/test.${suffix}`, buffer);

      // Toggle State

      this .#record = false;

      this .recordButton .removeClass ("active");
   }
};
