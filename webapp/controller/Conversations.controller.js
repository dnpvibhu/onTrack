sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";
	var firstload = false;
	var messageArray = [{
		"Name": "Command Center",
		"Photo": "./img/CC.png",
		"Message": "Hello There, \n what is the expected time of your arrival?",
		"MessageTime": "20/03/2020 at 1:30 pm"
	}, {
		"Name": "THOMAS T",
		"Photo": "./img/black.jpeg",
		"Message": "Hello, \n I'm expected to be there by Sunday morning ",
		"MessageTime": "20/03/2020 at 1:31 pm"
	}];

	return Controller.extend("com.wipro.vts.controller.Conversations", {
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("Conversations").attachPatternMatched(function (oEvent) {
				var arg = oEvent.getParameter("arguments");
				var sContext = arg.context;
				this.selectedDriver = sContext;
				this.getView().byId("driverSelector").setSelectedKey("");

				if (this.selectedDriver === "" || this.selectedDriver === undefined) {
					this.onChatLoading("THOMAS T");
					firstload = true;

				} else {
					this.onChatLoading(this.selectedDriver);
				}

			}, this);
		},

		onDriverSelect: function (oEvent) {
			this.selectedDriver = oEvent.getSource().getSelectedItem().getText();
			this.onChatLoading(this.selectedDriver);
		},

		onChatLoading: function (selectedDriver) {
			var driverChatModel;
			this.getView().getModel().setProperty("/comandConvoMessage", "");
			if (selectedDriver === "THOMAS T") {
				driverChatModel = this.getView().getModel().getProperty("/conversationWilliamBlack");
				if (driverChatModel === undefined) {
					driverChatModel = messageArray;
					this.getView().getModel().setProperty("/conversationWilliamBlack", driverChatModel);
				}
			} else {
				driverChatModel = this.getView().getModel().getProperty("/" + selectedDriver);
			}
			this.getView().getModel().setProperty("/driverChatModel", driverChatModel);

		},

		onMessageSend: function (oEvent) {
			var driverChatModel = this.getView().getModel().getProperty("/conversationWilliamBlack");
			var comandConvoMessage = this.getView().getModel().getProperty("/comandConvoMessage");
			var today = new Date();
			var date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
			var time = today.getHours() + ":" + today.getMinutes();
			var dateTime = date + ' at ' + time;
			var msg = {
				"Name": "Command Center",
				"Message": comandConvoMessage,
				"MessageTime": dateTime,
				"Photo": "./img/CC.png"
			};
			driverChatModel.push(msg);
			this.getView().getModel().setProperty("/conversationWilliamBlack", driverChatModel);
			this.onChatLoading("THOMAS T");

		},

		navBack: function () {
			window.history.back();
		}
	});

});