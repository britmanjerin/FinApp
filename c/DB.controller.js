sap.ui.define([
	"FabFinV3/c/BaseController",
	"sap/ui/model/json/JSONModel",
	"FabFinV3/u/formatter",
	"sap/m/MessageBox",
	'sap/viz/ui5/format/ChartFormatter',
	'sap/viz/ui5/api/env/Format',
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/HTML",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, JSONModel, formatter, MessageBox, ChartFormatter, Format, DateFormat, HTMLControl, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("FabFinV3.c.db", {
		formatter: formatter,
		onInit: function() {
			this.rCount1 = 0;
			this.rCount2 = 0;
			this.dModel = new JSONModel();
			this.lModel = new JSONModel();
			this.getView().setModel(this.dModel, "dModel");
			this.getView().setModel(this.lModel, "lModel");
			this.initVizTooltip();
			this.getOwnerComponent().getRouter().getRoute("db").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function(evt) {
			if (window.testRun) {
				this.custurl = "https://api.github.com/repos/britmanjerin/tst/contents/cust.json";
				this.expurl = "https://api.github.com/repos/britmanjerin/tst/contents/exp.json";
				this.byId("idStopTR").setVisible(true);
			} else {
				this.custurl = "https://api.github.com/repos/britmanjerin/tst/contents/cust_p.json";
				this.expurl = "https://api.github.com/repos/britmanjerin/tst/contents/exp_p.json";
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
			this.dbd = {};
			this.loadData();
		},
		loadData: function() {

			var that = this;
			var i = $.Deferred();
			var j = $.Deferred();
			sap.ui.core.BusyIndicator.show(0);
			var cData = [],
				eData = [];
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
					cData = atob(odata.content);
					cData = cData.trim() ? JSON.parse(cData) : [];
					i.resolve();
				},
				error: function(oError) {
					MessageBox.error(oError.responseJSON.message);
					i.resolve();
				}
			});
			$.ajax({
				type: 'GET',
				url: this.expurl,
				headers: this.headers,
				cache: false,
				success: function(odata) {

					if (!window.expsha) {
						window.expsha = odata.sha;
					} else {
						if (window.expsha != odata.sha) {

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

					eData = atob(odata.content);
					eData = eData.trim() ? JSON.parse(eData) : [];
					j.resolve();
				},
				error: function(oError) {
					MessageBox.error(oError.responseJSON.message);
					j.resolve();
				}
			});

			$.when(i, j).done(function() {
				sap.ui.core.BusyIndicator.hide();
				cData.forEach(function(e) {
					if (e.clsDt) {
						for (var i in e.payDet) {
							if (e.payDet[i].lnClsr || e.payDet[i].lnRen) {
								e.clsDt = new Date(e.payDet[i].payDate).getTime();
								break;
							}
						}
					}
					if (e.topUp) {
						e.topUp.forEach(function(el) {
							e.lnAmt = Number(e.lnAmt) + Number(el.amount);
						});
					}
				});

				that.cData = cData;
				that.dbData(cData, eData);
				var a = [];
				Object.keys(that.dbd).forEach(function(e) {
					a.push({
						key: e,
						text: e.toUpperCase()
					});
				});
				that.lModel.setData(a);
				that.setdbModel("ytd");
			});

		},

		onChangeDB: function(oEvent) {
			this.setdbModel(oEvent.getSource().getSelectedKey());
		},

		setdbModel: function(key) {
			key = this.dbd[key];
			var obj = {},
				that = this;
			obj.rev = ((key.amtp + key.adAmtf) - key.clam);
			obj.exp = key.exp;
			obj.mgn = obj.rev ? ((obj.rev - obj.exp) / obj.rev) * 100 : 0;
			obj.def = key.amtd
			obj.mgnVal = Math.abs(obj.mgn);
			obj.color = obj.mgn > 0 ? "Good" : "Error";
			obj.expDB = [], obj.lnAmtDB = [], obj.accDB = [], obj.sumDB = [];

			fil(obj.accDB, "Active", key.acc - (key.cls + key.ren));
			key.cls ? key.ga ? fil(obj.accDB, "Closed", (key.cls - key.ga)) : fil(obj.accDB, "Closed", key.cls) : null;
			key.ga ? fil(obj.accDB, "Auctioned", (key.ga)) : null;
			key.ren ? fil(obj.accDB, "Renewed", (key.ren)) : null;
			fil(obj.lnAmtDB, "Outstanding", (key.lamt - key.clam - key.ram - key.adAmt));
			fil(obj.lnAmtDB, "Settled", (key.clam + key.adAmt));
			var tObj = {};
			(key.expa || []).forEach(function(e) {
				tObj[e.typ] ? tObj[e.typ] += Number(e.amt) : tObj[e.typ] = Number(e.amt);
			});
			Object.keys(tObj).forEach(function(e) {
				for (var i in FabFinV3.ExpType) {
					if (FabFinV3.ExpType[i].key == e) {
						fil(obj.expDB, FabFinV3.ExpType[i].text, (tObj[e]));
						break;
					}
				}
			});
			key.m.forEach(function(e) {
				tObj = {};
				tObj.dim = e.sKey;
				tObj.rev = ((e.amtp + e.adAmtf) - e.clam);
				tObj.exp = e.exp;
				tObj.prft = tObj.rev - tObj.exp;
				tObj.prft = tObj.prft > 0 ? that.formatter.numberFormat_1(tObj.prft) : "";
				tObj.mgn = tObj.rev ? ((tObj.rev - tObj.exp) / tObj.rev) * 100 : 0;
				tObj.mgn = Math.round(tObj.mgn > 100 ? 100 : tObj.mgn < -100 ? -100 : tObj.mgn);
				obj.sumDB.push(tObj);
			});

			obj.accTit = key.acc;
			obj.lamtTit = key.lamt;
			obj.expTit = key.exp;

			this.dModel.setData(obj);
			this.getRevPerct();
			this.dModel.refresh();
			this.setVizProp(this.byId("idAccVF"), ["#6bbd6b", "#e36968", "#ffa556", "#629fcb"], true);
			this.setVizProp(this.byId("idAmtVF"), ["#00a64c", "#d4c44e"]);
			this.setVizProp(this.byId("idExpVF"), ["#95dd91", "#ba90dc", "#ffc186", "#ddd990", "#d95e01", "#6bbd6b", "#e36968", "#ffa556",
				"#629fcb", "#b8a1e7"
			]);
			this.setSumVizProp(this.byId("idSumVF"), "Summary");
			this.setSumVizProp(this.byId("idSumVF1"), "Summary", 1);

			function fil(arr, d, m) {
				arr.push({
					"mes": m,
					"dim": d
				})
			}
		},

		setSumVizProp: function(vf, tit, yf) {
			// Format.numericFormatter(ChartFormatter.getInstance());
			// var formatPattern = ChartFormatter.DefaultPattern;
			var that = this;
			var formatterInstance = ChartFormatter.getInstance();
			Format.numericFormatter(formatterInstance);

			formatterInstance.registerCustomFormatter("INR_Long", function(value) {
				var fixedFloat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
					minFractionDigits: 0
				}, new sap.ui.core.Locale("en-in"));
				return fixedFloat.format(value);
			});
			formatterInstance.registerCustomFormatter("INR_Short", function(value) {
				value = Math.abs(value)
				if (value >= 10000000) {
					value = Number((value / 10000000).toFixed(2));
					return String(value) + "C";

				} //return '${(value / 10000000).toFixed(2)}C'
				if (value >= 100000) {
					value = Number((value / 100000).toFixed(2));
					return String(value) + "L";

				}
				if (value >= 1000) {
					value = Number((value / 1000).toFixed(2));
					return String(value) + "K";

				}
				//	if (val >= 100000) return '${(value / 100000).toFixed(2)}L'
				return value;
			});

			if (!yf) {
				vf.setVizProperties({
					plotArea: {
						dataLabel: {
							type: "value",
							visible: true,
							formatString: "INR_Short",
							renderer: function(val) {
								var prft = "";
								try {
									for (var x in that.dModel.getData().sumDB) {
										if (that.dModel.getData().sumDB[x].dim === val.ctx.Month) {
											if (that.dModel.getData().sumDB[x].prft) {
												prft = " (" + that.dModel.getData().sumDB[x].prft + ")";
											}
											break;
										}
									}
								} catch (err) {}
								val.text = val['info'].key === "Margin" ? val.text + "%" + prft : "\u20B9" + val.text;
							}
						},
						dataShape: {
							primaryAxis: ["bar", "bar", "line"]
						},
						drawingEffect: "glossy",
						primaryValuesColorPalette: ["#008f91", "#e57872"],
						secondaryValuesColorPalette: ["#1e90ff"]
					},
					title: {
						text: "Monthly"
							//	visible: false
					},
					tooltip: {
						formatString: "INR_Long",
						postRender: function(dom) {
							try {
								if ($(dom[0][0]).children().children().children().children()[1].cells[0].textContent.indexOf("Margin") < 0) {
									var val = "\u20B9" + $(dom[0][0]).children().children().children().children()[1].cells[1].textContent;
									$(dom[0][0]).children().children().children().children()[1].cells[1].textContent = val;
								} else {
									var val = $(dom[0][0]).children().children().children().children()[1].cells[1].textContent + "%";
									$(dom[0][0]).children().children().children().children()[1].cells[1].textContent = val;
								}
							} catch (err) {
								console.log(err);
							}
						}
					},
					valueAxis: {
						title: {
							visible: false
						},
						label: {
							visible: false
						}
					},
					valueAxis2: {
						title: {
							visible: false
						},
						label: {
							visible: false
						}
					},
					categoryAxis: {
						title: {
							visible: false
						},
						label: {
							rotation: "fixed",
							angle: "0"
						},
						labelRenderer: function(val) {}
					},
					legend: {
						visible: true
					},
					legendGroup: {
						layout: {
							alignment: "center",
							position: "bottom"
						}
					}
				});

				this.vizPopOver.connect(vf.getVizUid());
				this.vizPopOver.setFormatString(ChartFormatter.DefaultPattern.STANDARDFLOAT);
			} else {

				vf.setVizProperties({
					plotArea: {
						dataLabel: {
							type: "value",
							visible: true,
							formatString: "INR_Short",
							renderer: function(val) {
								try {
									if (val.info.key === "Revenue") {
										val.text = "\u20B9" + val.text;
									} else {
										val.text = val.text + "%";
									}
								} catch (err) {}

							}
						},
						dataShape: {
							primaryAxis: ["bar", "line"]
						},
						secondaryScale: {
							fixedRange: true,
							maxValue: 50,
							minValue: 0
						},
						drawingEffect: "glossy",
						primaryValuesColorPalette: ["#6bbd6b"],
						secondaryValuesColorPalette: ["#d95e01"]
					},
					title: {
						text: "Yearly"
							//	visible: false
					},
					tooltip: {
						formatString: "INR_Long",
						postRender: function(dom) {
							try {
								if ($(dom[0][0]).children().children().children().children()[1].cells[0].textContent.indexOf("Interest") < 0) {
									var val = "\u20B9" + $(dom[0][0]).children().children().children().children()[1].cells[1].textContent;
									$(dom[0][0]).children().children().children().children()[1].cells[1].textContent = val;
								} else {
									var val = $(dom[0][0]).children().children().children().children()[1].cells[1].textContent + "%";
									$(dom[0][0]).children().children().children().children()[1].cells[1].textContent = val;
								}
							} catch (err) {
								console.log(err);
							}
						}
					},
					valueAxis: {
						title: {
							visible: false
						},
						label: {
							visible: false
						},
						layout: {
							width: 1
						}
					},
					valueAxis2: {
						title: {
							visible: false
						},
						label: {
							visible: false
						}
					},
					categoryAxis: {
						title: {
							visible: false
						},
						label: {
							rotation: "fixed",
							angle: "0"
						},
						labelRenderer: function(val) {}
					},
					legend: {
						visible: true
					},
					legendGroup: {
						layout: {
							alignment: "center",
							position: "bottom"
						}
					}
				});

			}

		},

		setVizProp: function(vf, clr, nf) {
			//	Format.numericFormatter(ChartFormatter.getInstance());
			//	var formatPattern = ChartFormatter.DefaultPattern;

			var formatterInstance = ChartFormatter.getInstance();
			Format.numericFormatter(formatterInstance);

			formatterInstance.registerCustomFormatter("INR_Long", function(value) {
				var fixedFloat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
					minFractionDigits: 0
				}, new sap.ui.core.Locale("en-in"));
				return fixedFloat.format(value);
			});
			formatterInstance.registerCustomFormatter("INR_Short", function(value) {
				value = Math.abs(value)
				if (value >= 10000000) {
					value = Number((value / 10000000).toFixed(2));
					return String(value) + "C";

				} //return '${(value / 10000000).toFixed(2)}C'
				if (value >= 100000) {
					value = Number((value / 100000).toFixed(2));
					return String(value) + "L";

				}
				if (value >= 1000) {
					value = Number((value / 1000).toFixed(2));
					return String(value) + "K";

				}
				//	if (val >= 100000) return '${(value / 100000).toFixed(2)}L'
				return value;
			})

			vf.setVizProperties({
				plotArea: {
					dataLabel: {
						type: "value",
						visible: true,
						formatString: "INR_Short",
						renderer: function(val) {
							val.text = nf ? val.text : "\u20B9" + val.text;
						}
					},
					drawingEffect: "glossy",
					colorPalette: clr
				},
				title: {
					visible: false
				},
				tooltip: {
					formatString: "INR_Long",
					postRender: function(dom) {
						if (!nf) {
							try {
								var val = "\u20B9" + $(dom[0][0]).children().children().children().children()[1].cells[1].textContent;
								$(dom[0][0]).children().children().children().children()[1].cells[1].textContent = val;
							} catch (err) {
								console.log(err);
							}
						}
					}

				},
				valueAxis: {
					title: {
						visible: true
					},
					label: {
						visible: true
					}
				},
				categoryAxis: {
					title: {
						visible: true
					},
					labelRenderer: function(val) {}
				},
				legend: {
					visible: true
				},
				legendGroup: {
					layout: {
						alignment: "center",
						position: "bottom"
					}
				}
			});

			/*	var oPopOver = this.getView().byId("idPopOver");
				oPopOver.connect(vf.getVizUid());
				oPopOver.setFormatString(ChartFormatter.DefaultPattern.STANDARDFLOAT);*/

		},

		initVizTooltip: function() {
			var that = this;
			this.vizPopOver = new sap.viz.ui5.controls.Popover({
				'customDataControl': function(data) {
					if (data.data.val) {
						var exData = that.dModel.getData().sumDB;
						var values = data.data.val,
							divStr = "",
							idx = values[1].value;
						var svg =
							"<svg width='10px' height='10px'><path d='M-5,-5L5,-5L5,5L-5,5Z' fill='#5cbae6' transform='translate(5,5)'></path></svg>";
						divStr = divStr + "<div style = 'margin: 15px 30px 10px 10px'>" + svg + "<b style='margin-left:10px'>" + values[0].value +
							"</b></div>";

						divStr = divStr + "<div style = 'margin: 5px 30px 10px 30px'>" + "Avg. Investment" + "<span style = 'float: right'>" + that.formatter
							.numberFormat_1(exData[idx].avgInv || 0) + "</span></div>";

						divStr = divStr + "<div style = 'margin: 5px 30px 10px 30px'>" + "Gross Revenue" + "<span style = 'float: right'>" + that.formatter
							.numberFormat_1(exData[idx].rev || 0) + "</span></div>";

						divStr = divStr + "<div style = 'margin: 5px 30px 10px 30px'>" + "Gross Interest Rate" + " <span style = 'float: right'>" + (
							exData[idx].grossInt) + " %" + "</span></div>";

						divStr = divStr + "<div style = 'margin: 5px 30px 10px 30px'>" + "Expense" + "<span style = 'float: right'>" + that.formatter
							.numberFormat_1(exData[idx].exp || 0) + "</span></div>";

						divStr = divStr + "<div style = 'margin: 5px 30px 10px 30px'>" + "Net Revenue" + "<span style = 'float: right'>" + (exData[
							idx].prft || "₹0") + "</span></div>";

						divStr = divStr + "<div style = 'margin: 5px 30px 10px 30px'>" + "Net Interest Rate" + " <span style = 'float: right'>" + (
							exData[idx].netInt) + " %" + "</span></div>";

						divStr = divStr + "<div style = 'margin: 5px 30px 10px 30px'>" + "Margin" + "<span style = 'float: right'>" + String(exData[
							idx].mgn) + " %" + "</span></div>";

						return new HTMLControl({
							content: divStr
						});
					}
				}
			});
		},

		dbData: function(cd, ed) {

			ed.sort((a, b) => {
				return new Date(a.dat) - new Date(b.dat);
			});
			cd.sort((a, b) => {
				return new Date(a.lnDt) - new Date(b.lnDt);
			});

			var fy = FabFinV3.fy;

			var iy, ey;

			if (new Date().getMonth() < fy) {
				iy = ey = new Date().getFullYear() - 1;
			} else {
				iy = ey = new Date().getFullYear();
			}
			var ctr1;
			try {
				ctr1 = new Date(ed[0].dat).getMonth() < fy ? 1 : 0;
				iy = (new Date(ed[0].dat).getFullYear() - ctr1) < iy ? (new Date(ed[0].dat).getFullYear() - ctr1) : iy;
				ctr1 = new Date(ed[ed.length - 1].dat).getMonth() < fy ? 1 : 0;
				ey = new Date(ed[ed.length - 1].dat).getFullYear() - ctr1 > ey ? new Date(ed[ed.length - 1].dat).getFullYear() - ctr1 : ey;
			} catch (err) {}
			try {
				ctr1 = new Date(cd[0].lnDt).getMonth() < fy ? 1 : 0;
				iy = (new Date(cd[0].lnDt).getFullYear() - ctr1) < iy ? (new Date(cd[0].lnDt).getFullYear() - ctr1) : iy;
				cd.sort((a, b) => {
					return new Date(b.modDt) - new Date(a.modDt);
				});
				ctr1 = new Date(cd[cd.length - 1].modDt).getMonth() < fy ? 1 : 0;
				ey = new Date(cd[cd.length - 1].modDt).getFullYear() - ctr1 > ey ? new Date(cd[cd.length - 1].modDt).getFullYear() - ctr1 : ey;
			} catch (err) {}
			var ytd = {};
			af(ytd);
			ytd["acc"] = cd.length;
			ytd["expa"] = ed
			var oy = {},
				io, vArr, ky, lac;
			for (var i = iy; i <= ey; i++) {
				io = fy > 0 ? (String(i) + "-" + String(i + 1)) : i, lac = {};
				oy[io] = {
					y: io,
					m: sm(i)
				}
				af(oy[io]);
				oy[io]["m"].forEach(function(e, z) {
					af(e);
					ed.forEach(function(el) {
						if (new Date(el.dat) >= e.id && new Date(el.dat) <= e.ed) {
							ky = "exp", [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], el.amt, el, e, oy[io], null, ky);
						}
					});
					cd.forEach(function(el) {
						if ((oy[io]["m"][oy[io]["m"].length - 1].ed >= new Date(el.lnDt) && oy[io]["m"][0].id <= new Date(el.clsDt ? new Date(Number(
								el.clsDt)).toDateString() : "12 31 9999"))) {
							lac[el.key] = Number(el.lnAmt);
						}
						if (new Date(el.lnDt) >= e.id && new Date(el.lnDt) <= e.ed) {
							ky = "nwa", [oy[io][ky], e[ky]] = fv([oy[io][ky], e[ky]], 1, {
								key: el.key,
								name: el.name,
								date: el.lnDt,
								refNo: el.refNo,
								lnAmt: el.lnAmt
							}, e, oy[io], null, ky);
							ky = "lamt", [ytd[ky]] = fv([ytd[ky]], el.lnAmt);
						}
						if (el.clsDt && (new Date(new Date(Number(el.clsDt)).toDateString()) >= e.id && new Date(new Date(Number(el.clsDt)).toDateString()) <=
								e.ed)) {
							ky = el.lnCls ? "cls" : "ren", [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], 1, el.key, e, oy[io], ytd,
								ky);
							ky = el.lnCls ? "clam" : "ram", [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], el.lnAmt);
							ky = el.goldAuctn ? "ga" : "", ky ? [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], 1, el.key, e, oy[io],
								ytd,
								ky) : null;
							ky = "amtd", Number(el.defAmt) > 0 ? [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], el.defAmt, el.key, e,
								oy[
									io], null, ky) : null;
							ky = "adAmtf", Number(el.advAmt) > 0 ? [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], (el.advAmt || 0), el
								.key,
								e, oy[io], null, ky) : null;
						}
						el.payDet.forEach(function(ele) {
							ele.pKey = el.key, ele.refNo = el.refNo, ele.name = el.name;
							if (ele.lnClsr || ele.lnRen) {
								ele.adAmtf = Number(el.advAmt || 0), ele.lnAmt = Number(el.lnAmt);
							}
							if (new Date(ele.payDate) >= e.id && new Date(ele.payDate) <= e.ed) {
								ky = "amtp", [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], ele.amt, ele,
									e, oy[io], ytd, ky);
								//new
								if (Number(ele.apAmt || 0) > 0 && !ele.rflg && !el.lnCls && !el.lnRen) {
									ky = "adAmt", [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], (ele.apAmt || 0));
								}
								//new
							}
						});

						if (el.topUp) {
							el.topUp.forEach(function(elem) {
								elem.pKey = el.key, elem.refNo = el.refNo, elem.name = el.name;
								if (new Date(elem.date) >= e.id && new Date(elem.date) <= e.ed) {
									ky = "tpamt", [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], elem.amount, elem,
										e, oy[io], ytd, ky);
								}
							});
						}
					});
					if (new Date(new Date().toDateString()) >= e.id && new Date(new Date().toDateString()) <= e.ed) {
						ky = "m";
						for (z; z >= 0; z--) {
							ytd[ky] ? ytd[ky].push(oy[io][ky][z]) : ytd[ky] = [oy[io][ky][z]];
						}

						try {
							z = 0;
							while (ytd[ky].length < 12 && oy[Object.keys(oy)[Object.keys(oy).indexOf(String(io)) - 1]]) {
								ytd[ky].push(oy[Object.keys(oy)[Object.keys(oy).indexOf(String(io)) - 1]][ky][z]), z++;
							}
						} catch (err) {}
					}

				});
				oy[io]["m"].reverse();

				Object.keys(lac).forEach(function(e) {
					oy[io]["acc"]++, oy[io]["lamt"] += lac[e];
				});

			}

			oy["ytd"] = ytd;
			this.dbd = oy;

			function sm(yr) {
				var a = [],
					o,
					f = fy;
				for (var j = 0; j < 12; j++) {
					o = {
						m: new Date(yr, f).getMonth(),
						id: new Date(yr, f, 1),
						ed: new Date(yr, f + 1, 0),
						sKey: DateFormat.getDateInstance({
							pattern: "MMM yyyy"
						}).format(new Date(yr, f))
					}
					a.push(o);
					f = (f + 1) % 12, yr = !f ? yr + 1 : yr;
				}
				return a;
			}

			function af(x) {
				return [x.exp, x.acc, x.lamt, x.amtp, x.nwa, x.ga, x.cls, x.ren, x.clam, x.ram, x.amtd, x.adAmt, x.adAmtf, x.tpamt] = Array(15).fill(
					0);
			}

			function fv(a, m, so, mo, yo, ytd, k) {
				vArr = [];
				a.forEach(function(ele) {
					vArr.push(ele += Number(m));
				});
				k && mo ? mo[k + "a"] ? mo[k + "a"].push(so) : mo[k + "a"] = [so] : null;
				k && yo ? yo[k + "a"] ? yo[k + "a"].push(so) : yo[k + "a"] = [so] : null;
				k && ytd ? ytd[k + "a"] ? ytd[k + "a"].push(so) : ytd[k + "a"] = [so] : null;
				return vArr;
			}

		},

		getRevPerct: function(yr) {
			var cd = $.extend(true, [], this.cData),
				m = $.extend(true, [], this.dbd[this.byId("idSelDB").getSelectedKey()].m),
				sumDB = this.dModel.getData().sumDB,
				tv, td;
			const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate(),
				dys = ((yer, mth) => {
					tv = {};
					for (var i = 1; i <= daysInMonth(yer, mth); i++) {
						tv[DateFormat.getDateInstance({
							pattern: "MMM dd, yyyy"
						}).format(new Date(yer, mth, i))] = 0;
					}
					return tv;
				});
			cd = cd.filter(function(el) {
				return new Date(el.lnDt) <= m[0].ed && new Date(el.clsDt ? new Date(Number(el.clsDt)).toDateString() : "12 31 9999") >= m[11].id
			});
			cd.forEach(function(el) {
				el.adv = {};
				for (var i = el.payDet.length - 1; i >= 0; i--) {
					if (el.payDet[i].lnClsr) {
						el.clsDt = el.payDet[i].payDate;
					}
					if (el.payDet[i].apAmt && el.payDet[i].apAmt != 0) {
						td = DateFormat.getDateInstance({
							pattern: "MMM dd, yyyy"
						}).format(new Date(el.payDet[i].payDate));
						el.adv[td] = el.adv[td] ? el.adv[td] + el.payDet[i].apAmt : el.payDet[i].apAmt;
					}
				}
			});
			m.forEach(function(e) {
				e.dys = dys(e.id.getFullYear(), e.m);
				cd.forEach(function(el) {
					if (new Date(el.lnDt) <= e.ed && new Date(el.clsDt ? el.clsDt : "12 31 9999") >= e.id) {
						Object.keys(e.dys).forEach(function(ele) {
							if (new Date(el.lnDt) <= new Date(ele) && new Date(el.clsDt ? el.clsDt : "12 31 9999") >= new Date(ele)) {
								if (el.adv[ele]) {
									el.lnAmt = Number(el.lnAmt) - el.adv[ele];
								}
								e.dys[ele] += Number(el.lnAmt);
							}
						});
					}
				});
			});
			tv = {
				yr: {
					avgInv: 0,
					grossInt: 0,
					netInt: 0,
					tdys: 0,
					exp: 0,
					rev: 0
				}
			};
			m.forEach(function(e) {
				td = DateFormat.getDateInstance({
					pattern: "MMM yyyy"
				}).format(e.id);
				tv[td] = 0;
				Object.keys(e.dys).forEach(function(el) {
					tv[td] += e.dys[el];
					tv.yr.avgInv += e.dys[el];
				});
				tv[td] = Math.round(tv[td] / Object.keys(e.dys).length);
				tv.yr.tdys += Object.keys(e.dys).length;
			});
			tv.yr.avgInv = Math.round((tv.yr.avgInv / tv.yr.tdys));
			sumDB.forEach(function(e) {
				tv.yr.exp += e.exp;
				tv.yr.rev += e.rev;
				e.avgInv = tv[e.dim];
				e.grossInt = e.avgInv ? (e.rev / (e.avgInv / 100)) : 0;
				e.netInt = e.avgInv ? (((e.rev - e.exp) / (e.avgInv / 100))) : 0;
				e.grossInt = Number(e.grossInt > 0 ? e.grossInt : 0).toFixed(2);
				e.netInt = Number(e.netInt > 0 ? e.netInt : 0).toFixed(2);
			});
			tv.yr.grossInt = tv.yr.avgInv ? ((tv.yr.rev / (tv.yr.avgInv / 100))) : 0;
			tv.yr.netInt = tv.yr.avgInv ? (((tv.yr.rev - tv.yr.exp) / (tv.yr.avgInv / 100))) : 0;
			tv.yr.grossInt = Number(tv.yr.grossInt > 0 ? tv.yr.grossInt : 0).toFixed(2);
			tv.yr.netInt = Number(tv.yr.netInt > 0 ? tv.yr.netInt : 0).toFixed(2);
			tv.yr.dtRg = sumDB[11].dim + " - " + sumDB[0].dim;
			tv.yr.sumDB = [{
				dim: "Gross",
				rev: tv.yr.rev,
				int: Number(tv.yr.grossInt)
			}, {
				dim: "Net",
				rev: (tv.yr.rev - tv.yr.exp),
				int: Number(tv.yr.netInt)
			}];

			this.dModel.getData().avgInv = tv.yr;
		},

		onSelectVF: function(oEvent) {
			var status = oEvent.getParameter('data')[0].data.Status;
		},

		onChangeKey: function(evt) {
			var filterArray = [];
			filterArray.push(new Filter("key", FilterOperator.EQ, sap.ui.getCore().byId("idSelKey").getSelectedKey()));
			sap.ui.getCore().byId("idList").getBinding("items").filter(filterArray);
		},

		onSelectSumVF: function(oEvent) {
			oEvent.getSource().vizSelection([], {
				"clearSelection": true
			});
			if (oEvent.getParameter('data').length > 1) {

				var that = this,
					[mArr, dbt, crt, int] = [
						[], 0, 0, 0
					],
					month = oEvent.getParameter('data')[0].data.Month,
					mObj = that.dbd[that.byId("idSelDB").getSelectedKey()].m.filter(e => e.sKey === month)[0];

				(mObj.amtpa || []).forEach(e => {

					if (e.lnClsr) {

						mArr.push({ //Loan Closure
							key: "C",
							desc: "Principal",
							amt: e.lnAmt,
							dt: new Date(e.payDate),
							rem: "Loan Closure - " + e.name + " (" + e.refNo + ")",
							mKey:e.pKey
						});
						mArr.push({ //Credit Interest
							key: "I",
							desc: "Interest",
							amt: (Number(e.amt) + Number(e.adAmtf)) - e.lnAmt,
							dt: new Date(e.payDate),
							rem: "Credited - " + e.name + " (" + e.refNo + ")",
							mKey:e.pKey
						});
					} else {
						if (e.amt < 0) {
							mArr.push({ //Debit Interest
								key: "I",
								desc: "Interest",
								amt: e.amt,
								dt: new Date(e.payDate),
								rem: "Payment Reversal - " + e.name + " (" + e.refNo + ")",
								mKey:e.pKey
							});
						} else if (e.amt > 0) {
							mArr.push({ //Credit Interest
								key: "I",
								desc: "Interest",
								amt: e.amt,
								dt: new Date(e.payDate),
								rem: "Credited - " + e.name + " (" + e.refNo + ")",
								mKey:e.pKey
							});
						}
						if (e.apAmt < 0) {
							mArr.push({ //Debit Adv Pay
								key: "D",
								desc: "Principal",
								amt: e.apAmt,
								dt: new Date(e.payDate),
								rem: "Payment Reversal - " + e.name + " (" + e.refNo + ")",
								mKey:e.pKey
							});
						} else if (e.apAmt > 0) {
							mArr.push({ //Credit Adv Pay
								key: "C",
								desc: "Principal",
								amt: e.apAmt,
								dt: new Date(e.payDate),
								rem: "Advance Payment - " + e.name + " (" + e.refNo + ")",
								mKey:e.pKey
							});
						}
					}
				});
				(mObj.nwaa || []).forEach(e => {
					mArr.push({ //New Acc
						key: "D",
						desc: "Principal",
						amt: -Number(e.lnAmt),
						dt: new Date(e.date),
						rem: "New Account - " + e.name + " (" + e.refNo + ")",
						mKey:e.key
					});
				});

				(mObj.tpamta || []).forEach(e => {
					mArr.push({ //Topup
						key: "D",
						desc: "Principal",
						amt: -Number(e.amount),
						dt: new Date(e.date),
						rem: "Topup - " + e.name + " (" + e.refNo + ")",
						mKey:e.pKey
					});
				});

				mArr.sort((a, b) => {
					return new Date(a.dt) - new Date(b.dt);
				});

				mArr.forEach(e => {
					e.tot = increment(e.key, e.amt)
				});

				mArr.reverse();

				function increment(key, val) {
					switch (key) {
						case "I":
							int += val;
							val = int;
							break;
						case "C":
							crt += val;
							val = crt;
							break;
						case "D":
							dbt += val;
							val = dbt;
							break;
						default:
					}
					return val;
				}

				if (that._mrDialog) {
					that._mrDialog.destroy();
				}
				that._mrDialog = sap.ui.xmlfragment("FabFinV3.f.mReport", that);
				that.getView().addDependent(that._mrDialog);
				sap.ui.getCore().byId("idRepTit").setText(month);
				that._mrDialog.setModel(new JSONModel($.extend(true, {}, mArr)), "mRep");
				that.onChangeKey();
				$.sap.delayedCall(10, this, function() {
					that.vizPopOver.close();
					that._mrDialog.open();
				});
			}
		},

		onClose: function() {
			if (this._mrDialog) {
				this._mrDialog.destroy();
			}
		},

		onNav: function(obj) {
			this.getOwnerComponent().getRouter().navTo("customer", {
				custId: obj.mKey
			});
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
		}

	});
});
