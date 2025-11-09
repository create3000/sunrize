const
   $      = require ("jquery"),
   X3D    = require ("../X3D"),
   Editor = require ("../Undo/Editor");

$.fn.MFStringTextArea = function (node, field)
{
   if (arguments .length === 0)
   {
      this .off ("change.MFStringTextArea");
      this .data ("field.MFStringTextArea") .removeFieldCallback (this .get (0));
   }
   else
   {
      if (typeof field === "string")
         field = node .getField (field);

      this .data ("field.MFStringTextArea", field);

      this .val (field .join ("\n")) .on ("change.MFStringTextArea", () =>
      {
         const value = new X3D .MFString (... this .val () ? this .val () .split ("\n") : [ ]);

         Editor .setFieldValue (node .getExecutionContext (), node, field, value);
      });

      field .addFieldCallback (this .get (0), () =>
      {
         this .val (field .join ("\n"));
      });
   }

   return this;
};
