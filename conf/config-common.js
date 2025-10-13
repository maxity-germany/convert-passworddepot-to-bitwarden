/**
 * Converts Password Depot XML-Export to Bitwarden Conditioned JSON
 * Version 1.0.0
 * pre-configured for PasswordDepot version 10 and Bitwarden version 2024.9
 */

function PasswordDepotToBitwardenConverterConfigObject()
{
	/**
	 * START custom configuration
	 * Please adjust to fit your account and localization
	 */

	// has to be manually set before conversion when left empty
	this.bitwardenOrganizationId = "184c7224-f1f7-4e37-a900-b170009ca266";

	// datetime format used in your PasswordDepot export;
	// has to be defined manually, because Password Depot XML exports contain invalid date format strings
	// and date and time could therefore not be parsed automatically
	this.dateTimeFormat = {
		separatorBetweenDateAndTime: " ",
		separatorInsideDate: ".",
		separatorInsideTime: ":",
		datePartsOrder: ["day", "month", "year"],
		timePartsOrder: ["hour", "minute", "second"]
	};

	/**
	 * END custom configuration
	 */
}

const PasswordDepotToBitwardenConverterConfig = new PasswordDepotToBitwardenConverterConfigObject();

export default PasswordDepotToBitwardenConverterConfig;