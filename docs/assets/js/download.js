(function ($) { $(".download") .on ("click", function ()
{
   (async () =>
   {
      const element = $(this);

      const
         response = await fetch (element .attr ("href")),
         total    = parseInt (response .headers .get ("content-length")) || parseInt (element .attr ("content-length")),
         reader   = response .body .getReader (),
         chunks   = [ ];

      element .addClass ("downloading");

      let received = 0;

      while (true)
      {
         const { done, value } = await reader .read ();

         if (done)
            break;

         chunks .push (value);

         received += value .length;

         const progress = received / total;

         element .css ("background", `linear-gradient(90deg, var(--downloading-left) ${progress * 100}%, var(--downloading-right) ${progress * 100}%)`);
      }

      const
         blob = new Blob (chunks, { type: "application/octet-stream" }),
         url  = URL .createObjectURL (blob),
         link = document .createElement ("a");

      link .href     = url;
      link .download = element .attr ("download");

      link .click ();

      element .removeClass ("downloading");
      element .css ("background", "");
   })();

   return false;
})})(jQuery);
