/**
 * Converts Password Depot XML-Export to Bitwarden Conditioned JSON
 * Version 1.0.0
 * pre-configured for PasswordDepot version 10 and Bitwarden version 2024.9
 */

import PasswordDepotToBitwardenConverterConfig from "./conf/config-common.js";
import PasswordDepotToBitwardenConverterConfigVersion from "./conf/config-pd10.js";

function PasswordDepotToBitwardenConverterFieldValueConvertersObject()
{
	/**
	 *
	 * @param {string} dateValue
	 * @returns {Object}
	 */
	this.parseDate = (dateValue) =>
	{
		const
			result = {},
			dateParts = dateValue.split(PasswordDepotToBitwardenConverterConfig.dateTimeFormat.separatorInsideDate);

		for (let i=0; i<dateParts.length; i++) {
			result[PasswordDepotToBitwardenConverterConfig.dateTimeFormat.datePartsOrder[i]] = dateParts[i];
		}

		return result;
	};

	/**
	 *
	 * @param {string} dateTimeValue
	 * @returns {Object}
	 */
	this.parseDateTime = (dateTimeValue) =>
	{
		const
			result = {},
			[dateString, timeString] = dateTimeValue.split(PasswordDepotToBitwardenConverterConfig.dateTimeFormat.separatorBetweenDateAndTime),
			dateParts = dateString.split(PasswordDepotToBitwardenConverterConfig.dateTimeFormat.separatorInsideDate),
			timeParts = timeString.split(PasswordDepotToBitwardenConverterConfig.dateTimeFormat.separatorInsideTime);

		for (let i=0; i<dateParts.length; i++) {
			result[PasswordDepotToBitwardenConverterConfig.dateTimeFormat.datePartsOrder[i]] = dateParts[i];
		}

		for (let i = 0; i < timeParts.length; i++) {
			result[PasswordDepotToBitwardenConverterConfig.dateTimeFormat.timePartsOrder[i]] = timeParts[i];
		}

		return result;
	};

	/**
	 *
	 * @param {string} password
	 * @returns {string}
	 */
	this.convertHTMLSpecialChars = (password)=>
	{
		return he.decode(password);
	};

	/**
	 *
	 * @param {string} dateValue
	 * @returns {string}
	 */
	this.convertDateToISO = (dateValue)=>
	{
		let result = this.parseDate(dateValue);

		return (new Date(+result.year, +result.month - 1, +result.day)).toISOString();
	};

	/**
	 *
	 * @param {string} dateTimeValue
	 * @returns {string}
	 */
	this.convertDateTimeToISO = (dateTimeValue)=>
	{
		let result = this.parseDateTime(dateTimeValue);

		return (new Date(+result.year, +result.month - 1, +result.day, +result.hour, +result.minute, +result.second)).toISOString();
	};

	/**
	 *
	 * @param {string} passwordDepotCardType
	 * @returns {string}
	 */
	this.convertCardBrand = (passwordDepotCardType)=>
	{
		if (PasswordDepotToBitwardenConverterConfigVersion.creditCardBrands.hasOwnProperty(passwordDepotCardType)) {
			return PasswordDepotToBitwardenConverterConfigVersion.creditCardBrands[passwordDepotCardType];
		}

		throw new Error("unknown PasswortDepot credit card type: " + passwordDepotCardType);
	};

	/**
	 * @param {string} expirationDate
	 * @returns {string}
	 */
	this.convertCardExpirationMonth = (expirationDate)=>
	{
		return this.parseDate(expirationDate).month;
	}

	/**
	 * @param {string} expirationDate
	 * @returns {string}
	 */
	this.convertCardExpirationYear = (expirationDate)=>
	{
		return this.parseDate(expirationDate).year;
	}

	/**
	 * @param {string} uri
	 * @returns {Object[]|string}
	 */
	this.convertLoginUris = (uri) =>
	{
		if (PasswordDepotToBitwardenConverter.isStringEmpty(uri)) {
			return "";
		} else {
			return [{ uri: he.decode(uri) }];
		}
	};

	/**
	 * this is a pretty custom hack to merge PassworDepot's seperately stored house number into the Bitwarden
	 * address field; disable this conversion in the field mappings if it should cause problems during the import
	 *
	 * @param {string} houseNumber
	 * @param {Object} jsonItem
	 * @returns {null}
	 */
	this.convertIdentityHouseNumber = (houseNumber, jsonItem)=>
	{
		if ( ! PasswordDepotToBitwardenConverter.isStringEmpty(houseNumber))
		{
			for (const fieldMapping of PasswordDepotToBitwardenConverter.getFieldMappingsForTargetType(PasswordDepotToBitwardenConverterConfigVersion.bitwardenItemTypes.identity))
			{
				if (fieldMapping.passwordDepotFieldName === "IDS_IdentityAddress1")
				{
					let bitwardenContainerName = fieldMapping.bitwardenContainerName,
						bitwardenFieldName = fieldMapping.bitwardenFieldName;

					if (
						jsonItem.hasOwnProperty(bitwardenContainerName)
						&&
						jsonItem[bitwardenContainerName].hasOwnProperty(bitwardenFieldName)
					) {
						jsonItem[bitwardenContainerName][bitwardenFieldName] += (" " + houseNumber);
					}
				}
			}
		}

		return null;
	};
}

const PasswordDepotToBitwardenConverterFieldValueConverters = new PasswordDepotToBitwardenConverterFieldValueConvertersObject();

export default PasswordDepotToBitwardenConverterFieldValueConverters;