sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";
	var firstload = false;

	return Controller.extend("com.wipro.vts.controller.MainPage", {
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.no = 2;
			oRouter.getRoute("MainPage").attachPatternMatched(function (oEvent) {
				var driverDet = this.getView().getModel().getProperty("/AlloatedOrders/" + this.no);
				this.getView().getModel().setProperty("/driverDets", driverDet);

				//reading Shipment oData
				var that = this;
				this.getView().getModel("ShipmentModel").read("/zshpmtSet", {
					urlParameters: {
						"$top": 8
					},
					success: function (oData) {
						var newOrderModel = [];
						var newOrderData;
						for (var index = 0; index < oData.results.length; index++) {
							newOrderData = oData.results[index];
							newOrderData.orderAlloted = "No";
							newOrderModel.push(newOrderData);
						}
						newOrderModel.length = 8;
						that.getView().getModel().setProperty("/Orders", newOrderModel);
					},
					error: function (error) {
						console.log(error);
					}
				});

				//reading Vehicle oData
				this.getView().getModel("MaterialModel").read("/ZMM_VehicleSet", {
					urlParameters: {
						"$top": 11
					},
					success: function (oData) {
						var newOrderModel = [];
						var newOrderData;

						for (var index = 0; index < oData.results.length; index++) {
							newOrderData = oData.results[index];
							newOrderData.AllocationStatus = "Available";
							newOrderModel.push(newOrderData);
						}
						newOrderModel.length = 11;
						that.getView().getModel().setProperty("/Trucks", newOrderModel);
						for (var i = 0; i < newOrderModel.length; i++) {
							if (newOrderModel[i].VEH_MAXVOL === "2.9999999969732016E-03") {
								that.volumeConverter(newOrderModel[i], "-");
							} else {
								that.volumeConverter(newOrderModel[i], "+");
							}

						}

					},
					error: function (error) {
						console.log(error);
					}
				});

				//reading Driver oData
				this.getView().getModel("MaterialModel").read("/ZMM_DriverSet", {
					urlParameters: {
						"$top": 10
					},
					success: function (oData) {
						var newOrderModel = [];
						var newOrderData;
						for (var index = 0; index < oData.results.length; index++) {
							newOrderData = oData.results[index];
							newOrderData.allocationStatus = "Available";
							newOrderModel.push(newOrderData);
						}
						//	newOrderModel.length = 10;
						that.getView().getModel().setProperty("/Drivers", newOrderModel);
					
					},
					error: function (error) {
						console.log(error);
					}
				});

				if (firstload === false) {
					this.unAllocatedShipmments = 3;
					firstload = true;
				} else {
					this.unAllocatedShipmments = this.getView().getModel().getProperty("/newDelivery");
				}

				this.getView().getModel().setProperty("/unAllocatedShipmments", this.unAllocatedShipmments);

			}, this);
		},

		volumeConverter: function (newOrderModel, sign) {
			var num, fv, sc, splitValue;
			splitValue = newOrderModel.VEH_MAXVOL.split(sign, 2);
			fv = splitValue[1];
			sc = splitValue[0].substring(0, splitValue[0].length - 1);
			num = sc * Math.pow(10, fv);
			newOrderModel.VEH_MAXVOL = num.toFixed(2) + " M3";
		},

		onNewDilveryPress: function (oEvent) {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("NewDelivery");
		},

		onMonitorPress: function (oEvent) {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("Home");
		},

		onDriverSelect: function (oEvent) {
			this.selectedDriver = oEvent.getSource().getSelectedItem().getText();
		},

		onAvailableTrucks: function (oEvent) {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("AvailableTruck");
		},

		onNotifications: function (oEvent) {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("Notifications");
		},

		onConversations: function (oEvent) {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("Conversations");
		},

		onDriverPage: function (oEvent) {
			var objBo = this.no;
			jQuery.sap.delayedCall(1, this, function () {
				sap.ui.core.UIComponent.getRouterFor(this).navTo("DriverPage", {
					context: this.no
				});
			});

			//sap.ui.core.UIComponent.getRouterFor(this).navTo("DriverPage");
		},

		navBack: function () {
			window.history.back();
		}
	});

});