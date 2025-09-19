const
   electron = require ("electron"),
   path     = require ("path"),
   fs       = require ("fs"),
   os       = require ("os");

module .exports = class Registry
{
   static addWindowsFileTypes ()
   {
      if (process .platform !== "win32")
         return;

      // if (!electron .app .isPackaged)
      //    return;

      console .log (electron .app .getAppPath ())

      const { spawn } = require ("child_process");

      const
         reg = fs .readFileSync (path .join (__dirname, "../assets/X3D.reg"), { encoding: "utf-8" }),
         exe = path .resolve (path .join (os .homedir (), "/AppData/Local/sunrize/Sunrize X3D Editor.exe")),
         tmp = path .join (__dirname, "../assets/X3D-out.reg");

      const out = reg
         .replaceAll ("SUNRIZE_EXE", exe .replaceAll ("\\", "\\\\"));

      fs .writeFileSync (tmp, out);

      const ls = spawn ("reg", ["import", tmp]);

      ls .stdout .on ('data', (data) =>
      {
         // console .log (`stdout: ${data}`);
      });

      ls .stderr .on ('data', (data) =>
      {
         // console .error (`stderr: ${data}`);
      });

      ls .on ("close", (code) =>
      {
         fs .unlinkSync (tmp);
      });
   }
}
