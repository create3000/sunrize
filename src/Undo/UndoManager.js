"use strict";

const
   util = require ("util"),
   _    = require ("../Application/GetText");

module .exports = class UndoManager
{
   static shared = new UndoManager (true);

   saveNeeded     = false;
   undoStack      = [ ];
   undoFunctions  = [ ];
   deferFunctions = new Map ();
   undoList       = [ ];
   undoIndex      = -1;
   undoLabel      = _("Undo");
   redoLabel      = _("Redo");

   undo ()
   {
      if (this .undoIndex < 0)
         return;

      const undoItem = this .undoList [this .undoIndex];

      // Call undo functions.

      this .beginUndo (undoItem .description);

      for (const undoFunction of undoItem .undoFunctions)
         undoFunction ();

      // Process deferred functions.

      for (const deferFunction of this .deferFunctions .values ())
         deferFunction ();

      // End undo.

      this .undoStack .pop ();

      // Assign redo functions.

      undoItem .redoFunctions = this .undoFunctions;
      this .undoFunctions     = [ ];
      this .deferFunctions    = new Map ();
      this .undoIndex        -= 1;
      this .saveNeeded        = true;

      // Make labels.

      if (this .undoIndex < 0)
         this .undoLabel = _("Undo");
      else
         this .undoLabel = util .format (_("Undo %s"), this .undoList [this .undoIndex] .description)

      this .redoLabel = util .format (_("Redo %s"), undoItem .description);

      // Propagate change.

      this .processInterests ();
   }

   redo ()
   {
      if (this .undoIndex + 1 >= this .undoList .length)
         return;

      this .undoIndex += 1;

      const undoItem = this .undoList [this .undoIndex];

      // Call redo functions.

      this .beginUndo (undoItem .description);

      for (const redoFunction of undoItem .redoFunctions)
         redoFunction ();

      // Process deferred functions.

      for (const deferFunction of this .deferFunctions .values ())
         deferFunction ();

      // End undo.

      this .undoStack .pop ();

      // Assign undo functions.

      undoItem .undoFunctions = this .undoFunctions;
      this .undoFunctions     = [ ];
      this .deferFunctions    = new Map ();
      this .saveNeeded        = true;

      // Make labels.

      this .undoLabel = util .format (_("Undo %s"), undoItem .description);

      if (this .undoIndex + 1 >= this .undoList .length)
         this .redoLabel = _("Redo");
      else
         this .redoLabel = util .format (_("Redo %s"), this .undoList [this .undoIndex + 1] .description);

      // Propagate change.

      this .processInterests ();
   }

   /**
    *
    * @param  {...string} args description
    */
   beginUndo (...args)
   {
      this .undoStack .push (util .format (...args));
   }

   endUndo ()
   {
      const description = this .undoStack .pop ();

      if (this .undoStack .length)
         return;

      // Process deferred functions.

      this .undoStack .push (description);

      for (const deferFunction of this .deferFunctions .values ())
         deferFunction ();

      this .undoStack .pop ();

      // Test if something happened.

      if (!this .undoFunctions .length)
         return;

      // Assign undo functions.

      this .undoList .length = this .undoIndex + 1;

      this .undoList .push ({
         description: description,
         undoFunctions: this .undoFunctions,
      });

      this .undoFunctions  = [ ];
      this .deferFunctions = new Map ();
      this .undoIndex      = this .undoList .length - 1;
      this .saveNeeded     = true;

      // Make labels.

      this .undoLabel = util .format (_("Undo %s"), description);
      this .redoLabel = _("Redo");

      // Propagate change.

      this .processInterests ();
   }

   /**
    *
    * @param {function} undoFunction
    */
   registerUndo (undoFunction)
   {
      this .undoFunctions .unshift (undoFunction);
   }

   /**
    * If only key is provided, the function return if there is already a defer function registered.
    * @param {*} key
    * @param {function=} deferFunction
    * @returns
    */
   defer (key, deferFunction)
   {
      if (arguments .length == 1)
         return this .deferFunctions .has (key);

      this .deferFunctions .set (key, deferFunction);
   }

   interests = new Map ();

   addInterest (key, callback)
   {
      this .interests .set (key, callback);
   }

   processInterests ()
   {
      for (const callback of this .interests .values ())
         callback ();
   }
};
