var ValidationUtil = {
	contains: function (needle, haystack) {
		return (haystack.indexOf(needle) >= 0);
	},
	
	getNumOccurances: function (subj, searchStr) {
		return (subj.split(searchStr).length - 1);
	},
	
	isArray: function (value) {
		if (typeof(value) == "undefined") return false;
		
		if (typeof(value.length) == "number") {
			if (typeof(value.splice) == "function") {
				return true;
			}
		}
		
		return false;   
	},
	
	isEmail: function (str)  {
		str = jQuery.trim(str).toLowerCase();

	    if (str.length < 6) return false;
		if (this.getNumOccurances(str, '@') != 1) return false;
		if (this.contains(" ", str)) return false;
        if (!this.contains(".", str)) return false

		var atSign = str.indexOf("@");
		var lastDot = str.lastIndexOf(".");

		if (atSign < 1) return false;
		if (lastDot < atSign + 2) return false;
		if (lastDot > str.length - 3) return false;

		return true;
	},

	isUrl: function (str) {
		str = jQuery.trim(str).toLowerCase();

		if (this.contains(" ", str)) return false;
		if (str.substring(0, 7) != "http://" && str.substring(0, 8) != "https://") return false;

		var lastDot = str.lastIndexOf(".");
		if (lastDot > str.length - 3) return false;

		return true;
	},                                      
	
	isEmpty: function (domElement) {
		// reset element value to trimmed
		jQuery(domElement).val(jQuery.trim(jQuery(domElement).val()));
		var val = jQuery(domElement).val();
		
		if (val == "") return true;
		
		if (typeof(domElement.defaultText) == "string") {
			if (val == domElement.defaultText) {
				return true; 
			}
		}
		
		if (typeof(domElement.errorText) == "string") {
			if (val == domElement.errorText) {
				return true;
			}
		}
		
		return false;
	},
	
	isAlphaNumeric: function (str) {
		var alphaNumeric = /^[0-9A-Za-z]+$/;
		return alphaNumeric.test(str);
	}
};
