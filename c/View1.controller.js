sap.ui.define([
	"FabFinV3/c/BaseController",
	"sap/ui/model/json/JSONModel",
	"FabFinV3/u/formatter",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, JSONModel, formatter, MessageBox, MessageToast, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("FabFinV3.c.View1", {
		formatter: formatter,
		onInit: function() {
			this.filtOpt = {
				"sort": false,
				"Overdue": true,
				"Payment Due": true,
				"Loan Closed": false,
				"Loan Renewed": false,
				"filterVal": "",
			};
			this.getOwnerComponent().getRouter().getRoute("home").attachPatternMatched(this._onObjectMatched, this);
			window.mainsha;
			window.custsha;
			this.rCount1 = 0,
				this.rCount2 = 0;
			this.oModel = new JSONModel();
			this.mModel = new JSONModel();

			this.getView().setModel(this.oModel, "oModel");
			this.getView().setModel(this.mModel, "mModel");
			this.uModel = new JSONModel();
			this.getView().setModel(this.uModel, "uModel");
			this.iModel = new JSONModel({});
			this.getView().setModel(this.iModel, "iModel");

		},

		_onObjectMatched: function(evt) {

			if (window.testRun) {
				this.custurl = "https://api.github.com/repos/britmanjerin/tst/contents/cust.json";
				this.mainurl = "https://api.github.com/repos/britmanjerin/tst/contents/main.json";
				this.imgurl = "https://api.github.com/repos/britmanjerin/tst/contents/Images/";
				this.asseturl = "https://api.github.com/repos/britmanjerin/tst/contents/asset.json";
				this.byId("idStopTR").setVisible(true);
			} else {
				this.custurl = "https://api.github.com/repos/britmanjerin/tst/contents/cust_p.json";
				this.mainurl = "https://api.github.com/repos/britmanjerin/tst/contents/main_p.json";
				this.imgurl = "https://api.github.com/repos/britmanjerin/tst/contents/Images_p/";
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

			this.loadCustData();
			this.setUModel();
			//	this.onFilterData();

		},
		setUModel: function() {
			var adm = this.validateCookie("user").substr(0, 1) === "A" ? true : false;
			this.uModel.setData({
				"adm": adm
			});
			if (!adm) {

				if (this.getView().getModel("config")) {
					if (!this.getView().getModel("config").getData().filter) {
						this.byId("idFilter").setSelected(false);
					}
				} else {
					this.byId("idFilter").setSelected(false);
				}

			}
		},

		handleRefresh: function() {

			setTimeout(function() {
				this.byId("pullToRefresh").hide();
				this.loadCustData();
			}.bind(this), 10);

		},

		onPressUser: function(oEvent) {

			if (this._oPopover) {
				this._oPopover.destroy();
			}

			this._oPopover = sap.ui.xmlfragment("FabFinV3.f.User", this);
			this.getView().addDependent(this._oPopover);

			sap.ui.getCore().byId("idUserLogged").setText(this.validateCookie("user"));

			this._oPopover.openBy(oEvent.getSource());
		},

		onLogOut: function(evt, flg) {
			document.cookie = 'aKey=; Max-Age=-99999999;';
			this.headers = false;
			if (!flg) {
				MessageToast.show("Logged out Successfully.");
			}

			this.onNavLP();
		},

		onUserConfig: function() {

			if (this._ucDialog) {
				this._ucDialog.destroy();
			}

			this._ucDialog = sap.ui.xmlfragment("FabFinV3.f.UserConfig", this);
			this.getView().addDependent(this._ucDialog);
			this._ucDialog.setModel(new JSONModel($.extend(true, {}, this.getView().getModel("config").getData())), "ucDialogModel");
			this._ucDialog.open();
		},

		showFOP: function(oEvent) {
			var that = this;
			var obj = {};
			FabFinV3.filterArr.forEach(function(e) {
				obj[e.status] = e.status;
			});
			var content = new sap.m.VBox().addStyleClass("sapUiTinyMargin");

			content.addItem(new sap.m.SearchField({
				placeholder: "Search",
				value: that.filtOpt.filterVal,
				search: function(evt) {
					if (evt.getSource().getValue().trim()) {
						content.getItems().forEach(function(e) {
							if (e.getText) {
								that.filtOpt[e.getText()] = e.getSelected();
							}
						});
						that.filtOpt.sort = true;
						that.filtOpt.filterVal = evt.getSource().getValue().trim();
						that.onFOP();
						p.close();
					}
				}
			}));

			Object.keys(obj).forEach(function(e) {
				if (e === "Loan Closed" || e === "Loan Renewed") {
					if (that.uModel.getData().adm || that.getView().getModel("config").getData().filter) {
						content.addItem(new sap.m.CheckBox({
							text: e,
							selected: that.filtOpt[e] || false
						}));
					}
				} else {
					content.addItem(new sap.m.CheckBox({
						text: e,
						selected: that.filtOpt[e] || false
					}));
				}

			});

			var p = new sap.m.Popover({
				showHeader: true,
				title: "Filter",
				placement: "Bottom",
				content: content,
				endButton: new sap.m.Button({
					type: "Transparent",
					icon: "sap-icon://decline",
					press: function() {
						p.close();
					}
				}),
				footer: new sap.m.Toolbar({
					content: [new sap.m.ToolbarSpacer(), new sap.m.Button({
						text: "Reset",
						type: "Transparent",
						press: function() {
							content.getItems().forEach(function(e) {
								that.filtOpt = {
									"sort": false,
									"Overdue": true,
									"Payment Due": true,
									"Loan Closed": false,
									"Loan Renewed": false,
									"filterVal": "",
								};
							});
							that.onFOP();
							p.close();
						}
					}), new sap.m.Button({
						text: "Ok",
						type: "Transparent",
						press: function() {
							content.getItems().forEach(function(e) {
								if (e.getText) {
									that.filtOpt[e.getText()] = e.getSelected();
								}else{
									that.filtOpt.filterVal = e.getValue().trim();
								}
							});
							that.filtOpt.sort = true;
							
							that.onFOP();
							p.close();
						}
					})]
				})
			});
			p.openBy(oEvent.getSource());
		},

		onFOP: function() {
			var that = this;
			var arr = [];
			this.byId("idList").getBinding("items").filter();
			if (this.filtOpt.sort) {
				var tmpArr,
					sortArr = [];
				var oModel = $.extend(true, [], this.mData);

				FabFinV3.filterArr.forEach(function(e) {
					tmpArr = oModel.filter(function(el) {
						return el.key === e.key;
					});
					sortArr.push(tmpArr[0]);
				});

				this.getView().getModel("oModel").setData(sortArr);
				this.getView().getModel("oModel").refresh();
			} else {
				this.getView().getModel("oModel").setData($.extend(true, [], this.mData));
				this.getView().getModel("oModel").refresh();
			}

			Object.keys(this.filtOpt).forEach(function(e) {
				if (that.filtOpt[e]) {
					arr.push(e);
				}
			});
			var fArr = FabFinV3.filterArr.filter(function(e) {
				return arr.indexOf(e.status) >= 0;
			});

			var filterArray = [];
			fArr.forEach(function(e) {
				filterArray.push(new Filter("key", FilterOperator.EQ, e.key));
			});
			filterArray = new Filter({
				filters: filterArray,
				and: false
			});

			if (this.filtOpt.filterVal) {
				var filterArr2 = [];
				filterArr2.push(new Filter("refNo", FilterOperator.Contains, this.filtOpt.filterVal));
				filterArr2.push(new Filter("name", FilterOperator.Contains, this.filtOpt.filterVal));
				filterArr2 = new Filter({
					filters: filterArr2,
					and: false
				});
				filterArray = [filterArray, filterArr2];
				filterArray = new Filter({
					filters: filterArray,
					and: true
				});
			}

			this.byId("idList").getBinding("items").filter(filterArray);
		},

		onFilterData: function(oEvent) {
			var filterArray = [];
			if (this.byId("idFilter").getSelected()) {
				filterArray.push(new Filter("key", FilterOperator.Contains, ""));
			} else {
				filterArray.push(new Filter("lnCls", FilterOperator.NotContains, "X"));
				filterArray.push(new Filter("lnRen", FilterOperator.NotContains, "X"));
			}

			this.byId("idList").getBinding("items").filter(filterArray);
		},

		loadCustData: function() {
			FabFinV3.filterArr = [];
			var that = this;
			var i = $.Deferred();
			var j = $.Deferred();
			sap.ui.core.BusyIndicator.show(0);

			$.ajax({
				type: 'GET',
				url: this.custurl,
				headers: this.headers,
				cache: false,
				success: function(odata) {
					if (!window.custsha) {
						window.custsha = odata.sha;
					} else {

						if (window.custsha != odata.sha) {

							if (that.rCount1 > 2) {
								window.location.reload();
							} else {
								that.rCount1++;
								$.sap.delayedCall(3000, this, function() {
									that.loadCustData();
								});
							}
							return;
						}
						that.rCount1 = 0;
					}

					var data = atob(odata.content);
					data = data.trim() ? JSON.parse(data) : [];
					data.forEach(function(e) {
						var lnObj = that.formatter.setStatus_h(e, that);
						e.lnDt = that.formatter.dateFormat(new Date(e.lnDt));
						e.tpAmt = Number(lnObj.tpAmt);
						e.apAmt = Number(lnObj.advAmt);
						if (e.nxtInstsDate) {
							e.nxtInstsDate = new Date(e.nxtInstsDate).toDateString().split(" ").splice(1, 4).join(' ');
						}
					});

					data.sort((a, b) => {
						return b.key - a.key;
					});

					that.mData = data;
					that.oModel.setData(data);
					that.oModel.refresh();

					FabFinV3.filterArr.sort((a, b) => {
						return a.no - b.no;
					});
					that.onFOP();

					i.resolve();
				},
				error: function(oError) {
					MessageBox.error(oError.responseJSON.message);
					i.resolve();
				}
			});
			$.ajax({
				type: 'GET',

				url: this.mainurl,
				headers: this.headers,
				cache: false,
				success: function(odata) {

					if (!window.mainsha) {
						window.mainsha = odata.sha;
					} else {
						if (window.mainsha != odata.sha) {

							if (that.rCount2 > 2) {
								window.location.reload();
							} else {
								that.rCount2++
									$.sap.delayedCall(3000, this, function() {
										that.loadCustData();
									});
							}

							return;
						}

						that.rCount2 = 0;
					}

					var data = atob(odata.content);
					data = data.trim() ? JSON.parse(data) : {
						roi: [{
							month: 1,
							roi: 12
						}],
						pw: []
					};

					if (!data.uc) {
						data.uc = {
							filter: "",
							paySchl: "",
							intRt: "",
							intRt_c: "",
							lc: "",
							ls: "",
							not: "",
							reversal: "",
							bkp: "",
							frmSes: null,
							toSes: null
						}
					}
					data.ld = data.ld ? data.ld : 12;

					var ucDat = $.extend(true, {}, data.uc)

					var frmSes = ucDat.frmSes ? new Date(Number(ucDat.frmSes)) : null;
					var toSes = ucDat.toSes ? new Date(Number(ucDat.toSes)) : null;

					Object.keys(ucDat).forEach(function(e) {
						ucDat[e] = ucDat[e] == "X" ? true : false;
					});

					ucDat.frmSes = frmSes;
					ucDat.toSes = toSes;

					ucDat.frmSes = ucDat.frmSes ? new Date(Number(ucDat.frmSes)) : ucDat.frmSes;
					ucDat.toSes = ucDat.toSes ? new Date(Number(ucDat.toSes)) : ucDat.toSes;

					sap.ui.getCore().setModel(new JSONModel(ucDat), "config");
					that.getView().setModel(new JSONModel(ucDat), "config");

					that.mModel.setData(data);
					that.mModel.refresh();
					j.resolve();
				},
				error: function(oError) {
					MessageBox.error(oError.responseJSON.message);
					j.resolve();
				}
			});

			$.when(i, j).done(function() {
				sap.ui.core.BusyIndicator.hide();
				if (!that.uModel.getData().adm) {
					var config = that.getView().getModel("config").getData();
					if (config.frmSes && config.toSes) {
						var cd = new Date();
						var ctm = Number(String(cd.getHours()) +
							(String(cd.getMinutes()).length < 2 ? "0" + String(cd.getMinutes()) : String(cd.getMinutes())) +
							(String(cd.getSeconds()).length < 2 ? "0" + String(cd.getSeconds()) : String(cd.getSeconds())));
						var frmSes = Number(String(config.frmSes.getHours()) +
							(String(config.frmSes.getMinutes()).length < 2 ? "0" + String(config.frmSes.getMinutes()) : String(config.frmSes.getMinutes())) +
							(String(config.frmSes.getSeconds()).length < 2 ? "0" + String(config.frmSes.getSeconds()) : String(config.frmSes.getSeconds()))
						);
						var toSes = Number(String(config.toSes.getHours()) +
							(String(config.toSes.getMinutes()).length < 2 ? "0" + String(config.toSes.getMinutes()) : String(config.toSes.getMinutes())) +
							(String(config.toSes.getSeconds()).length < 2 ? "0" + String(config.toSes.getSeconds()) : String(config.toSes.getSeconds()))
						);

						if (ctm < frmSes || ctm > toSes) {
							that.onLogOut(1, 1);
						}
					}
				}

			});
		},

		clickIDNo: function(oEvent) {

			if (this.iModel.getData().id || this.iModel.getData().idf || this.iModel.getData().idb) {
				var p = new sap.m.Popover({
					showHeader: true,
					placement: "Bottom",
					content: [new sap.m.Image({
							src: this.iModel.getData().id,
							width: "100%",
							height: "100%"
						}),
						new sap.m.Image({
							src: this.iModel.getData().idf,
							width: "100%",
							height: "100%"
						}), new sap.m.Image({
							src: this.iModel.getData().idb,
							width: "100%",
							height: "100%"
						})
					],
					endButton: new sap.m.Button({
						type: "Transparent",
						icon: "sap-icon://decline",
						press: function() {
							p.close();
						}
					})
				});
				p.openBy(oEvent.getSource());
			}

		},

		onAddCust: function(obj) {

			if (this._oDialog) {
				this._oDialog.destroy();
			}
			this._oDialog = sap.ui.xmlfragment("FabFinV3.f.AddCust", this);
			this.getView().addDependent(this._oDialog);

			if (!obj) {
				var obj = {
					"key": "",
					"refNo": "",
					"name": "",
					"idTyp": "",
					"id": "",
					"mob": "",
					"mail": "",
					"addr": "",
					"type": "",
					"goldGms": "",
					"goldRt": "",
					"lnAmt": "",
					"months": "",
					"roi": this.mModel.getData().roi[0].roi,
					"emi": "",
					"IntAmt": "",
					"compInst": "",
					"ltPay": "",
					"preCls": "",
					"cfAmt": "",
					"lnDt": "",
					"clsDt": "",
					"nxtInsDt": "",
					"payDet": [],
					"roiDet": this.mModel.getData().roi,
					"pwDet": this.mModel.getData().pw,
					"gDet": this.formatter.fillGArr(),
					"crtDt": "",
					"lnCls": "",
					"lnRen": "",
					"lnDur": this.mModel.getData().ld
				};
			}

			this._oDialog.setModel(new JSONModel($.extend(true, {}, obj)), "oDialogModel");
			sap.ui.getCore().byId("idLnDt").setMaxDate(new Date());

			this._oDialog.open();
			sap.ui.core.BusyIndicator.show(0);
			this.loadBalDet();
		},

		loadBalDet: function() {

			var that = this;
			$.ajax({
				type: 'GET',
				url: this.asseturl,
				headers: this.headers,
				cache: false,
				success: function(odata) {
					that.assetsha = odata.sha;
					var data = atob(odata.content);
					data = data.trim() ? JSON.parse(data) : [];
					that.assetData = $.extend(true, [], data);
					var arr = [];
					data.forEach(function(e) {
						if (!e.ib) {
							e.bal = 0;
							e.val = "";
							e.hist.forEach(function(el) {
								e.bal += Number(el.amt);
							});
							arr.push(e);
						}
					});

					that._oDialog.setModel(new JSONModel(arr), "oDialogModel2");

					sap.ui.core.BusyIndicator.hide();
				},
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		onAddGoldItems: function(oEvent) {
			if (this._gDialog) {
				this._gDialog.destroy();
			}
			this._gDialog = sap.ui.xmlfragment("FabFinV3.f.GoldDetail", this);
			this._oDialog.addDependent(this._gDialog);
			//	this._gDialog.bindElement("oDialogModel>/gDet");
			this._gDialog.openBy(oEvent.getSource());
		},

		cAddCust: function() {

			var nwData = this._oDialog.getModel("oDialogModel").getData();

			if (!nwData.name.trim() || !nwData.id.trim() || !nwData.mob.trim() || Number(nwData.goldGms) <= 0 || Number(
					nwData.lnAmt) <= 0) {
				MessageBox.error("Please fill all the required fields");
				return;
			}

			var assetData = this._oDialog.getModel("oDialogModel2").getData();
			var asstAmt = 0;
			for (var x in assetData) {
				asstAmt += Number(assetData[x].val);
			}

			if (assetData.length > 0 && Number(nwData.lnAmt) != asstAmt) {
				MessageBox.error("Kindly verify the Amount entered in Debit source");
				return;
			}

			for (var i = nwData.gDet.length - 1; i >= 0; i--) {
				nwData.gDet[i].flg = nwData.gDet[i].flg ? "X" : "";
				if (Number(nwData.gDet[i].value) == 0) {
					nwData.gDet.splice(i, 1);
				}
			}

			nwData.goldRt = Number(nwData.goldRt).toFixed(3);

			nwData.key = nwData.crtDt = nwData.modDt = Date.now().toString();
			delete nwData.instDet;
			this.oModel.getData().push(this._oDialog.getModel("oDialogModel").getData());
			var data = this.oModel.getData();
			data = JSON.stringify(data);
			var that = this;

			var url = this.custurl

			var body = {
				message: "Updating file",
				content: btoa(data),
				sha: window.custsha
			};
			sap.ui.core.BusyIndicator.show(0);
			$.ajax({
				type: 'PUT',
				url: url,
				headers: that.headers,
				data: JSON.stringify(body),
				dataType: 'text',
				success: function(odata) {
					window.custsha = JSON.parse(odata).content.sha;
					sap.ui.core.BusyIndicator.hide();
					that.filtOpt = {
						"sort": false,
						"Overdue": true,
						"Payment Due": true,
						"Loan Closed": false,
						"Loan Renewed": false
					};
					that.loadCustData();
					that.handleImage(nwData.key);
					that.updateBal(assetData, nwData);
					that.onClose();
					MessageBox.success("Customer Added Successfully.")
				},
				error: function(odata) {

					MessageBox.error("Failed to update.")

				}
			});

		},

		updateBal: function(assetData, lnData) {

			this.assetData.forEach(function(e) {
				if (!e.ib) {
					assetData.forEach(function(el) {
						if (e.key === el.key && Number(el.val) > 0) {
							e.hist.push({
								desc: "Debited to " + lnData.name + " (Ref No." + lnData.refNo + ")",
								amt: "-" + el.val,
								dt: Date.now().toString()
							})
						}
					});
				}
			});

			var url = this.asseturl;
			var body = {
				message: "Updating file",
				content: btoa(JSON.stringify(this.assetData)),
				sha: this.assetsha
			};
			$.ajax({
				type: 'PUT',
				url: url,
				headers: this.headers,
				data: JSON.stringify(body),
				dataType: 'text',
				success: function(odata) {
					window.assetsha = null;
				},
				error: function(odata) {

					MessageBox.error("Failed to update.")

				}
			});
		},

		handleUpload: function(oEvent, key, read) {

			var files = oEvent.getParameter("files")
			var that = this;
			if (files) {
				for (var i = 0, f; f = files[i]; i++) {
					var r = new FileReader();
					r.onload = (
						$.proxy(
							function(f) {
								return $.proxy(
									function(e) {
										var img = new Image();
										img.src = e.target.result;
										img.onload = function() {
											if (!read) {
												that.iModel.getData()[key] = that.formatter.resizeImage(img, 0.7);
											} else {
												that.openCImgFrag(that.formatter.resizeImage(img, 1), key);
											}
										}

									}, this);
							}, this)
					)(f);
					r.readAsDataURL(f);
				}
			}

		},

		openCImgFrag: function(src, key) {

			if (this._cImgDialog) {
				this._cImgDialog.destroy();
			}

			this._cImgDialog = sap.ui.xmlfragment("FabFinV3.f.cropImg", this);
			this.getView().addDependent(this._cImgDialog);
			this._cImgDialog.imgSrc = src;
			this._cImgDialog.inpKey = key;
			this._cImgDialog.open();

		},

		afCrpImg: function() {

			var imageToCrop = document.getElementById('imageToCrop');
			imageToCrop.src = this._cImgDialog.imgSrc;
			this._cImgDialog.cropper = new Cropper(imageToCrop, {
				viewMode: 2,
				crop(event) {}
			});
		},
		onReadTxt: function(oEvent) {
			this.formatter.readText(this._cImgDialog.cropper.getCroppedCanvas().toDataURL(), this._cImgDialog.inpKey);
			this.onCloseIC();

		},
		onCloseIC: function() {
			if (this._cImgDialog) {
				this._cImgDialog.destroy();
			}
		},
		handleImage: function(key) {
			var iModel = this.iModel.getData();
			var that = this;
			if (iModel.dp || iModel.id || iModel.idf || iModel.idb) {

				var url = this.imgurl + key + ".json"
				var body = {
					message: "Creating file",
					content: btoa(JSON.stringify(iModel))
				};
				$.ajax({
					type: 'PUT',
					url: url,
					headers: this.headers,
					data: JSON.stringify(body),
					dataType: 'text',
					success: function(odata) {
						that.iModel.setData({});
					},
					error: function(odata) {
						that.iModel.setData({});
						MessageBox.error("Image upload failed");
					}
				});
			}

		},

		calculateEMI: function(e) {
			var data = this._oDialog.getModel("oDialogModel").getData();
			if (e === "G") {
				if (Number(data.goldRt) > 0 && Number(data.goldGms) > 0) {
					data.lnAmt = Number(data.goldRt) * Number(data.goldGms);
				}
			} else if (e === "A") {
				if (Number(data.lnAmt) > 0 && Number(data.goldGms) > 0) {
					data.goldRt = Number(data.lnAmt) / Number(data.goldGms);
				}
			}
			if (Number(data.lnAmt) > 0 && Number(data.roi) > 0) {

				data.lnDt = data.lnDt ? data.lnDt : new Date().toDateString();
				data.payDet = [];
				this.calPayData(data);

			}
			this._oDialog.getModel("oDialogModel").refresh();

			function findEMIDate(date, ctr) {
				var m = date.getMonth() + ctr;
				var y = date.getFullYear() + (m === 12 ? 1 : 0);
				return new Date(y, m % 12, 5);
			}
		},

		calPayData: function(cModel) {

			var data = cModel.payDet;
			var roiArr = this.mModel.getData().roi;
			var pwArr = this.mModel.getData().pw;
			var pwDet;
			cModel.instDet = generateLoanData(cModel.lnDt);
			cModel.pwDet = pwDet ? [pwDet] : [];

			function generateLoanData(dat) {

				var pObj, obj, pArr = [],
					tmpDate = dat,
					cDate = new Date().toDateString(),
					iEnd = cModel.lnDur,
					prA = Number(cModel.lnAmt),
					roi, tRoi,
					bPrA = prA,
					cfInt = 0;

				var date = new Date(dat);
				var instStDt = new Date(dat);
				var day = date.getDate();
				var year = date.getFullYear();
				var month = date.getMonth() + 1;
				var fInstDat,
					fInstMnth = (date.getMonth() + 1) % 12,
					fInstYr = !((date.getMonth() + 1) % 12) ? date.getFullYear() + 1 : date.getFullYear(),
					fInstDay = 5,
					mc = 1;
				for (var i in pwArr) {
					if (date.getDate() >= pwArr[i].frm && date.getDate() <= pwArr[i].to) {
						fInstMnth = (date.getMonth() + pwArr[i].mc) % 12;
						fInstDay = pwArr[i].dt;
						mc = pwArr[i].mc;
						pwDet = pwArr[i];
						break;
					}
				}
				fInstDat = new Date(fInstYr, fInstMnth, fInstDay);
				if ((date.getMonth() + mc) % 12 != fInstDat.getMonth()) {
					fInstDat = new Date((!((date.getMonth() + mc) % 12) ? date.getFullYear() + 1 : date.getFullYear()), fInstDat.getMonth(), 0);
				}

				for (var i = 1; i <= iEnd; i++) {

					for (var k in roiArr) {
						if (roiArr[k].month == i) {
							roi = Number(roiArr[k].roi) / 12 / 100;
							tRoi = Number(roiArr[k].roi);
							break;
						}
					}
					prA = bPrA;
					pObj = {
						no: i,
						prA: prA,
						int: Math.round((Number(prA) * roi) + cfInt),
						lPay: 0,
						payDate: "",
						amtPaid: 0,
						hist: []
					};
					month = month % 12;
					year = !(month) ? year + 1 : year;
					obj = {
						sDt: date,
						eDt: new Date(year, month, day)
					};
					if (month != obj.eDt.getMonth()) {
						obj.eDt = new Date(year, obj.eDt.getMonth(), 0);
					}
					obj.eDt = new Date(obj.eDt.getTime() - (1 * 24 * 60 * 60 * 1000));

					date = new Date(obj.eDt.getTime() + (1 * 24 * 60 * 60 * 1000));
					month += 1;

					pObj.intFrm = obj.sDt.toDateString();
					pObj.intTo = obj.eDt.toDateString();
					pObj.fnPayDt = obj.eDt.toDateString();

					pObj.instDt = fInstDat;
					pObj.fnPayDt = (fInstDat >= obj.eDt ? fInstDat : obj.eDt).toDateString();
					fInstDat = new Date((!((fInstDat.getMonth() + 1) % 12) ? fInstDat.getFullYear() + 1 : fInstDat.getFullYear()), ((fInstDat.getMonth() +
						1) % 12), fInstDay);
					if ((pObj.instDt.getMonth() + 1) % 12 != fInstDat.getMonth()) {
						fInstDat = new Date((!((pObj.instDt.getMonth() + 1) % 12) ? pObj.instDt.getFullYear() + 1 : pObj.instDt.getFullYear()), (
							fInstDat.getMonth()), 0);
					}

					pObj.instStDt = instStDt.toDateString();
					instStDt = new Date(new Date(pObj.fnPayDt).getTime() + (1 * 24 * 60 * 60 * 1000));
					pObj.intFrm = new Date(pObj.intFrm);
					pObj.intTo = new Date(pObj.intTo);
					pObj.payDate = new Date(pObj.payDate);
					pObj.fnPayDt = new Date(pObj.fnPayDt);
					pObj.instStDt = new Date(pObj.instStDt);

					pArr.push(pObj);

				}
				return pArr;
			}

		},

		getNoOfDays: function(sDate, eDate) {
			return Math.ceil(Math.abs(eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
		},
		onUpdateInt: function() {
			if (this._iDialog) {
				this._iDialog.destroy();
			}
			this._iDialog = sap.ui.xmlfragment("idIT", "FabFinV3.f.intRate", this);
			this.getView().addDependent(this._iDialog);
			this._iDialog.setModel(new JSONModel($.extend(true, [], this.mModel.getData().roi)), "iDialogModel");
			this._iDialog.open();
		},

		onAddROI: function() {
			var month = Math.round(sap.ui.getCore().byId("idIT--idMnInp").getValue());
			var roi = sap.ui.getCore().byId("idIT--idRoiInp").getValue();

			if (month && roi) {
				var model = this._iDialog.getModel("iDialogModel").getData();
				var nwObj = {
					month: month,
					roi: roi,
					modDt: Date.now().toString()
				};
				for (var i = 0; i < model.length; i++) {
					if (model[i].month == month) {
						model.splice(i, 1, nwObj);
						break;
					}
				}
				if (i == model.length) {
					model.push(nwObj);
				}

				model.sort((a, b) => {
					return a.month - b.month;
				});

				this._iDialog.getModel("iDialogModel").refresh();

			}

		},

		cUpdateInt: function() {
			var that = this;
			this.mModel.getData().roi = this._iDialog.getModel("iDialogModel").getData();
			this.mModel.getData().modDt = Date.now().toString();

			var data = JSON.stringify(this.mModel.getData());

			var url = this.mainurl
			var body = {
				message: "Updating file",
				content: btoa(data),
				sha: window.mainsha
			};
			sap.ui.core.BusyIndicator.show(0);
			$.ajax({
				type: 'PUT',
				url: url,
				headers: that.headers,
				data: JSON.stringify(body),
				dataType: 'text',
				success: function(odata) {
					window.mainsha = JSON.parse(odata).content.sha;
					sap.ui.core.BusyIndicator.hide();
					that.loadCustData();
					MessageBox.success("Updated Successfully.")
				},
				error: function(odata) {
					MessageBox.error("Failed to update.")
				}
			});

			this.onClose();
		},

		onDelIntMonth: function(oEvent) {

			this._iDialog.getModel("iDialogModel").getData().splice(oEvent.getSource().getBindingContext("iDialogModel").getPath().split("/")[1],
				1);
			this._iDialog.getModel("iDialogModel").refresh();
		},

		onUpdatePW: function() {
			if (this._pwDialog) {
				this._pwDialog.destroy();
			}
			this._pwDialog = sap.ui.xmlfragment("FabFinV3.f.PayWindow", this);
			this.getView().addDependent(this._pwDialog);
			sap.ui.getCore().byId("idLnDur").setValue(this.mModel.getData().ld);
			this._pwDialog.setModel(new JSONModel($.extend(true, [], this.mModel.getData().pw)), "pwDialogModel");
			this._pwDialog.open();
		},

		onAddPW: function() {
			var frm = Math.round(sap.ui.getCore().byId("idFrm").getValue());
			var to = Math.round(sap.ui.getCore().byId("idTo").getValue());
			var dt = Math.round(sap.ui.getCore().byId("idDt").getValue());
			var mc = Math.round(sap.ui.getCore().byId("idMC").getValue());

			to = to ? to : from;
			mc = mc ? mc : 1;
			dt = dt ? dt : 5;

			if (frm) {
				var model = this._pwDialog.getModel("pwDialogModel").getData();
				var nwObj = {
					frm: frm,
					to: to,
					dt: dt,
					mc: mc,
					modDt: Date.now().toString()
				};
				for (var i = 0; i < model.length; i++) {
					if (model[i].frm == frm && model[i].to == to) {
						model.splice(i, 1, nwObj);
						break;
					}
				}
				if (i == model.length) {
					model.push(nwObj);
				}

				this._pwDialog.getModel("pwDialogModel").refresh();

			}

		},

		cUpdatePW: function() {
			this.mModel.getData().pw = this._pwDialog.getModel("pwDialogModel").getData();
			this.mModel.getData().ld = sap.ui.getCore().byId("idLnDur").getValue();
			this.mModel.getData().modDt = Date.now().toString();

			var that = this;
			var data = JSON.stringify(this.mModel.getData());

			var url = this.mainurl
			var body = {
				message: "Updating file",
				content: btoa(data),
				sha: window.mainsha
			};
			sap.ui.core.BusyIndicator.show(0);
			$.ajax({
				type: 'PUT',
				url: url,
				headers: that.headers,
				data: JSON.stringify(body),
				dataType: 'text',
				success: function(odata) {
					window.mainsha = JSON.parse(odata).content.sha;
					sap.ui.core.BusyIndicator.hide();
					that.loadCustData();
					MessageBox.success("Updated Successfully.")
				},
				error: function(odata) {
					MessageBox.error("Failed to update.")
				}
			});

			this.onClose();
		},

		onDelPW: function(oEvent) {

			this._pwDialog.getModel("pwDialogModel").getData()
				.splice(oEvent.getSource().getBindingContext("pwDialogModel").getPath().split("/")[1], 1);
			this._pwDialog.getModel("pwDialogModel").refresh();
		},

		onClose: function() {
			if (this._oDialog) {
				this._oDialog.destroy();
				this.iModel.setData({});
			}
			if (this._iDialog) {
				this._iDialog.destroy();
				this._iDialog.destroyContent()
			}
			if (this._pwDialog) {
				this._pwDialog.destroy();
			}
			if (this._ucDialog) {
				this._ucDialog.destroy();
			}
			if (this._lDialog) {
				this._lDialog.destroy();
			}

		},

		cUpdateUC: function() {

			var modData = this._ucDialog.getModel("ucDialogModel").getData();
			var frmSes = modData.frmSes ? String(modData.frmSes.getTime()) : "",
				toSes = modData.toSes ? String(modData.toSes.getTime()) : ""
			Object.keys(modData).forEach(function(e) {
				modData[e] = modData[e] ? "X" : "";
			});

			modData.frmSes = frmSes;
			modData.toSes = toSes;

			this.mModel.getData().uc = modData;
			this.mModel.getData().modDt = Date.now().toString();

			var that = this;
			var data = JSON.stringify(this.mModel.getData());

			var url = this.mainurl;
			var body = {
				message: "Updating file",
				content: btoa(data),
				sha: window.mainsha
			};
			sap.ui.core.BusyIndicator.show(0);
			$.ajax({
				type: 'PUT',
				url: url,
				headers: that.headers,
				data: JSON.stringify(body),
				dataType: 'text',
				success: function(odata) {
					window.mainsha = JSON.parse(odata).content.sha;
					sap.ui.core.BusyIndicator.hide();
					that.loadCustData();
					MessageBox.success("Updated Successfully.")
				},
				error: function(odata) {
					MessageBox.error("Failed to update.")
				}
			});

			this.onClose();

		},

		onShowLog: function() {
			if (this._lDialog) {
				this._lDialog.destroy();
			}
			this._lDialog = sap.ui.xmlfragment("FabFinV3.f.log", this);
			this.getView().addDependent(this._lDialog);
			this._lDialog.setModel(new JSONModel(), "log");
			this.fetchLogData();

			this._lDialog.open();
		},

		fetchLogData: function() {
			var logDt = sap.ui.getCore().byId("idLogDt").getValue() || new Date().toDateString();
			logDt = new Date(logDt).toDateString()
			var oModel = $.extend(true, [], this.oModel.getData());
			var arr = [];
			oModel.forEach(function(e) {
				if (new Date(Number(e.crtDt)).toDateString() == logDt) {
					arr.push({
						name: e.name,
						key: e.key,
						lnAmt: e.lnAmt,
						refNo: e.refNo,
						lnDt: e.lnDt,
						rem: "Loan Created"
					});
				}
				if (new Date(Number(e.clsDt)).toDateString() == logDt) {
					arr.push({
						name: e.name,
						key: e.key,
						lnAmt: e.lnAmt,
						refNo: e.refNo,
						lnDt: e.lnDt,
						rem: e.lnCls ? "Loan Closed" : "Loan Renewed"
					});
				}

				for (var i in e.payDet) {
					if (new Date(Number(e.payDet[i].crtDt)).toDateString() == logDt) {
						arr.push({
							name: e.name,
							key: e.key,
							lnAmt: e.lnAmt,
							refNo: e.refNo,
							lnDt: e.lnDt,
							rem: "Payment Updated"
						});
						break;
					}
				}
			});

			this._lDialog.getModel("log").setData(arr);
			this._lDialog.getModel("log").refresh();
		},

		onBkpFile: function() {
			var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.oModel.getData()));
			this.formatter.downloadFile(dataStr, "Backup", );
			if (this._oPopover) {
				this._oPopover.close();
			}
		},

		onTestRun: function(evt) {
			window.testRun = evt === "S" ? false : true;
			window.mainsha = null;
			window.custsha = null;
			window.expsha = null;
			window.assetsha = null;
			this.byId("idStopTR").setVisible(evt === "S" ? false : true);
			this.custurl = "https://api.github.com/repos/britmanjerin/tst/contents/" + (evt === "S" ? "cust_p" : "cust") + ".json";
			this.mainurl = "https://api.github.com/repos/britmanjerin/tst/contents/" + (evt === "S" ? "main_p" : "main") + ".json";
			this.imgurl = "https://api.github.com/repos/britmanjerin/tst/contents/" + (evt === "S" ? "Images_p" : "Images") + "/";
			this.asseturl = "https://api.github.com/repos/britmanjerin/tst/contents/" + (evt === "S" ? "asset_p" : "asset") + ".json";
			this.loadCustData();
			if (this._oPopover) {
				this._oPopover.close();
			}
		},

		onNav: function(obj) {
			this.getOwnerComponent().getRouter().navTo("customer", {
				custId: obj.key
			});
		},
		onNavLP: function(obj) {
			this.getOwnerComponent().getRouter().navTo("login");
		},

		onNavTo: function(obj) {
			this.getOwnerComponent().getRouter().navTo(obj);
		}

	});
});
