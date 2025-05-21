/**
 * Converts Password Depot XML-Export to Bitwarden Conditioned JSON
 * Version 1.0.0
 * pre-configured for PasswordDepot version 10 and Bitwarden version 2024.9
 */

import PasswordDepotToBitwardenConverterFieldValueConverters from "../converter-helpers.js";

function PasswordDepotToBitwardenConverterConfigVersionObject()
{
	/**
	 * The following values are configured for PasswordDepot version 10 and Bitwarden version 2024.9;
	 * You may try to adjust them to different versions if you like
	 */

	/**
	 * START version related configuration
	 */

	// maximum allowed length of field notes (will be truncated during conversion if longer)
	this.bitwardenMaxNotesLength = 7000;

	// credit card brands supported by both password managers
	this.creditCardBrands = {
		"0": "Mastercard",
		"1": "Discover",
		"2": "Visa",
		"3": "American Express",
		"4": "JCB",
		"5": "Diners Club"
	};

	this.passwordDepotItemTypes = {
		password: 0,
		creditcard: 1,
		license: 2,
		identity: 3,
		note: 4,
		maestro: 5,
		encryptedfile: 6, // PD 10 does not export file contents, only meta data will be converted
		document: 7 // PD 10 does not export file contents, only meta data will be converted
	};

	this.bitwardenItemTypes = {
		login: 1,
		notes: 2,
		card: 3,
		identity: 4
	};

	this.customBitwardenFieldTypes = {
		text: 0,
		hidden: 1,
		boolean: 2
	};

	this.itemTypeMappings = {
		password: { sourceType: this.passwordDepotItemTypes.password, targetType: this.bitwardenItemTypes.login },
		creditcard: { sourceType: this.passwordDepotItemTypes.creditcard, targetType: this.bitwardenItemTypes.card },
		license: { sourceType: this.passwordDepotItemTypes.license, targetType: this.bitwardenItemTypes.notes },
		identity: { sourceType: this.passwordDepotItemTypes.identity, targetType: this.bitwardenItemTypes.identity },
		note: { sourceType: this.passwordDepotItemTypes.note, targetType: this.bitwardenItemTypes.notes },
		maestro: { sourceType: this.passwordDepotItemTypes.maestro, targetType: this.bitwardenItemTypes.card },
		encryptedfile: { sourceType: this.passwordDepotItemTypes.encryptedfile, targetType: this.bitwardenItemTypes.notes },
		document: { sourceType: this.passwordDepotItemTypes.document, targetType: this.bitwardenItemTypes.notes }
	};

	/**
	 * mappings of all fields that can be assigned unambiguously
	 *
	 * possible "fields" object properties:
	 *
	 * sourceFieldName|staticvalue: string|any
	 * targetFieldName: string
	 * [targetContainerName]: string
	 * [alwaysAassign]: boolean (default: false) always create this field in the export even if it's empty
	 * [converter]: function callback for custom source value conversion
	 * [limitToSourceType]: only processed when given source type is matching
	 * [maxLength]: apply Bitwarden's max text field length for fields that may contain large amounts of text
	 */
	this.fieldMappings = [
		{
			itemType: 0, // common fields across all types
			fields: [
				{
					sourceFieldName: "DESCRIPTION",
					targetFieldName: "name",
					alwaysAassign: true
				},
				{
					sourceFieldName: "FINGERPRINT",
					targetFieldName: "id"
				},
				{
					sourceFieldName: "CREATED",
					targetFieldName: "creationDate",
					converter: PasswordDepotToBitwardenConverterFieldValueConverters.convertDateTimeToISO
				},
				{
					sourceFieldName: "LASTMODIFIED",
					targetFieldName: "revisionDate",
					converter: PasswordDepotToBitwardenConverterFieldValueConverters.convertDateTimeToISO
				},
				{
					sourceFieldName: "COMMENT",
					targetFieldName: "notes",
					maxLength: this.bitwardenMaxNotesLength
				}
			]
		},
		{
			itemType: this.bitwardenItemTypes.login,
			fields: [
				{
					sourceFieldName: "USERNAME",
					targetContainerName: "login",
					targetFieldName: "username",
					alwaysAassign: true
				},
				{
					sourceFieldName: "PASSWORD",
					targetContainerName: "login",
					targetFieldName: "password",
					alwaysAassign: true
				},
				{
					sourceFieldName: "URL",
					targetContainerName: "login",
					targetFieldName: "uris",
					converter: PasswordDepotToBitwardenConverterFieldValueConverters.convertLoginUris
				}
			]
		},
		{
			itemType: this.bitwardenItemTypes.notes,
			fields: [
				{
					sourceFieldName: "IDS_InformationText",
					targetFieldName: "notes",
					maxLength: this.bitwardenMaxNotesLength
				},
				{
					staticValue: 0,
					targetContainerName: "secureNote",
					targetFieldName: "type"
				}
			]
		},
		{
			itemType: this.bitwardenItemTypes.card,
			fields: [

				// all cards

				{
					sourceFieldName: "IDS_CardCode",
					targetContainerName: "card",
					targetFieldName: "code",
					alwaysAassign: true
				},
				{
					sourceFieldName: "EXPIRYDATE",
					targetContainerName: "card",
					targetFieldName: "expMonth",
					converter: PasswordDepotToBitwardenConverterFieldValueConverters.convertCardExpirationMonth
				},
				{
					sourceFieldName: "EXPIRYDATE",
					targetContainerName: "card",
					targetFieldName: "expYear",
					converter: PasswordDepotToBitwardenConverterFieldValueConverters.convertCardExpirationYear
				},

				// credit cards

				{
					limitToSourceType: this.passwordDepotItemTypes.creditcard,
					sourceFieldName: "IDS_CardType",
					targetContainerName: "card",
					targetFieldName: "brand",
					converter: PasswordDepotToBitwardenConverterFieldValueConverters.convertCardBrand
				},
				{
					limitToSourceType: this.passwordDepotItemTypes.creditcard,
					sourceFieldName: "IDS_CardHolder",
					targetContainerName: "card",
					targetFieldName: "cardholderName"
				},
				{
					limitToSourceType: this.passwordDepotItemTypes.creditcard,
					sourceFieldName: "IDS_CardNumber",
					targetContainerName: "card",
					targetFieldName: "number",
					alwaysAassign: true
				},

				// ec/maestro cards

				{
					limitToSourceType: this.passwordDepotItemTypes.maestro,
					sourceFieldName: "IDS_ECHolder",
					targetContainerName: "card",
					targetFieldName: "cardholderName"
				},
				{
					limitToSourceType: this.passwordDepotItemTypes.maestro,
					sourceFieldName: "IDS_ECCardNumber",
					targetContainerName: "card",
					targetFieldName: "number"
				},
				{
					limitToSourceType: this.passwordDepotItemTypes.maestro,
					staticValue: "Maestro",
					targetContainerName: "card",
					targetFieldName: "brand"
				}
			]
		},
		{
			itemType: this.bitwardenItemTypes.identity,
			fields: [
				{
					sourceFieldName: "IDS_IdentityName",
					targetContainerName: "identity",
					targetFieldName: "username"
				},
				{
					sourceFieldName: "IDS_IdentityEmail",
					targetContainerName: "identity",
					targetFieldName: "email"
				},
				{
					sourceFieldName: "IDS_IdentityFirstName",
					targetContainerName: "identity",
					targetFieldName: "firstName"
				},
				{
					sourceFieldName: "IDS_IdentityLastName",
					targetContainerName: "identity",
					targetFieldName: "lastName"
				},
				{
					sourceFieldName: "IDS_IdentityCompany",
					targetContainerName: "identity",
					targetFieldName: "company"
				},
				{
					sourceFieldName: "IDS_IdentityAddress1",
					targetContainerName: "identity",
					targetFieldName: "address1"
				},
				{
					sourceFieldName: "IDS_IdentityAddress2",
					targetContainerName: "identity",
					targetFieldName: "address2"
				},
				{
					sourceFieldName: "IDS_IdentityCity",
					targetContainerName: "identity",
					targetFieldName: "city"
				},
				{
					sourceFieldName: "IDS_IdentityState",
					targetContainerName: "identity",
					targetFieldName: "state"
				},
				{
					sourceFieldName: "IDS_IdentityZIP",
					targetContainerName: "identity",
					targetFieldName: "postalCode"
				},
				{
					sourceFieldName: "IDS_IdentityCountry",
					targetContainerName: "identity",
					targetFieldName: "country"
				},
				{
					sourceFieldName: "IDS_IdentityPhone",
					targetContainerName: "identity",
					targetFieldName: "phone"
				},
				{
					// this converter is a hack to merge PassworDepot's seperately stored house numbers
					// into Bitwarden's merged address field;
					// disable this conversion if it should cause problems during the conversion

					sourceFieldName: "IDS_IdentityHouseNumber",
					targetContainerName: "identity",
					targetFieldName: "houseNumber",
					converter: PasswordDepotToBitwardenConverterFieldValueConverters.convertIdentityHouseNumber
				}
			]
		}
	];

	/**
	 * mappings of source fields that are not pre-defined by target and are therefore added as target custom fields
	 *
	 * possible properties:
	 *
	 * sourceFieldName: string
	 * mappings: array of itemTypeMappings that may contain this field mapping
	 * targetFieldType: int
	 * targetFieldLabel: string
	 */
	this.customFieldMappings = [
		{
			sourceFieldName: "CATEGORY",
			mappings: [
				this.itemTypeMappings.password,
				this.itemTypeMappings.encryptedfile,
				this.itemTypeMappings.document
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Category",
		},
		{
			sourceFieldName: "PASSWORD",
			mappings: [
				this.itemTypeMappings.maestro,
				this.itemTypeMappings.encryptedfile
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Password",
		},
		{
			sourceFieldName: "IDS_CardPhone",
			mappings: [
				this.itemTypeMappings.creditcard
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Service hotline",
		},
		{
			sourceFieldName: "IDS_CardURL",
			mappings: [
				this.itemTypeMappings.creditcard
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Service website",
		},
		{
			sourceFieldName: "IDS_CardAdditionalCode",
			mappings: [
				this.itemTypeMappings.creditcard
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Additional card code",
		},
		{
			sourceFieldName: "IDS_CardAdditionalInfo",
			mappings: [
				this.itemTypeMappings.creditcard
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Additional information",
		},
		{
			sourceFieldName: "IDS_CardPIN",
			mappings: [
				this.itemTypeMappings.creditcard
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "PIN",
		},
		{
			sourceFieldName: "USERNAME",
			mappings: [
				this.itemTypeMappings.maestro
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Login",
		},
		{
			sourceFieldName: "URL",
			mappings: [
				this.itemTypeMappings.maestro
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Website",
		},
		{
			sourceFieldName: "IDS_ECAccountNumber",
			mappings: [
				this.itemTypeMappings.maestro
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Account number",
		},
		{
			sourceFieldName: "IDS_ECBLZ",
			mappings: [
				this.itemTypeMappings.maestro
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Bank code",
		},
		{
			sourceFieldName: "IDS_ECBankName",
			mappings: [
				this.itemTypeMappings.maestro
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Bank name",
		},
		{
			sourceFieldName: "IDS_ECBIC",
			mappings: [
				this.itemTypeMappings.maestro
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "BIC",
		},
		{
			sourceFieldName: "IDS_ECIBAN",
			mappings: [
				this.itemTypeMappings.maestro
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "IBAN",
		},
		{
			sourceFieldName: "IDS_ECPhone",
			mappings: [
				this.itemTypeMappings.maestro
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Service hotline",
		},
		{
			sourceFieldName: "IDS_ECLegitimacyID",
			mappings: [
				this.itemTypeMappings.maestro
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Legitimation Id",
		},
		{
			sourceFieldName: "IDS_ECPIN",
			mappings: [
				this.itemTypeMappings.maestro
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "PIN",
		},
		{
			sourceFieldName: "IDS_LicenseKey",
			mappings: [
				this.itemTypeMappings.license
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "License key",
		},
		{
			sourceFieldName: "IDS_LicenseName",
			mappings: [
				this.itemTypeMappings.license
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Registered name",
		},
		{
			sourceFieldName: "IDS_LicenseURL",
			mappings: [
				this.itemTypeMappings.license
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Download URL",
		},
		{
			sourceFieldName: "IDS_LicenseProduct",
			mappings: [
				this.itemTypeMappings.license
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Product",
		},
		{
			sourceFieldName: "IDS_LicenseVersion",
			mappings: [
				this.itemTypeMappings.license
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Version",
		},
		{
			sourceFieldName: "IDS_LicenseAdditionalKey",
			mappings: [
				this.itemTypeMappings.license
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Additional key",
		},
		{
			sourceFieldName: "IDS_LicenseUserName",
			mappings: [
				this.itemTypeMappings.license
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "User name",
		},
		{
			sourceFieldName: "IDS_LicensePassword",
			mappings: [
				this.itemTypeMappings.license
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Password",
		},
		// IDS_LicensePurchaseDate is bugged in PasswortDepot 10 export,
		// it contains a short int instead of a date or UTC value
		{
			sourceFieldName: "IDS_LicensePurchaseDate",
			mappings: [
				this.itemTypeMappings.license
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Purchase date",
		},
		{
			sourceFieldName: "IDS_LicenseOrderNumber",
			mappings: [
				this.itemTypeMappings.license
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Order number",
		},
		{
			sourceFieldName: "IDS_LicenseEmail",
			mappings: [
				this.itemTypeMappings.license
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "E-mail address",
		},
		{
			sourceFieldName: "IDS_LicenseExpires",
			mappings: [
				this.itemTypeMappings.license
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "License expiration date",
		},
		{
			sourceFieldName: "IDS_IdentityWebsite",
			mappings: [
				this.itemTypeMappings.identity
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Website",
		},
		{
			sourceFieldName: "IDS_IdentityMobile",
			mappings: [
				this.itemTypeMappings.identity
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Mobile phone",
		},
		{
			sourceFieldName: "IDS_IdentityFax",
			mappings: [
				this.itemTypeMappings.identity
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "Fax",
		},
		{
			sourceFieldName: "IDS_DocumentSize",
			mappings: [
				this.itemTypeMappings.document
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "File size",
		},
		{
			sourceFieldName: "IDS_DocumentFolder",
			mappings: [
				this.itemTypeMappings.document
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "File path",
		},
		{
			sourceFieldName: "IDS_DocumentFile",
			mappings: [
				this.itemTypeMappings.document
			],
			targetFieldType: this.customBitwardenFieldTypes.text,
			targetFieldLabel: "File path and name",
		},
	];

	/**
	 * END version related configuration
	 */
}

const PasswordDepotToBitwardenConverterConfigVersion = new PasswordDepotToBitwardenConverterConfigVersionObject();

export default PasswordDepotToBitwardenConverterConfigVersion;