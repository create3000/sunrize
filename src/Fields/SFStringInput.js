const
   $      = require ("jquery"),
   Editor = require ("../Undo/Editor");

$.fn.SFStringInput = function (node, field)
{
   if (arguments .length === 0)
   {
      this .off ("change.SFStringInput");
      this .data ("field.SFStringInput") .removeFieldCallback (this .get (0));
   }
   else
   {
      if (typeof field === "string")
         field = node .getField (field);

      this .data ("field.SFStringInput", field);

      this .val (field .getValue ()) .on ("change.SFStringInput", () =>
      {
         Editor .setFieldValue (node .getExecutionContext (), node, field, this .val ());
      });

      field .addFieldCallback (this .get (0), () =>
      {
         this .val (field .getValue ());
         this .trigger ("blur");
      });
   }

   return this;
};
