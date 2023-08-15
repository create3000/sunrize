// Cannot use strict.
//"use strict"

const
	storages   = new WeakMap (),
	namespaces = new WeakMap (),
	defaults   = new WeakMap ()

const handler =
{
	get (target, key)
	{
		const property = target [key]

		if (property !== undefined)
			return property

		const
			storage   = target .getStorage (),
			namespace = target .getNameSpace (),
			value     = storage [namespace + key]

		if (value === undefined || value === "undefined" || value === null)
			return target .getDefaultValue (key)

		// Update timestamp.
		storage [namespace + key + ".#timeStamp"] = JSON .stringify (Date .now ())

		return JSON .parse (value)
	},
	set (target, key, value)
	{
		const
			storage   = target .getStorage (),
			namespace = target .getNameSpace ()

		if (value === undefined)
		{
			storage .removeItem (namespace + key + ".#timeStamp")
			storage .removeItem (namespace + key)
		}
		else
		{
			storage [namespace + key + ".#timeStamp"] = JSON .stringify (Date .now ())
			storage [namespace + key]                 = JSON .stringify (value)
		}

		return true
	},
	has (target, key)
	{
		const value = target .getStorage () [target .getNameSpace () + key]

		return !(value === undefined || value === "undefined" || value === null)
	},
	ownKeys (target)
	{
		const
			storage   = target .getStorage (),
			namespace = target .getNameSpace (),
			ownKeys   = [ ]

		for (const key of Object .keys (storage))
		{
			if (key .startsWith (namespace) && !key .endsWith (".#timeStamp"))
				ownKeys .push (key .substring (namespace .length))
		}

		return ownKeys
	},
	getOwnPropertyDescriptor (target, key)
	{
		const
			storage   = target .getStorage (),
			namespace = target .getNameSpace ()

		return Object .getOwnPropertyDescriptor (storage, namespace + key)
	},
}

module .exports = class DataStorage
{
	constructor (storage, namespace)
	{
		this .target = this

		storages   .set (this, storage)
		namespaces .set (this, namespace)
		defaults   .set (this, { })

		return new Proxy (this, handler)
	}

	/**
	 *
	 * @returns
	 */
	getStorage ()
	{
		return storages .get (this .target)
	}

	/**
	 *
	 * @returns string
	 */
	getNameSpace ()
	{
		return namespaces .get (this .target)
	}

	/**
	 *
	 * @param {string} namespace
	 * @returns DataStorage
	 */
	addNameSpace (namespace)
	{
		return new DataStorage (this .getStorage (), this .getNameSpace () + namespace)
	}

	/**
	 *
	 * @param {object} object
	 */
	setDefaultValues (object)
	{
		Object .assign (defaults .get (this .target), object)
	}

	/**
	 *
	 * @returns {object}
	 */
	getDefaultValues ()
	{
		return Object .assign ({ }, defaults .get (this .target))
	}

	/**
	 *
	 * @param {string} key
	 * @returns {any}
	 */
	getDefaultValue (key)
	{
		const value = defaults .get (this .target) [key]

		return value === undefined ? undefined : JSON .parse (JSON .stringify (value))
	}

	/**
	 *
	 * @param {number} before
	 */
	removeItems (before = Date .now ())
	{
		const
			storage   = this .getStorage (),
			namespace = this .getNameSpace ()

		for (const key of Object .keys (storage))
		{
			if (key .startsWith (namespace) && !key .endsWith (".#timeStamp"))
			{
				const timeStamp = JSON .parse (storage [key + ".#timeStamp"])

				if (timeStamp < before)
				{
					storage .removeItem (key + ".#timeStamp")
					storage .removeItem (key)
				}
			}
		}
	}

	clear ()
	{
		const
			storage   = this .getStorage (),
			namespace = this .getNameSpace ()

		for (const key of Object .keys (storage))
		{
			if (key .startsWith (namespace))
				storage .removeItem (key)
		}
	}
}
