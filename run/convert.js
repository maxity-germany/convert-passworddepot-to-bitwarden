import PasswordDepotToBitwardenConverterConfig from "../conf/config-common.js";
import PasswordDepotToBitwardenConverter from "../password-depot-to-bitwarden-converter.js";

window.PasswordDepotToBitwardenConverter = PasswordDepotToBitwardenConverter;

document
	.getElementById("importfile")
	.addEventListener(
		"change",
		function ()
		{
			const [file] = document.querySelector("input[type=file]").files;

			PasswordDepotToBitwardenConverter.convertFromFile(
				file,
				function (result) {
					document.getElementById("json").value = JSON.stringify(result, null, 4);
				}
			);
		}
	);

document
	.getElementById("copy-to-clipboard")
	.addEventListener(
		"click",
		function ()
		{
			copyToClipboard(document.getElementById("json").value);
		}
	);

if (PasswordDepotToBitwardenConverterConfig.bitwardenOrganizationId) {
	document.getElementById("organizationId").value = PasswordDepotToBitwardenConverterConfig.bitwardenOrganizationId;
}

/**
 * @param {string} text
 */
async function copyToClipboard(text) {
	await navigator.clipboard.writeText(text);
}