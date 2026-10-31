module .exports = class CheckReleases
{
   static #instance;

   static run (console)
   {
      return this .#instance ??= new CheckReleases (console);
   }

   #console;

   constructor (console)
   {
      this .#console = console;

      this .checkReleases ();
   }

   async checkReleases ()
   {
      try
      {
         const
            response = await fetch ("https://api.github.com/repos/create3000/sunrize/releases/latest"),
            latest   = await response .json (),
            pkg      = require ("../../package.json");

         if (latest .name === `v${pkg .version}`)
            return this .waitForRelease ();

         let filename;

         switch (process .platform)
         {
            case "win32":
               filename = `Sunrize.X3D.Editor-${latest .name .substring (1)}.Setup.exe`;
               break;
            case "darwin":
               filename = `Sunrize.X3D.Editor-darwin-arm64-${latest .name .substring (1)}.zip`;
               break;
            default:
               filename = `Sunrize.X3D.Editor-${latest .name .substring (1)}-x64.AppImage`;
               break;
         }

         const fileURL = `https://github.com/create3000/sunrize/releases/download/${latest .name}/${filename}`;

         if (!await this .fileExists (fileURL))
            return this .waitForRelease ();

         this .#console .addSplitter ();
         this .#console .addMessage ("info", "", 0, `A new Sunrize version ${latest .name} is now available on GitHub.`);
         this .#console .addMessage ("info", "", 0, `Download new version: <a download href="${fileURL}">${filename}</a>`, true);
         this .#console .addSplitter ();
      }
      catch (error)
      {
         if (process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT")
            console .error (error);
      }
   }

   waitForRelease ()
   {
      setTimeout (() => this .checkReleases (), 24 * 60 * 60 * 1_000);
   }

   async fileExists (url)
   {
      try
      {
         const response = await fetch (url, { method: "HEAD" });

         return response .ok;
      }
      catch
      {
         return false;
      }
   }
};
