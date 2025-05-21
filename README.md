# Convert Password Depot XML exports into Bitwarden Conditioned JSON

## What it does and what not

This script converts XML exports from the Password Depot password manager into JSON, which can be directly imported into Bitwarden.

It is preconfigured for Password Depot 10 and current version of Bitwarden import (as of May 2025). It can be easily adopted for any other version of Password Depot through the use of config files. You are very welcome to provide configurations for other (especially the latest) versions of Password Depot. Contents of the configuration file are explained below.

The Password Depot XML export is a mess of inconsistent field naming and usage. I tried to map as much as possible to the according Bitwarden fields. But many fields from PD are not available as native fields in Bitwarden and are therefore added as Bitwarden custom fields to retain as much data as possible. Still, there are several bugs in the PD export which I may not solve by this converter. I commented the bugged fields in the configuration file.

In case of stored files, there is no way to transfer their actual contents from PD to Bitwarden. Simply because neither PD exports this date in case of XML nor Bitwarden would be able to import it from JSON. This affects the "encrypted file" and "document" field types from PD. All meta data are converted tho and you may manually add the actual file contents after the import.  

## Configuration

### config.js

Common customization values for date, time and your Bitwarden organization id.

### config-pd10.js

Default configuration for Password Depot version 10. That's the version for my use case for which I had a huge export at hand. Just copy and modify it for any Password Depot version as needed.

Contents should be largely self-explanatory together with the comments I provided. Every PD item type should have a mapping definition in ```itemTypeMappings```.

```fieldMappings``` contains all hard-wired mappings where a PD field maps directly to a predefined Bitwarden field. ```customFieldMappings``` contains all PD fields that have no equivalent in Bitwarden and are therefore mapped as custom fields. Possible configuration values are explained in the file.

## Usage

You may start convertion by either delivering a file readable by ```FileReader``` or a string.

### Convert from file

```javascript
PasswordDepotToBitwardenConverter.convertFromFile(
	file,
	function (result) {
		JSON.stringify(result, null, 4);
	}
);
```

### Convert from string

```javascript
JSON.stringify(
	PasswordDepotToBitwardenConverter.convertFromString(xmlContent),
    null,
    4
);
```

### Run as local web page

I have provided a ready-to-use stand-alone html page for local usage:

1. Fire up a local http server (I recommend https://www.npmjs.com/package/http-server, start it inside the project folder with ```npx http-server . -o -p 9999```)
2. Step into the ```run``` folder and start ```convert.html```
3. If you have predefined your Bitwarden organization ID, it is already pre-filled.

## Bugs and feature requests

Please report issues and submit feature requests using our [issue tracker](https://github.com/maxity-germany/convert-passworddepot-to-bitwarden/issues).


## Contributing

Contributions are most welcome. [Please send us your pull requests directly on GitHub.](https://github.com/maxity-germany/convert-passworddepot-to-bitwarden/pulls).
