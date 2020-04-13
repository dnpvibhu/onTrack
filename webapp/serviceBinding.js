function initModel() {
	var sUrl = "/DELL_ER_CorrosionNotification/sap/opu/odata/sap/ZMM_ONTRACK_SRV/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}