sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("com.wipro.vts.controller.AvailableTruck", {

		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("AvailableTruck").attachPatternMatched(function (oEvent) {
				// var sContext = oEvent.getParameter("arguments").context;
				// this.getView().setBindingContext(this.getView().getModel().createBindingContext(atob(sContext)));
				// sap.ui.core.UIComponent.getRouterFor(this).navTo("Home");
			}, this);
		},

		onAlloatedTruckSelect: function (oEvent) {
			this.getView().setBusy(true);
			// var selectedTruck = oEvent.getSource.getSelectedItem();
			var path = oEvent.getSource().getBindingContext().sPath;
			var index = path.substr(path.length - 1);
			var model = this.getView().getModel().getProperty("/AlloatedOrders/" + index);
			this.getView().getModel().setProperty("/truckDetailModel", model);
			var status;
			if (model.get("position").lat() === model.finalPostion.mylat) {
				status = "At Customer Location";
			} else {
				status = "In-Transit";
			}
			this.getView().getModel().setProperty("/truckStatus", status);
			var that = com.wipro.vts.this;
			jQuery.sap.delayedCall(2000, this, function () {
				this.getView().setBusy(false);
				if (!this.truckDetailDialog) {
					this.truckDetailDialog = sap.ui.xmlfragment("com.wipro.vts.fragments.TruckDetailFragment", this);
					this.getView().addDependent(this.truckDetailDialog);
				}

				//this.truckDetailDialog.bindElement(this.contextPath);
				this.truckDetailDialog.open();
			});

		},

		onUnAlloatedTruckSelect: function (oEvent) {
			this.getView().setBusy(true);
			// var selectedTruck = oEvent.getSource.getSelectedItem();
			var path = oEvent.getSource().getBindingContext().sPath;
			var index = path.substr(path.length - 1);
			var model = this.getView().getModel().getProperty("/availableTrucks2/" + index);
			this.getView().getModel().setProperty("/parkedTruckDetailModel", model);

			this.getView().getModel().setProperty("/truckStatus", status);
			var that = com.wipro.vts.this;
			jQuery.sap.delayedCall(2000, this, function () {
				this.getView().setBusy(false);
				if (!this.truckDetailDialog2) {
					this.truckDetailDialog2 = sap.ui.xmlfragment("com.wipro.vts.fragments.UnAllotedTruckDetail", this);
					this.getView().addDependent(this.truckDetailDialog2);
				}

				//this.truckDetailDialog.bindElement(this.contextPath);
				this.truckDetailDialog2.open();
			});

		},

		onscheduledTruckSelect: function (oEvent) {
			var sContext = oEvent.getSource().getBindingContext().sPath;
			this.dataToBePlotted = btoa(sContext);
			var that = com.wipro.vts.this;
			this.getView().setBusy(true);
			jQuery.sap.delayedCall(2000, this, function () {
				this.getView().setBusy(false);
				if (!this.truckDetailDialog3) {
					this.truckDetailDialog3 = sap.ui.xmlfragment("com.wipro.vts.fragments.OrderDetails", this);
					this.getView().addDependent(this.truckDetailDialog3);
				}

				//this.truckDetailDialog.bindElement(this.contextPath);
				this.truckDetailDialog3.open();
			});
		},
		onscheduledTruckSelect2: function (oEvent) {

			sap.ui.core.UIComponent.getRouterFor(this).navTo("Home", {
				context: this.dataToBePlotted
			});
			this.truckDetailDialog3.close();
		},

		onOkPress: function (oEvent) {
			this.truckDetailDialog.close();
		},
		onOkPress2: function (oEvent) {
			this.truckDetailDialog2.close();
		},

		onAllocatedTruck: function (oEvent) {
			this.getView().byId("allocatedTruckTable").setVisible(true);
			this.getView().byId("unAllocatedTruckTable").setVisible(false);
			this.getView().byId("scheduledTruckTable").setVisible(false);
		},

		onUnallocatedTrucks: function (oEvent) {
			this.getView().byId("allocatedTruckTable").setVisible(false);
			this.getView().byId("unAllocatedTruckTable").setVisible(true);
			this.getView().byId("scheduledTruckTable").setVisible(false);
		},

		onScheduledTrucks: function (oEvent) {
			this.getView().byId("allocatedTruckTable").setVisible(false);
			this.getView().byId("unAllocatedTruckTable").setVisible(false);
			this.getView().byId("scheduledTruckTable").setVisible(true);
		},

		navBack: function () {
			window.history.back();
		}
	});

});