sap.ui.define([
	"FabFinV3/c/BaseController",
	"sap/ui/model/json/JSONModel",
	"FabFinV3/u/formatter",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function(BaseController, JSONModel, formatter, MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("FabFinV3.c.Asset", {
		formatter: formatter,
		onInit: function() {
			this.rCount = 0;
			this.aModel = new JSONModel();
			this.getView().setModel(this.aModel, "aModel");
			this.uModel = new JSONModel();
			this.getView().setModel(this.uModel, "uModel");
			this.getOwnerComponent().getRouter().getRoute("asset").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function(evt) {

			if (window.testRun) {
				this.asseturl = "https://api.github.com/repos/britmanjerin/tst/contents/asset.json";
				this.byId("idStopTR").setVisible(true);
			} else {
				this.asseturl = "https://api.github.com/repos/britmanjerin/tst/contents/asset_p.json";
				this.byId("idStopTR").setVisible(false);
			}

			if (!this.headers) {
				var aKey = this.validateCookie("aKey");
				if (!aKey) {
					this.onNavLP();
					return;
				}
				this.headers = {
					"Authorization": 'Bearer ' + aKey,
					"Accept": "application/vnd.github.v3+json",
					"Content-Type": "application/json"
				};
			}

			this.loadAssetData();
			this.setUModel();
		},
		setUModel: function() {
			var adm = this.validateCookie("user").substr(0, 1) === "A" ? true : false;
			this.uModel.setData({
				"adm": adm
			});

		},
		loadAssetData: function() {
			var that = this;
			sap.ui.core.BusyIndicator.show(0);

			$.ajax({
				type: 'GET',
				url: this.asseturl,
				headers: this.headers,
				cache: false,
				success: function(odata) {
					if (!window.assetsha) {
						window.assetsha = odata.sha;
					} else {
						if (window.assetsha != odata.sha) {

							if (that.rCount > 2) {
								window.location.reload();
							} else {
								that.rCount++;
								$.sap.delayedCall(3000, this, function() {
									that.loadAssetData();
								});
							}
							return;
						}
						that.rCount = 0;
					}
					var data = atob(odata.content);
					data = data.trim() ? JSON.parse(data) : [];

					data.sort((a, b) => {
						return new Date(Number(b.key)) - new Date(Number(a.key));
					});

					that.data = data;
					that.showAssetData();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function(oError) {
					MessageBox.error(oError.responseJSON.message);
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		showAssetData: function() {
			var that = this,
				data = $.extend(true, [], this.data),
				dt = this.byId("idDt").getValue() || new Date().toDateString(),
				arr,
				stot,
				tot = 0;
			data.forEach(function(e) {
				arr = [], stot = 0;
				e.hist.forEach(function(el) {
					if (new Date(that.formatter.dateFormat_1(el.dt)) <= new Date(dt)) {
						if (!e.ext) {
							tot += Number(el.amt);
						}
						stot += Number(el.amt);
						arr.push(el);
					}
				});

				arr.sort((a, b) => {
					return new Date(Number(a.dt)) - new Date(Number(b.dt));
				});

				var prv = 0;
				arr.forEach(function(e) {
					e.prv = prv;
					e.avail = prv + Number(e.amt);
					prv = prv + Number(e.amt);
				});
				arr = arr.reverse();

				e.hist = arr;
				e.bal = stot;
				e.txt = e.ps ? "Primary" : e.ext ? "External" : "" ;
			});

			this.byId("idTot").setText(that.formatter.numberFormat_1(tot));

			this.aModel.setData(data);
			this.aModel.refresh();
		},

		getTypDesc: function(val) {
			var list = FabFinV3.ExpType;
			for (var i in list) {
				if (val == list[i].key) {
					return list[i].text;
				}
			}
		},
		onAddSrc: function() {
			var that = this;
			var dialog = new sap.m.Dialog({
				title: 'Asset Source',
				type: 'Message',
				contentWidth: sap.ui.Device.system.phone ? '100%' : "auto",

				content: [
					new sap.m.Input('submitDialogTextarea', {
						width: sap.ui.Device.system.phone ? '100%' : "30rem",
						placeholder: 'Asset Source'
					}),
					new sap.m.Input('submitDialogAmt', {
						type: "Number",
						width: sap.ui.Device.system.phone ? '100%' : "30rem",
						placeholder: 'Opening Balance'
					}),
					new sap.m.FlexBox({
						justifyContent: "End",
						items: [
							new sap.m.CheckBox("idExt", {
								text: "External"
							}), new sap.m.CheckBox("idCS", {
								text: "Primary"
							}), new sap.m.CheckBox("idBank", {
								text: "Bank"
							})
						]
					})

				],
				endButton: new sap.m.Button({
					type: sap.m.ButtonType.Ghost,
					text: 'Ok',
					enabled: true,
					press: function() {
						var sText = sap.ui.getCore().byId('submitDialogTextarea').getValue();
						var sBal = sap.ui.getCore().byId('submitDialogAmt').getValue();
						var ib = sap.ui.getCore().byId('idBank').getSelected() ? "X" : "";
						var ps = sap.ui.getCore().byId('idCS').getSelected() ? "X" : "";
						var ext = sap.ui.getCore().byId('idExt').getSelected() ? "X" : "";
						if (sText.trim().length > 0) {
							that.cAddSrc(sText, sBal, ib, ps, ext);
							dialog.close();
							return;
						}

					}
				}),
				beginButton: new sap.m.Button({
					type: sap.m.ButtonType.Ghost,
					text: 'Cancel',
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			}).addStyleClass("sapUiSizeCompact");

			dialog.open();

		},
		cAddSrc: function(src, bal, ib, ps, ext) {

			var obj = {
				key: Date.now().toString(),
				src: src,
				ib: ib,
				ps: ps,
				ext: ext,
				hist: [{
					desc: "Opening Balance",
					amt: bal,
					dt: Date.now().toString()
				}]
			};
			var that = this;
			var data = this.aModel.getData();

			if (ps) {
				data.forEach(function(e) {
					e.ps = "";
				});
			}

			data.push(obj);
			var body = {
				message: "Updating file",
				content: btoa(JSON.stringify(data)),
				sha: window.assetsha
			};
			var def = $.Deferred();
			that.updateFile(body, def);
			$.when(def).done(function() {
				MessageBox.success("Added Successfully.");
			});

			/*	var eObj = {
				key: Date.now().toString(),
				desc: this.byId("idExpDesc").getValue().trim(),
				typ: this.byId("idExpTyp").getSelectedKey(),
				amt: this.byId("idExpAmt").getValue(),
				dat: this.byId("idExpDate").getValue(),
				modDt: Date.now().toString()
			}
			if (eObj.typ && eObj.amt && eObj.dat) {
				var that = this;
				var data = this.aModel.getData();
				data.push(eObj);
				var body = {
					message: "Updating file",
					content: btoa(JSON.stringify(data)),
					sha: window.assetsha
				};
				var def = $.Deferred();
				that.updateFile(body, def);
				$.when(def).done(function() {
					MessageBox.success("Expense Added Successfully.");
					that.byId("idExpDesc").setValue();
					that.byId("idExpTyp").setSelectedKey("");
					that.byId("idExpAmt").setValue();
					that.byId("idExpDate").setValue();
				});
			}*/
		},

		showTrans: function(dat) {
			if (this._tDialog) {
				this._tDialog.destroy();
			}
			this._tDialog = sap.ui.xmlfragment("FabFinV3.f.transactions", this);
			this.getView().addDependent(this._tDialog);
			sap.ui.getCore().byId("idTransTit").setText(dat.src + " Transactions");
			this._tDialog.setModel(new JSONModel($.extend(true, [], dat)), "trans");
			this._tDialog.open();
		},

		onUpdateTrans: function(oEvent) {
			var that = this;
			var p = new sap.m.Popover({
				showHeader: false,
				placement: "Bottom",
				content: [
					new sap.m.CustomListItem({
						type: "Active",
						content: [new sap.m.Button({
							width: "5rem",
							type: "Accept",
							text: "Credit",
							press: function() {
								handleTrans("C");
							}
						}).addStyleClass("sapUiTinyMarginTopBottom").addStyleClass("sapUiSmallMarginBeginEnd")]

					}),
					new sap.m.CustomListItem({
						type: "Active",
						content: [new sap.m.Button({
							width: "5rem",
							type: "Reject",
							text: "Debit",
							press: function() {
								handleTrans("D");
							}
						}).addStyleClass("sapUiTinyMarginTopBottom").addStyleClass("sapUiSmallMarginBeginEnd")]

					}),
					new sap.m.CustomListItem({
						type: "Active",
						content: [new sap.m.Button({
							width: "5rem",
							type: "Ghost",
							text: "Transfer",
							press: function() {
								handleTrans("M");
							}
						}).addStyleClass("sapUiTinyMarginTopBottom").addStyleClass("sapUiSmallMarginBeginEnd")]

					})
				]
			});
			p.openBy(oEvent.getSource());

			function handleTrans(key) {
				var oMod = that._tDialog.getModel("trans").getData();
				var oItemTemplate = new sap.ui.core.ListItem({
					key: "{aModel>key}",
					text: "{aModel>src}"
				});
				var filter = [new sap.ui.model.Filter("src", sap.ui.model.FilterOperator.NE, oMod.src)]
				if (!that.uModel.getData().adm) {
					filter.push(new sap.ui.model.Filter("ib", sap.ui.model.FilterOperator.NE, "X"))
				}
				var dialog = new sap.m.Dialog({
					title: key === "D" ? "Debit" : key === "C" ? "Credit" : "Transfer to",
					type: 'Message',
					contentWidth: sap.ui.Device.system.phone ? '100%' : "auto",
					content: [
						new sap.m.HBox({
							justifyContent: "Center",
							items: [new sap.m.Text({
								text: "Available Balance : " + that.formatter.numberFormat_1(oMod.bal)
							}).addStyleClass("sapUiTinyMarginBottom")]
						}),
						new sap.m.Select('selSrc', {
							visible: key === "M" ? true : false,
							width: sap.ui.Device.system.phone ? '100%' : "30rem",
							items: {
								path: "aModel>/",
								template: oItemTemplate,
								filters: filter
							}
						}),
						new sap.m.Input('idAmt', {
							type: "Number",
							width: sap.ui.Device.system.phone ? '100%' : "30rem",
							placeholder: 'Amount'
						}),
						new sap.m.Input('idRem', {
							visible: key === "M" ? false : true,
							width: sap.ui.Device.system.phone ? '100%' : "30rem",
							placeholder: 'Remarks'
						})

					],
					endButton: new sap.m.Button({
						type: sap.m.ButtonType.Accept,
						text: 'Ok',
						enabled: true,
						press: function() {

							var amt = Number(key === "C" ? sap.ui.getCore().byId("idAmt").getValue() : "-" + sap.ui.getCore().byId("idAmt").getValue());
							var dest = sap.ui.getCore().byId("selSrc").getSelectedKey();
							var desc = key === "M" ? "Debited to " + sap.ui.getCore().byId("selSrc")._getSelectedItemText() : sap.ui.getCore().byId(
								"idRem").getValue().trim();

							if (key !== "C" && (Math.abs(amt) > Number(oMod.bal))) {
								MessageBox.error("Limit Exceeded");
								return;
							}

							if (desc && amt && ((key === "M" && dest) || key != "M")) {
								var sObj, dObj;
								sObj = {
									desc: desc,
									amt: amt,
									dt: Date.now().toString()
								}
								if (key === "M") {
									dObj = {
										desc: "Credited from " + oMod.src,
										amt: Math.abs(amt),
										dt: Date.now().toString()
									}
								}
								for (var j in that.data) {
									if (that.data[j].key === oMod.key) {
										that.data[j].hist.push(sObj);
										if (!dObj) {
											break;
										}
									}
									if (dObj) {
										if (that.data[j].key === dest) {
											that.data[j].hist.push(dObj);
										}
									}

								}

								var body = {
									message: "Updating file",
									content: btoa(JSON.stringify(that.data)),
									sha: window.assetsha
								};
								var def = $.Deferred();
								that.updateFile(body, def);
								$.when(def).done(function() {
									MessageBox.success("Updated Successfully.");
									dialog.close();
									that.onClose();
								});

							}

						}
					}),
					beginButton: new sap.m.Button({
						text: 'Cancel',
						press: function() {
							dialog.close();
						}
					}),
					afterClose: function() {
						dialog.destroy();
					}
				}).addStyleClass("sapUiSizeCompact");
				that.getView().addDependent(dialog);
				dialog.addContent()
				dialog.open();
			}
		},

		onClose: function() {
			this._tDialog.close();
		},

		onDelAsset: function(evt) {
			var key = evt.getSource().getParent().getBindingContext("aModel").getObject().key;
			sap.m.MessageBox.confirm(
				"Are you sure want to delete?", {
					actions: ["Cancel", "Confirm"],
					onClose: function(sAction) {
						if (sAction === "Confirm") {
							delSrc();
						}
					}
				}
			);
			var that = this;

			function delSrc() {
				var eData = that.data;
				for (var j in eData) {
					if (eData[j].key === key) {
						eData.splice(j, 1);
						break;
					}
				}
				var body = {
					message: "Updating file",
					content: btoa(JSON.stringify(eData)),
					sha: window.assetsha
				};
				var def = $.Deferred();
				that.updateFile(body, def);
				$.when(def).done(function() {
					MessageBox.success("Deleted Successfully.")
				});
			}
		},

		updateFile: function(body, def) {
			var that = this;
			sap.ui.core.BusyIndicator.show(0);
			$.ajax({
				type: 'PUT',
				url: this.asseturl,
				headers: this.headers,
				data: JSON.stringify(body),
				dataType: 'text',
				success: function(odata) {
					window.assetsha = JSON.parse(odata).content.sha;
					sap.ui.core.BusyIndicator.hide();
					that.byId("idDt").setValue();
					that.loadAssetData();
					def.resolve();
				},
				error: function(odata) {
					MessageBox.error("Failed to update.")
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		
		onBkpFile: function() {
			var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data));
			this.formatter.downloadFile(dataStr, "Trans_Backup", );
			if (this._oPopover) {
				this._oPopover.close();
			}
		},

		onNavLP: function(obj) {
			this.getOwnerComponent().getRouter().navTo("login");
		},
		onTestRun: function(evt) {
			window.testRun = false;
			window.expsha = null;
			window.assetsha = null;
			window.mainsha = null;
			window.custsha = null;
			this.onNavBack();
		},

	});
});
