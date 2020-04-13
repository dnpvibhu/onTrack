sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"com/wipro/vts/js/underscore"
], function (Controller, _) {
	"use strict";

	return Controller.extend("com.wipro.vts.controller.AnalysisPage", {
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("AnalysisPage").attachPatternMatched(function (oEvent) {
				// var sContext = oEvent.getParameter("arguments").context;
				// this.getView().setBindingContext(this.getView().getModel().createBindingContext(atob(sContext)));
				//	sap.ui.core.UIComponent.getRouterFor(this).navTo("Home");

				var oModel = this.getView().getModel().getProperty("/AvailableTrucks");
				var thingName = oEvent.getParameter("arguments").context;
				var context = _.find(oModel, {
					truckNo: thingName
				});
				this.getView().getModel().setProperty("/thing", context);
			}, this);
		},

		handleNavBackPress: function () {
			window.history.back();
		},

		chartRendered: function (oEvent) {
			(new sap.viz.ui5.controls.Popover()).connect(oEvent.getSource().getVizUid());
		},

		onAfterRendering: function () {

			this.GaugeIntervalCall = jQuery.sap.intervalCall(5000, this,function () {

				var now = new Date().getTime();
				var data = [];
				for (var date1 = now - 1 * 3600 * 1000; date1 < now; date1 += 10000) {
					data.push({
						time: date1,
						temp: 28 + Math.round(Math.random() * 1),
						pressure: 30 + Math.round(Math.random() * 3),
						innage: 60+ Math.random() * 10
					});
				}
				this.getView().getModel().setProperty("/ChartData", data);

			});

		}
	});

});