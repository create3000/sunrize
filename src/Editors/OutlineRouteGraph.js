"use strict";

const
	$           = require ("jquery"),
   X3D         = require ("../X3D"),
	OutlineView = require ("./OutlineView");

const
	routeColor         = "#000000",
	routeSelectedColor = "rgb(255, 69, 58)";

module .exports = class OutlineRouteGraph extends OutlineView
{
   constructor (element)
   {
      super (element);

		this .selectedRoutes = new Set ();
   }

	selectRoutes (type, event)
	{
		// Select routes.

		const
			element = $(event .currentTarget) .closest (".field", this .sceneGraph),
			field   = this .getField (element);

		// Block default href.
		event .preventDefault ();
		event .stopImmediatePropagation ();

		this .selectedRoutes .clear ();

		switch (type)
		{
			case "input":
			{
				for (const route of field .getInputRoutes ())
				{
					this .selectedRoutes .add (route .getId ());
					this .expandTo (route .getSourceNode ());
				}

				break;
			}
			case "output":
			{
				for (const route of field .getOutputRoutes ())
				{
					this .selectedRoutes .add (route .getId ());
					this .expandTo (route .getDestinationNode ());
				}

				break;
			}
		}

		this .updateRouteGraph ();
	}

	selectSingleRoute (type, event)
	{
		// Select single route.

		const
			element = $(event .currentTarget) .closest (".route", this .sceneGraph),
			field   = this .getField (element);

		// Block default href.
		event .preventDefault ();
		event .stopImmediatePropagation ();

		this .selectedRoutes .clear ();

		switch (type)
		{
			case "input":
			{
				const route = this .getRoute (element, field .getInputRoutes ());

				this .selectedRoutes .add (route .getId ());
				this .expandTo (route .getSourceNode ());
				break;
			}
			case "output":
			{
				const route = this .getRoute (element, field .getOutputRoutes ());

				this .selectedRoutes .add (route .getId ());
				this .expandTo (route .getDestinationNode ());
				break;
			}
		}

		this .updateRouteGraph ();
	}

	updateRouteGraph ()
	{
		const canvases = this .sceneGraph .find (".route-curves canvas");

		// Determine visible fields.

		const fields = new Set ();

		canvases .each ((i, canvas) =>
		{
			const element = $(canvas)
				.closest ("li[node-id][field-id]", this .sceneGraph);

			if (!element .length)
				return;

			fields .add (this .getField (element));
		})

		this .sceneGraph
			.find ("canvas.field-routes")
			.each ((i, canvas) => this .updateFieldRoutes ($(canvas), fields));

		this .sceneGraph
			.find ("canvas.single-route")
			.each ((i, canvas) => this .updateSingleRoute ($(canvas), fields));

		this .updateRouteCurves (canvases, fields);
	}

	updateFieldRoutes ($canvas, fields)
	{
		// Draw horizontal lines.

		const
			element = $canvas .closest (".field", this .sceneGraph),
			field   = this .getField (element),
			parent  = $canvas .parent (),
			canvas  = $canvas .get (0),
			context = canvas .getContext ("2d");

		$canvas .height (Math .ceil (parent .height ()));

		canvas .width  = $canvas .width ();
		canvas .height = $canvas .height ();

		context .clearRect (0, 0, canvas .width, canvas .height);

		switch (field .getAccessType ())
		{
			case X3D .X3DConstants .initializeOnly:
			{
				break;
			}
			case X3D .X3DConstants .inputOnly:
			{
				if (field .getInputRoutes () .size)
				{
					if (this .hasSourceField (fields, field))
					{
						context .strokeStyle = this .haveSelectedRoute (field .getInputRoutes ()) ? routeSelectedColor : routeColor;

						context .beginPath ();
						context .moveTo (26, 3.5);
						context .lineTo (canvas .width + 1, 3.5);
						context .stroke ();
					}
				}

				break
			}
			case X3D .X3DConstants .outputOnly:
			{
				if (field .getOutputRoutes () .size)
				{
					if (this .hasDestinationField (fields, field))
					{
						context .strokeStyle = this .haveSelectedRoute (field .getOutputRoutes ()) ? routeSelectedColor : routeColor;

						context .beginPath ();
						context .moveTo (26, 8.5);
						context .lineTo (canvas .width + 1, 8.5);
						context .stroke ();
					}
				}

				break
			}
			case X3D .X3DConstants .inputOutput:
			{
				if (field .getInputRoutes () .size)
				{
					if (this .hasSourceField (fields, field))
					{
						context .strokeStyle = this .haveSelectedRoute (field .getInputRoutes ()) ? routeSelectedColor : routeColor;

						context .beginPath ();
						context .moveTo (40, 3.5);
						context .lineTo (canvas .width + 1, 3.5);
						context .stroke ();
					}
				}

				if (field .getOutputRoutes () .size)
				{
					if (this .hasDestinationField (fields, field))
					{
						context .strokeStyle = this .haveSelectedRoute (field .getOutputRoutes ()) ? routeSelectedColor : routeColor;

						context .beginPath ();
						context .moveTo (field .getInputRoutes () .size ? 54 : 40, 8.5);
						context .lineTo (canvas .width + 1, 8.5);
						context .stroke ();
					}
				}

				break;
			}
		}
	}

	updateSingleRoute ($canvas, fields)
	{
		// Draw horizontal line.

		const
			element = $canvas .closest (".route", this .sceneGraph),
			type    = element .attr ("route-type"),
			parent  = $canvas .parent (),
			canvas  = $canvas .get (0),
			context = canvas .getContext ("2d");

		$canvas .height (Math .ceil (parent .height ()));

		canvas .width  = $canvas .width ();
		canvas .height = $canvas .height ();

		context .clearRect (0, 0, canvas .width, canvas .height);

		switch (type)
		{
			case "input":
			{
				const
					field = this .getField (element),
					route = this .getRoute (element, field .getInputRoutes ());

				if (!route)
					break;

				if (!fields .has (route .getSourceNode () .getField (route .sourceField)))
					break;

				context .strokeStyle = this .selectedRoutes .has (route .getId ()) ? routeSelectedColor : routeColor;

				context .beginPath ();
				context .moveTo (26, 3.5);
				context .lineTo (canvas .width + 1, 3.5);
				context .stroke ();
				break;
			}
			case "output":
			{
				const
					field = this .getField (element),
					route = this .getRoute (element, field .getOutputRoutes ());

				if (!route)
					break;

				if (!fields .has (route .getDestinationNode () .getField (route .destinationField)))
					break;

				context .strokeStyle = this .selectedRoutes .has (route .getId ()) ? routeSelectedColor : routeColor;

				context .beginPath ();
				context .moveTo (26, 8.5);
				context .lineTo (canvas .width + 1, 8.5);
				context .stroke ();
				break;
			}
		}
	}

	updateRouteCurves (canvases, fields)
	{
		// Scale canvases

		for (let i = 0, length = canvases .length - 1; i < length; ++ i)
		{
			const
				canvas1 = $(canvases [i]),
				canvas2 = $(canvases [i + 1]),
				rect1   = canvas1 [0] .getBoundingClientRect (),
				rect2   = canvas2 [0] .getBoundingClientRect ();

			canvas1 .height (Math .ceil (rect2 .y - rect1 .y));

			canvas1 [0] .width  = canvas1 .width ();
			canvas1 [0] .height = canvas1 .height ();
		}

		// Draw arcs or vertical lines.

		const routes = new Set ();

		canvases .each ((i, canvas) =>
		{
			const
				element = $(canvas) .closest ("li", this .sceneGraph),
				context = canvas .getContext ("2d");

			// Clear canvases.

			context .clearRect (0, 0, canvas .width, canvas .height);

			const selectedRoutes = new Set (routes);

			if (element .length && (element .hasClass ("field") && !element .data ("full-expanded")) || element .hasClass ("route"))
			{
				const
					field   = this .getField (element),
					routeId = element .attr ("route-id") !== undefined ? parseInt (element .attr ("route-id")) : undefined;

				let
					inputRoutesDown          = 0,
					inputRoutesUp            = 0,
					outputRoutesDown         = 0,
					outputRoutesUp           = 0,
					selectedInputRoutesUp    = 0,
					selectedInputRoutesDown  = 0,
					selectedOutputRoutesUp   = 0,
					selectedOutputRoutesDown = 0;

				field .getInputRoutes () .forEach (route =>
				{
					if (routeId !== undefined && route .getId () !== routeId)
						return;

					if (!fields .has (route .getSourceNode () .getField (route .sourceField)))
						return;

					if (routes .has (route))
					{
						inputRoutesUp         += 1;
						selectedInputRoutesUp += this .selectedRoutes .has (route .getId ());

						routes         .delete (route);
						selectedRoutes .delete (route);
					}
					else
					{
						inputRoutesDown         += 1;
						selectedInputRoutesDown += this .selectedRoutes .has (route .getId ());

						routes .add (route);
					}
				},
				this)

				field .getOutputRoutes () .forEach (route =>
				{
					if (routeId !== undefined && route .getId () !== routeId)
						return;

					if (!fields .has (route .getDestinationNode () .getField (route .destinationField)))
						return;

					if (routes .has (route))
					{
						outputRoutesUp         += 1;
						selectedOutputRoutesUp += this .selectedRoutes .has (route .getId ());

						routes         .delete (route);
						selectedRoutes .delete (route);
					}
					else
					{
						outputRoutesDown         += 1;
						selectedOutputRoutesDown += this .selectedRoutes .has (route .getId ());

						routes .add (route);
					}
				});

				// Determine vertical selected lines.

				const verticalSelectedRoute = this .haveSelectedRoute (selectedRoutes);

				function draw (state, selected) { return (state === "normal" && !selected) || (state === "selected" && selected) }

				["normal", "selected"] .forEach (state =>
				{
					// Draw curve up.

					if (inputRoutesUp)
					{
						// Input curve up.

						if (draw (state, selectedInputRoutesUp))
						{
							context .strokeStyle = selectedInputRoutesUp ? routeSelectedColor : routeColor;

							context .beginPath ();
							context .arc (0, 0, 9.5, 1/2 * Math .PI, 2 * Math .PI, true);
							context .lineTo (9.5, 0);
							context .stroke ();
						}
					}

					if (outputRoutesUp)
					{
						// Output curve up.

						if (draw (state, selectedOutputRoutesUp))
						{
							context .strokeStyle = selectedOutputRoutesUp ? routeSelectedColor : routeColor;

							context .beginPath ();
							context .arc (0, 5, 9.5, 1/2 * Math .PI, 2 * Math .PI, true);
							context .lineTo (9.5, 0);
							context .stroke ();
						}
					}

					// Draw curve down.

					if (inputRoutesDown)
					{
						// Input curve down.

						if (draw (state, selectedInputRoutesDown))
						{
							context .strokeStyle = selectedInputRoutesDown ? routeSelectedColor : routeColor;

							context .beginPath ();
							context .arc (0, 19, 9.5, 3/2 * Math .PI, 2 * Math .PI);
							context .lineTo (9.5, canvas .height + 1);
							context .stroke ();
						}
					}

					if (outputRoutesDown)
					{
						// Output curve down.

						if (draw (state, selectedOutputRoutesDown))
						{
							context .strokeStyle = selectedOutputRoutesDown ? routeSelectedColor : routeColor;

							context .beginPath ();
							context .arc (0, 24, 9.5, 3/2 * Math .PI, 2 * Math .PI);
							context .lineTo (9.5, canvas .height + 1);
							context .stroke ();
						}
					}

					// Draw vertical line.

					if (routes .size - (inputRoutesDown + outputRoutesDown) > 0)
					{
						if (draw (state, verticalSelectedRoute))
						{
							context .strokeStyle = verticalSelectedRoute ? routeSelectedColor : routeColor;

							context .beginPath ();
							context .moveTo (9.5, 0);
							context .lineTo (9.5, canvas .height + 1);
							context .stroke ();
						}
					}
				})
			}
			else
			{
				// Draw vertical line.

				if (routes .size)
				{
					context .strokeStyle = this .haveSelectedRoute (routes) ? routeSelectedColor : routeColor;

					context .beginPath ();
					context .moveTo (9.5, 0);
					context .lineTo (9.5, canvas .height + 1);
					context .stroke ();
				}
			}
		})
	}

	hasSourceField (fields, field)
	{
		for (const route of field .getInputRoutes ())
		{
			if (fields .has (route .getSourceNode () .getField (route .sourceField)))
				return true;
		}

		return false;
	}

	hasDestinationField (fields, field)
	{
		for (const route of field .getOutputRoutes ())
		{
			if (fields .has (route .getDestinationNode () .getField (route .destinationField)))
				return true;
		}

		return false;
	}

	haveSelectedRoute (routes)
	{
		for (const route of routes)
		{
			if (this .selectedRoutes .has (route .getId ()))
				return true;
		}

		return false;
	}
};
