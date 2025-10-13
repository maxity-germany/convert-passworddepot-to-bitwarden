/**
 * Converts Password Depot XML-Export to Bitwarden Conditioned JSON
 * Version 1.0.0
 * pre-configured for PasswordDepot version 10 and Bitwarden version 2024.9
 */

import PasswordDepotToBitwardenConverterConfig from "./conf/config-common.js";
import PasswordDepotToBitwardenConverterConfigVersion from "./conf/config-pd10.js";

function PasswordDepotToBitwardenConverterObject()
{
	this.bitwardenSceleton = {
		collections: [],
		items: []
	};

	this.convertFromFile = (file, resultCallback) =>
	{
		if (file)
		{
			const reader = new FileReader();

			reader.addEventListener(
				"load",
				() =>
				{
					let result = this.convertFromString(reader.result);

					if (resultCallback instanceof Function) {
						resultCallback.call(this, result);
					}
				},
				false,
			);

			reader.readAsText(file);
		}
		else
		{
			if (resultCallback instanceof Function) {
				resultCallback.call(this, this.bitwardenSceleton);
			}
		}
	};

	/**
	 * @param {string} sourceContent
	 * @returns {Object} Bitwarden conditioned JSON
	 */
	this.convertFromString = (sourceContent) =>
	{
		let result = this.bitwardenSceleton;

		const DomParser = new DOMParser();

		for (const firstLevelItem of DomParser.parseFromString(sourceContent, "application/xml").querySelector("PASSWORDFILE").children)
		{
			if (firstLevelItem.tagName !== "PASSWORDS") {
				continue;
			}

			result = this.convertFirstLevelGroup(firstLevelItem.querySelector("GROUP"), null, null, result);
		}

		return result;
	};

	/**
	 * recursively parses groupElement
	 *
	 * @param {Element} groupElement
	 * @param {string|null} groupName
	 * @param {string|null} groupFingerprint
	 * @param {Object} result
	 * @returns {Object}
	 */
	this.convertFirstLevelGroup = (groupElement, groupName, groupFingerprint, result)  =>
	{
		for (const node of groupElement.children)
		{
			switch (node.tagName)
			{
				case "GROUP":

					let myGroupName = node.getAttribute("NAME").replaceAll("/", "|"),
						myGroupNameFull = (groupName === null ? "" : groupName + "/") + myGroupName,
						myGroupFingerprint = node.getAttribute("fingerprint");

					result.collections.push({
						id: myGroupFingerprint,
						organizationId: PasswordDepotToBitwardenConverterConfig.bitwardenOrganizationId,
						name: myGroupNameFull
					});

					result = this.convertFirstLevelGroup(node, myGroupNameFull, myGroupFingerprint, result);

					break;

				case "ITEM":

					let jsonItem = {
							organizationId: PasswordDepotToBitwardenConverterConfig.bitwardenOrganizationId,
							collectionIds: [groupFingerprint],
							type: null
						},
						sourceType = NaN;

					// determine source and target item types

					const [fieldNode] = node.getElementsByTagName("TYPE");

					if (typeof fieldNode !== "undefined")
					{
						sourceType = parseInt(fieldNode.innerHTML);
						jsonItem.type = this.convertItemType(sourceType);
					}

					// if target item type found: assign properties

					if (
						! isNaN(sourceType)
						&&
						jsonItem.type !== null)
					{
						this.convertItem(node, sourceType, jsonItem);

						result.items.push(jsonItem);
					}

					break;
			}
		}

		return result;
	};

	/**
	 * @param {Element} node
	 * @param {int} sourceType
	 * @param {Object} jsonItem
	 * @returns {Object}
	 */
	this.convertItem = (node, sourceType, jsonItem)  =>
	{
		this.assignFields(sourceType, 0, node, jsonItem);
		this.assignFields(sourceType, jsonItem.type, node, jsonItem);
		this.assignCustomFields(sourceType, jsonItem.type, node, jsonItem);
	};

	/**
	 *
	 * @param {int} sourceType
	 * @returns {Object|null}
	 */
	this.getItemTypeMappingForSourceType = (sourceType) =>
	{
		for (const itemTypeMapping in PasswordDepotToBitwardenConverterConfigVersion.itemTypeMappings)
		{
			if (PasswordDepotToBitwardenConverterConfigVersion.itemTypeMappings[itemTypeMapping].sourceType === sourceType) {
				return PasswordDepotToBitwardenConverterConfigVersion.itemTypeMappings[itemTypeMapping];
			}
		}

		return null;
	}

	/**
	 * @param {int} targetType
	 * @returns {Object[]}
	 */
	this.getFieldMappingsForTargetType = (targetType) =>
	{
		for (const fieldMapping of PasswordDepotToBitwardenConverterConfigVersion.fieldMappings)
		{
			if (fieldMapping.itemType === targetType) {
				return fieldMapping.fields;
			}
		}

		return [];
	};

	/**
	 * @param {int} sourceType
	 * @param {int} targetType
	 * @returns {Object[]}
	 */
	this.getCustomFieldMappingsForSourceAndTargetType = (sourceType, targetType) =>
	{
		let result = [];

		for (const customFieldMapping of PasswordDepotToBitwardenConverterConfigVersion.customFieldMappings)
		{
			for (const mapping of customFieldMapping.mappings)
			{
				if (
					mapping.sourceType === sourceType
					&&
					mapping.targetType === targetType
				) {
					result.push(customFieldMapping);
					break;
				}
			}
		}

		return result;
	};

	/**
	 * @param {int} sourceType
	 * @param {int} targetType
	 * @param {Element} node
	 * @param {Object} jsonItem
	 */
	this.assignFields = (sourceType, targetType, node, jsonItem) =>
	{
		for (const fieldMapping of this.getFieldMappingsForTargetType(targetType))
		{
			let sourceFieldName = (fieldMapping.hasOwnProperty("sourceFieldName") ? fieldMapping.sourceFieldName : null),
				staticValue = (fieldMapping.hasOwnProperty("staticValue") ? fieldMapping.staticValue : null),
				limitToSourceType = (fieldMapping.hasOwnProperty("limitToSourceType") ? fieldMapping.limitToSourceType : null),
				fieldValue = null;

			if (
				limitToSourceType !== null
				&&
				limitToSourceType !== sourceType
			) {
				continue;
			}

			if (sourceFieldName !== null) {
				fieldValue = this.getFieldValue(sourceFieldName, fieldMapping, node, jsonItem);
			} else if (staticValue !== null) {
				fieldValue = staticValue;
			} else {
				this.raiseError("could not find a suitable import field value (no source field name and no static value defined for this field mapping)");
			}

			if (fieldValue !== null)
			{
				if (fieldMapping.hasOwnProperty("targetContainerName"))
				{
					if (!(fieldMapping.targetContainerName in jsonItem)) {
						jsonItem[fieldMapping.targetContainerName] = {};
					}

					jsonItem[fieldMapping.targetContainerName][fieldMapping.targetFieldName] = fieldValue;
				} else {
					jsonItem[fieldMapping.targetFieldName] = fieldValue;
				}
			}
		}
	};

	/**
	 * @param {int} sourceType
	 * @param {int} targetType
	 * @param {Element} node
	 * @param {Object} jsonItem
	 */
	this.assignCustomFields = (sourceType, targetType, node, jsonItem) =>
	{
		for (const customFieldMapping of this.getCustomFieldMappingsForSourceAndTargetType(sourceType, targetType))
		{
			let sourceFieldName = customFieldMapping.sourceFieldName,
				fieldValue = this.getFieldValue(sourceFieldName, customFieldMapping, node, jsonItem);

			if (fieldValue !== null && fieldValue !== "")
			{
				if ( ! jsonItem.hasOwnProperty("fields")) {
					jsonItem.fields = [];
				}

				jsonItem.fields.push({
					name: customFieldMapping.targetFieldLabel,
					value: fieldValue,
					type: customFieldMapping.targetFieldType
				});
			}
		}
	};

	/**
	 * @param {any} elemFieldValue
	 * @param {Object} fieldMapping
	 * @returns {any}
	 */
	this.getSaneFieldValue = (elemFieldValue, fieldMapping) =>
	{
		let alwaysAssign = (fieldMapping.hasOwnProperty("alwaysAassign") && fieldMapping.alwaysAassign === true);

		// assign value only when it's not empty or alwaysAassign option is true
		if (
			alwaysAssign
			||
			!this.isStringEmpty(elemFieldValue)
		) {
			if (fieldMapping.hasOwnProperty("maxLength"))
			{
				let maxLength = parseInt(fieldMapping.maxLength);

				if (
					! isNaN(maxLength)
					&&
					maxLength > 0
					&&
					elemFieldValue.toString().length > maxLength
				) {
					return elemFieldValue.toString().substring(0, maxLength);
				}
			}

			return elemFieldValue;
		}

		return null;
	};

	/**
	 * @param {string} sourceFieldName
	 * @param {Object} customFieldMapping
	 * @param {Element} node
	 * @param {Object} jsonItem
	 * @returns {any}
	 */
	this.getCustomFieldValue = (sourceFieldName, customFieldMapping, node, jsonItem) =>
	{
		let result = null;

		const [elem] = node.getElementsByTagName("CUSTOMFIELDS");

		if (typeof elem !== "undefined")
		{
			for (const customField of elem.getElementsByTagName("FIELD"))
			{
				if (customField.querySelector("NAME").innerHTML === sourceFieldName)
				{
					result =
						this.getSaneFieldValue(
							this.convertFieldValue(customField.querySelector("VALUE").innerHTML, customFieldMapping.converter || null, jsonItem),
							customFieldMapping
						);
				}
			}
		}

		return result;
	}

	/**
	 * @param {string} sourceFieldName
	 * @param {Object} fieldMapping
	 * @param {Element} node
	 * @param {Object} jsonItem
	 * @returns {any}
	 */
	this.getFieldValue = (sourceFieldName, fieldMapping, node, jsonItem) =>
	{
		let result = null;

		// allow multiple field mapping entries of the same source field name, because this
		// might be necessary for some field values to be split into multiple different target fields

		// custom field
		if (sourceFieldName.startsWith("IDS_")) {
			result = this.getCustomFieldValue(sourceFieldName, fieldMapping, node, jsonItem);
		}

		// directly assigned field
		for (const elem of node.getElementsByTagName(sourceFieldName))
		{
			result =
				this.getSaneFieldValue(
					this.convertFieldValue(elem.innerHTML, fieldMapping.converter || null, jsonItem),
					fieldMapping
				);
		}

		return result;
	}

	/**
	 * @param {string} fieldValue
	 * @param {Function|null} converter
	 * @param {Object} jsonItem
	 * @returns {any}
	 */
	this.convertFieldValue = (fieldValue, converter, jsonItem) =>
	{
		let fValue = he.decode(fieldValue);

		if (converter === null) {
			return fValue;
		} else {
			return converter.call(this, fValue, jsonItem);
		}
	};

	/**
	 * @param {int} sourceType
	 * @returns {int}
	 */
	this.convertItemType = (sourceType) =>
	{
		let result = this.getItemTypeMappingForSourceType(sourceType);

		if (result !== null) {
			return this.getItemTypeMappingForSourceType(sourceType).targetType;
		}

		this.raiseError("unknown PasswortDepot item type: " + sourceType);
	};

	/**
	 * convenience functions
	 */

	/**
	 * @param {string|null} s
	 */
	this.isStringEmpty = (s) =>
	{
		return (s === null || s === "");
	}

	/**
	 * @param {string} errorMsg
	 */
	this.raiseError = (errorMsg) =>
	{
		let elemErrorMessage = document.getElementById("errorMsg");

		elemErrorMessage.style.display = "block";
		elemErrorMessage.textContent = errorMsg;

		throw new Error(errorMsg);
	}
}

const PasswordDepotToBitwardenConverter = new PasswordDepotToBitwardenConverterObject();

export default PasswordDepotToBitwardenConverter;