sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";


	return Controller.extend("com.wipro.vts.controller.Notifications", {
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("Notifications").attachPatternMatched(function (oEvent) {
				// var sContext = oEvent.getParameter("arguments").context;
				// this.getView().setBindingContext(this.getView().getModel().createBindingContext(atob(sContext)));
			//	sap.ui.core.UIComponent.getRouterFor(this).navTo("Home");
			this.getView().getModel().getProperty("/notifItem");
			}, this);
		},

		navBack: function () {
			window.history.back();
		}
	});

});
