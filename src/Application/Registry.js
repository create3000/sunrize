const
   electron      = require ("electron"),
   path          = require ("path"),
   fs            = require ("fs"),
   os            = require ("os"),
   child_process = require ("child_process");

module .exports = class Registry
{
   static addWindowsFileTypes ()
   {
      if (process .platform !== "win32")
         return;

      if (!electron .app .isPackaged)
         return;

      const
         exe = electron .app .getPath ("exe"),
         reg = fs .readFileSync (path .join (__dirname, "../assets/X3D.reg"), { encoding: "utf-8" }),
         tmp = path .join (__dirname, "../assets/X3D-tmp.reg");

      const out = reg .replaceAll ("SUNRIZE_EXE", exe .replaceAll ("\\", "\\\\"));

      fs .writeFileSync (tmp, out);

      const ls = child_process .spawn ("reg", ["import", tmp]);

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
