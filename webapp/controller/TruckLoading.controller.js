sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("com.wipro.vts.controller.TruckLoading", {
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("TruckLoading").attachPatternMatched(function (oEvent) {
				// var sContext = oEvent.getParameter("arguments").context;
				// this.getView().setBindingContext(this.getView().getModel().createBindingContext(atob(sContext)));
				
			}, this);
		},

		onOrderSelect: function (oEvent) {
			var sContext = oEvent.getSource().getBindingContext().sPath;
			sContext = btoa(sContext);
			sap.ui.core.UIComponent.getRouterFor(this).navTo("Home", {
				context: sContext
			});
		},

		navBack: function () {
			window.history.back();
		}
	});

});