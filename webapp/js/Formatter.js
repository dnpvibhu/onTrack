sap.ui.define([
], function(JSONModel, Device) {
	"use strict";
	return {
		example: function(name) {
			return "Hello " + name;
		},
		relativeDate : function(epoch){
			return window.moment.unix(epoch).format("ddd, hA");
		},
		kelvinToCel : function(kelvin){
			return (kelvin - 273.15).toFixed(0);
		},
	};
});