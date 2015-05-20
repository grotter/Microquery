MicroquerySubmit = function () {
	var _maxCharacters = 140;
	var _timeout = 6000; // max request time
	var _msgDuration = 2500; // how long server response is displayed before fading out
	var _isFormEnabled = false;
	var _fadeTimeout;
	var _table = "bigbang";
	
	/**
     * Debug utility
	 * @param obj {Object} Generic object to log
	 * @private
	 */
	var _log = function (obj) {
		if (typeof(console) == "undefined") {
			if (typeof(dump) == "function") {
				dump(obj);
			} else {
				//alert(obj);
			}
		} else {
			console.log(obj);
		}
	}
	
	/**
	 * Handle focus and blur events for input fields with default text
	 * @private
	 */
	var _defaultText = function () {
		var fields = $(".default_text");
		
		//initialize
		fields.each(function () {			
			this.errorText = "";
			this.defaultText = $(this).val();
		});
        
		//event handling
		fields.focus(function () {
			$(this).removeClass("error");
			var myVal = $.trim($(this).val());

			if (myVal == this.defaultText || myVal == this.errorText) {
				$(this).val("");
				
				if ($(this).attr("id") == "question") {
					$('#question').NobleCount('#character-count', {
						max_chars: _maxCharacters,
						block_negative: true
					});
					
					$("#character-count-container").fadeIn("fast");
				}
			}
		});

		fields.blur(function () {
			var myVal = $.trim($(this).val());

			if (myVal == "") {
				$(this).val(this.defaultText);
				
				if ($(this).attr("id") == "question") {
					$("#character-count-container").fadeOut("fast");
				}
			}
		});
	}
	
	/**
     * Show processing message and disable form
	 * @param boo {Boolean} true if processing, false if not
	 * @private
	 */
	var _processing = function (boo) {
		if (boo) {
			$("#submit").hide();
			$("#processing").show();
		} else {
			$("#submit").show();
			$("#processing").hide();
		}
		
		_isFormEnabled = !boo;
	}
	
	/**
	 * Display a success / fail message, delay a bit, then fade it out.
	 * @param selector {String} jQuery selector
	 * @private
	 */
	var _displayMessage = function (selector) {
		clearTimeout(_fadeTimeout);
		
		$(selector).fadeIn("fast", function () {
			_fadeTimeout = setTimeout(function () {
				$(selector).fadeOut();
			}, _msgDuration);
		});
	}
	
	/**
	 * Handle server response to form submission
	 * @param data {Object} JSON object returned from the server
	 * @private
	 */
	var _onResponse = function (data) {
		var success = false;
		
		if (typeof(data.success) != "undefined") {
			if (data.success) success = true;
		}
		
		$("#msg-container span").hide();
		
		if (success) {
			// reset form
			$("#submitter").val("");
			$("#submitter").blur();
			
			$("#question").val("");
			$("#question").blur();
			
			// display success message
			_displayMessage("#success");
		} else {
			// display fail message
			_displayMessage("#fail");
		}
		
		_processing(false);
	}
	
	/**
	 * Validate form
	 * @param form {Object} Form DOM element
	 * @returns {Boolean} Returns true if valid, false if not
	 * @private
	 */
	var _isValid = function (form) {
		var isValid = true;
		
		// check if required field filled out
		$(".required", form).each(function () {
            if (ValidationUtil.isEmpty(this)) {
				this.errorText = "Required";
				$(this).val(this.errorText);
				$(this).addClass("error");
				
				isValid = false;
			} else {
				$(this).removeClass("error");
			}
		});
		
		return isValid;
	}
	
	/**
	 * Get a user defined input value or blank if (default / error) value set programmatically
	 * @param selector {String} jQuery selector
	 * @returns {Boolean} Returns an empty string if value not set
	 * @private
	 */
	var _getValue = function (selector) {
		var obj = $(selector);
		
		if (ValidationUtil.isEmpty(obj.get(0))) {
			return "";
		} else {
			return $.trim(obj.val());
		}
	}
	
	/**
     * Submit question to the server
	 * @private
	 */
	var _submit = function () {
		if (!_isFormEnabled) return;
		if (!_isValid($("form"))) return;
		
		_processing(true);
		
		$.jsonp({
			timeout: _timeout,
			url: "/microquery/php/",
			callbackParameter: "callback",
			data: {
				table: _table,
				action: "submit-question",
				submitter: _getValue("#submitter"),
				question: _getValue("#question")
			},
			success: function (data, textStatus) {
				_log(data);
				_onResponse(data);
			},
			error: function (options, textStatus) { 
				_log(textStatus);
				_onResponse({
					success: false
				});
			}
		});
	};
	
	this.setTable = function (str) {
		_table = str;
	}
	
	/**
	 * @constructor
	 */
	this.initialize = function () {
		_defaultText();
		
		$("form").submit(function () {
			_submit();
			return false;
		});
		
		_isFormEnabled = true;
	};
};
