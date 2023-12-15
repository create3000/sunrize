(function ($) { $(".download") .on ("click", function ()
{
   (async () =>
   {
      const element = $(this);

      const
         response = await fetch (element .attr ("href")),
         total    = parseInt (response .headers .get ("content-length")) || element .attr ("content-length"),
         reader   = response .body .getReader (),
         chunks   = [ ];

      let received = 0;

      while (true)
      {
         const { done, value } = await reader .read ();

         if (done)
            break;

         chunks .push (value);
         received += value .length;

         const progress = received / total;

         element .attr ("style", "color: black !important");
         element .css ("border-color", "var(--system-green)");
         element .css ("background", `linear-gradient(90deg, var(--system-green) ${progress * 100}%, var(--download-bg) ${progress * 100}%)`);
      }

      const data = new Uint8Array (received);

      let position = 0;

      for (const chunk of chunks)
      {
         data .set (chunk, position);

         position += chunk .length;
      }

      const
         blob = new Blob ([data],  { type: "application/octet-stream" }),
         url  = URL .createObjectURL (blob),
         link = document .createElement ("a");

      link .href     = url;
      link .download = element .attr ("download");

      link .click ();

      element .css ("color", "");
      element .css ("border-color", "");
      element .css ("background", "");
   })();

   return false;
})})(jQuery);
