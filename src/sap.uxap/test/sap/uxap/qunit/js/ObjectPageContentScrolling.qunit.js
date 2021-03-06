/*global QUnit,sinon*/

(function ($, QUnit, sinon) {
	"use strict";

	jQuery.sap.registerModulePath("view", "./view");
	jQuery.sap.registerModulePath("sap.uxap.testblocks", "./blocks");
	jQuery.sap.require("sap.uxap.ObjectPageSubSection");
	jQuery.sap.require("sap.uxap.ObjectPageSection");
	jQuery.sap.require("sap.uxap.ObjectPageSectionBase");


	var oFactory = {
		getSection: function (iNumber, sTitleLevel, aSubSections) {
			return new sap.uxap.ObjectPageSection({
				title: "Section" + iNumber,
				titleLevel: sTitleLevel,
				subSections: aSubSections || []
			});
		},
		getSubSection: function (iNumber, aBlocks, sTitleLevel) {
			return new sap.uxap.ObjectPageSubSection({
				title: "SubSection " + iNumber,
				titleLevel: sTitleLevel,
				blocks: aBlocks || []
			});
		},
		getBlocks: function (sText) {
			return [
				new sap.m.Text({text: sText || "some text"})
			];
		},
		getObjectPage: function () {
			return new sap.uxap.ObjectPageLayout();
		}
	},

	helpers = {
		generateObjectPageWithContent: function (oFactory, iNumberOfSection, bUseIconTabBar) {
			var oObjectPage = bUseIconTabBar ? oFactory.getObjectPageLayoutWithIconTabBar() : oFactory.getObjectPage(),
				oSection,
				oSubSection;

			for (var i = 0; i < iNumberOfSection; i++) {
				oSection = oFactory.getSection(i);
				oSubSection = oFactory.getSubSection(i, oFactory.getBlocks());
				oSection.addSubSection(oSubSection);
				oObjectPage.addSection(oSection);
			}

			return oObjectPage;
		}
	};


	QUnit.module("ObjectPage Content scrolling");
	QUnit.test("Should validate each section's position after scrolling to it, considering UI rules", function (assert) {

		var clock = sinon.useFakeTimers();
		var oObjectPageContentScrollingView = sap.ui.xmlview("UxAP-objectPageContentScrolling", {
			viewName: "view.UxAP-ObjectPageContentScrolling"
		});

		oObjectPageContentScrollingView.placeAt('qunit-fixture');
		sap.ui.getCore().applyChanges();
		clock.tick(500);

		var oObjectPage = oObjectPageContentScrollingView.byId("ObjectPageLayout");

		for (var section in oObjectPage._oSectionInfo) {
			if (!oObjectPage._oSectionInfo.hasOwnProperty(section)) {
				continue;
			}

			//Scroll to section
			oObjectPage.scrollToSection(section,0,0);
			clock.tick(500);

			//Handle UI Rules special cases
			var iExpectedPosition;
			switch (section) {
				case "UxAP-objectPageContentScrolling--firstSection":
					iExpectedPosition =  0;
					break;
				case "UxAP-objectPageContentScrolling--subsection1-1":
					iExpectedPosition =  0;
					break;
				case "UxAP-objectPageContentScrolling--secondSection":
					iExpectedPosition =  oObjectPage._oSectionInfo["UxAP-objectPageContentScrolling--subsection2-1"].positionTop;
					break;
				case "UxAP-objectPageContentScrolling--thirdSection":
					iExpectedPosition = oObjectPage._oSectionInfo["UxAP-objectPageContentScrolling--subsection3-1"].positionTop;
					break;
				case "UxAP-objectPageContentScrolling--subsection3-1":
					iExpectedPosition = oObjectPage._oSectionInfo["UxAP-objectPageContentScrolling--subsection3-1"].positionTop;
					break;
				default:
					iExpectedPosition = oObjectPage._oSectionInfo[section].positionTop;
			}

			//Assert
			assert.strictEqual(oObjectPage._$opWrapper[0].scrollTop, iExpectedPosition, "Assert section: \"" + section + "\" position: " + iExpectedPosition);
		}
		clock.restore();
		oObjectPageContentScrollingView.destroy();
	});

	QUnit.test("Rerendering the page preserves the scroll position", function (assert) {

		var done = assert.async();
		var ObjectPageContentScrollingView = sap.ui.xmlview("UxAP-objectPageContentScrolling", {
			viewName: "view.UxAP-ObjectPageContentScrolling"
		});
		var oObjectPage = ObjectPageContentScrollingView.byId("ObjectPageLayout"),
			oSecondSection = ObjectPageContentScrollingView.byId("secondSection"),
			iScrollPositionBeforeRerender,
			iScrollPositionAfterRerender;

		oObjectPage.setSelectedSection(oSecondSection.getId());

		ObjectPageContentScrollingView.placeAt("qunit-fixture");
		sap.ui.getCore().applyChanges();

		setTimeout(function() {
			iScrollPositionBeforeRerender = oObjectPage._$opWrapper[0].scrollTop;
			oObjectPage.rerender();
			setTimeout(function() {
				iScrollPositionAfterRerender = oObjectPage._$opWrapper[0].scrollTop;
				assert.strictEqual(iScrollPositionAfterRerender, iScrollPositionBeforeRerender, "scrollPosition is preserved");
				ObjectPageContentScrollingView.destroy();
				done();
			}, 1000); // throttling delay
		}, 1000); //dom calc delay
	});

	QUnit.test("ScrollToSection in 0 time scrolls to correct the scroll position", function (assert) {

		var done = assert.async();
		var ObjectPageContentScrollingView = sap.ui.xmlview("UxAP-objectPageContentScrolling", {
			viewName: "view.UxAP-ObjectPageContentScrolling"
		});
		var oObjectPage = ObjectPageContentScrollingView.byId("ObjectPageLayout"),
			iScrollPosition,
			iExpectedPosition;

		ObjectPageContentScrollingView.placeAt("qunit-fixture");
		sap.ui.getCore().applyChanges();

		setTimeout(function() {
			oObjectPage.scrollToSection("UxAP-objectPageContentScrolling--secondSection", 0);
			setTimeout(function() {
				iScrollPosition = oObjectPage._$opWrapper[0].scrollTop;
				iExpectedPosition =  oObjectPage._oSectionInfo["UxAP-objectPageContentScrolling--subsection2-1"].positionTop;
				assert.strictEqual(iScrollPosition, iExpectedPosition, "scrollPosition is correct");
				ObjectPageContentScrollingView.destroy();
				done();
			}, 1000); // throttling delay
		}, 1000); //dom calc delay
	});

	QUnit.test("Deleting the above section preserves the selected section position", function (assert) {

		var done = assert.async();
		var ObjectPageContentScrollingView = sap.ui.xmlview("UxAP-objectPageContentScrolling", {
			viewName: "view.UxAP-ObjectPageContentScrolling"
		});
		var oObjectPage = ObjectPageContentScrollingView.byId("ObjectPageLayout"),
			oFirstSection = ObjectPageContentScrollingView.byId("firstSection"),
			oThirdSection = ObjectPageContentScrollingView.byId("thirdSection"),
			iScrollPositionAfterRemove,
			iExpectedPositionAfterRemove;

		oObjectPage.setSelectedSection(oThirdSection.getId());

		ObjectPageContentScrollingView.placeAt("qunit-fixture");
		sap.ui.getCore().applyChanges();


		setTimeout(function() {
			oObjectPage.removeSection(oFirstSection);
			setTimeout(function() {
				iScrollPositionAfterRemove = oObjectPage._$opWrapper[0].scrollTop;
				iExpectedPositionAfterRemove = jQuery("#" + oThirdSection.getId() + " .sapUxAPObjectPageSectionContainer").position().top; // top of third section content
				assert.strictEqual(iScrollPositionAfterRemove, iExpectedPositionAfterRemove, "scrollPosition is correct");
				ObjectPageContentScrollingView.destroy();
				oFirstSection.destroy();
				done();
			}, 1000); // throttling delay
		}, 1000); //dom calc delay
	});

	QUnit.test("Deleting the bellow section preserves the scroll position", function (assert) {

		var done = assert.async();
		var ObjectPageContentScrollingView = sap.ui.xmlview("UxAP-objectPageContentScrolling", {
			viewName: "view.UxAP-ObjectPageContentScrolling"
		});
		var oObjectPage = ObjectPageContentScrollingView.byId("ObjectPageLayout"),
			oSecondSection = ObjectPageContentScrollingView.byId("secondSection"),
			oThirdSection = ObjectPageContentScrollingView.byId("thirdSection"),
			iScrollPositionBeforeRemove,
			iScrollPositionAfterRemove;

		oObjectPage.setSelectedSection(oSecondSection.getId());

		ObjectPageContentScrollingView.placeAt("qunit-fixture");
		sap.ui.getCore().applyChanges();


		setTimeout(function() {
			oObjectPage.removeSection(oThirdSection);
			iScrollPositionBeforeRemove = oObjectPage._$opWrapper[0].scrollTop;
			setTimeout(function() {
				iScrollPositionAfterRemove = oObjectPage._$opWrapper[0].scrollTop;
				assert.strictEqual(iScrollPositionAfterRemove, iScrollPositionBeforeRemove, "scrollPosition is preserved");
				ObjectPageContentScrollingView.destroy();
				oThirdSection.destroy();
				done();
			}, 1000); // throttling delay
		}, 1000); //dom calc delay
	});

	QUnit.test("Should keep ObjectPageHeader in \"Expanded\" mode on initial load", function (assert) {

		var done = assert.async();
		var ObjectPageContentScrollingView = sap.ui.xmlview("UxAP-objectPageContentScrolling", {
			viewName: "view.UxAP-ObjectPageContentScrolling"
		});
		ObjectPageContentScrollingView.placeAt("qunit-fixture");
		sap.ui.getCore().applyChanges();
		var oObjectPage = ObjectPageContentScrollingView.byId("ObjectPageLayout");

		setTimeout(function() {
			assert.ok(!isObjectPageHeaderStickied(oObjectPage), "ObjectHeader is in \"Expanded\" mode");
			ObjectPageContentScrollingView.destroy();
			done();
		}, 1000); //dom calc delay

	});

	QUnit.test("Should change ObjectPageHeader in \"Stickied\" mode after scrolling to a lower section", function (assert) {

		var done = assert.async();
		var ObjectPageContentScrollingView = sap.ui.xmlview("UxAP-objectPageContentScrolling", {
			viewName: "view.UxAP-ObjectPageContentScrolling"
		});
		ObjectPageContentScrollingView.placeAt("qunit-fixture");
		sap.ui.getCore().applyChanges();
		var oObjectPage = ObjectPageContentScrollingView.byId("ObjectPageLayout");

		setTimeout(function(){
			//Act
			oObjectPage.scrollToSection("UxAP-objectPageContentScrolling--subsection3-1",0,0);
			setTimeout(function() {
				assert.ok(isObjectPageHeaderStickied(oObjectPage), "ObjectHeader is in stickied mode");
				ObjectPageContentScrollingView.destroy();
				done();
			}, 1000); //scroll delay
		}, 1000); //dom calc delay

	});

	QUnit.test("Should keep ObjectPageHeader in \"Stickied\" mode when scrolling", function (assert) {

		var done = assert.async();
		var ObjectPageContentScrollingView = sap.ui.xmlview("UxAP-objectPageContentScrolling", {
			viewName: "view.UxAP-ObjectPageContentScrolling"
		});
		ObjectPageContentScrollingView.placeAt("qunit-fixture");
		sap.ui.getCore().applyChanges();
		var oObjectPage = ObjectPageContentScrollingView.byId("ObjectPageLayout");

		setTimeout(function(){
			//Act
			oObjectPage.scrollToSection("UxAP-objectPageContentScrolling--subsection3-1",0,0);
			setTimeout(function() {
				assert.ok(isObjectPageHeaderStickied(oObjectPage), "ObjectHeader is in stickied mode");
				oObjectPage.scrollToSection("UxAP-objectPageContentScrolling--firstSection",0,0);
				setTimeout(function() {
					assert.ok(isObjectPageHeaderStickied(oObjectPage), "ObjectHeader is in stickied mode");
					ObjectPageContentScrollingView.destroy();
					done();
				}, 1000);
			}, 1000); //scroll delay
		}, 1000); //dom calc delay

	});

	QUnit.test("_isClosestScrolledSection should return the first section if all sections are hidden", function (assert) {
		var clock = sinon.useFakeTimers();
		var oObjectPageContentScrollingView = sap.ui.xmlview("UxAP-objectPageContentScrolling", {
			viewName: "view.UxAP-ObjectPageContentScrolling"
		});

		oObjectPageContentScrollingView.placeAt('qunit-fixture');
		sap.ui.getCore().applyChanges();
		clock.tick(500);

		var oObjectPage = oObjectPageContentScrollingView.byId("ObjectPageLayout"),
			aSections = oObjectPage.getSections(),
			sFirstSectionId = "UxAP-objectPageContentScrolling--firstSection";

		for (var section in aSections) {
			aSections[section].setVisible(false);
		}

		assert.strictEqual(oObjectPage._isClosestScrolledSection(sFirstSectionId), true, "Fisrt section is the closest scrolled section");

		clock.restore();
		oObjectPageContentScrollingView.destroy();
	});

	QUnit.test("ScrollEnablement private API", function (assert) {
		var oObjectPageContentScrollingView = sap.ui.xmlview("UxAP-objectPageContentScrolling", {
			viewName: "view.UxAP-ObjectPageContentScrolling"
		});

		// arrange
		oObjectPageContentScrollingView.placeAt('qunit-fixture');
		sap.ui.getCore().applyChanges();

		var oObjectPage = oObjectPageContentScrollingView.byId("ObjectPageLayout");

		oObjectPage._initializeScroller();

		assert.ok(oObjectPage._oScroller._$Container, "ScrollEnablement private API is OK.");

		oObjectPageContentScrollingView.destroy();
	});

	QUnit.test("auto-scroll on resize of last section", function (assert) {
		var oObjectPageLayout = helpers.generateObjectPageWithContent(oFactory, 2 /* two sections */),
			oLastSection = oObjectPageLayout.getSections()[1],
			oLastSubSection = oLastSection.getSubSections()[0],
			oResizableControl = new sap.ui.core.HTML({ content: "<div style='height: 100px'></div>"}),
			done = assert.async();

		oObjectPageLayout.setSelectedSection(oLastSection);
		oLastSubSection.addBlock(oResizableControl);

		oObjectPageLayout.attachEventOnce("onAfterRenderingDOMReady", function() {

			// make the height of the last section smaller
			oResizableControl.getDomRef().style.height = "10px";

			setTimeout(function() {
				assert.ok(oObjectPageLayout.getSelectedSection() === oLastSection.getId(), "Selection is preserved");
				oObjectPageLayout.destroy();
				done();
			}, 10);
		});

		// arrange
		oObjectPageLayout.placeAt('qunit-fixture');
		sap.ui.getCore().applyChanges();
	});

	function isObjectPageHeaderStickied(oObjectPage) {
		var oHeaderTitle = jQuery.sap.byId(oObjectPage.getId() + "-headerTitle");
		var oHeaderContent = jQuery.sap.byId(oObjectPage.getId() + "-headerContent");
		return oHeaderTitle.hasClass("sapUxAPObjectPageHeaderStickied") &&
				oHeaderContent.hasClass("sapUxAPObjectPageHeaderDetailsHidden") &&
				oHeaderContent.css("overflow") == "hidden";
	}

}(jQuery, QUnit, sinon, sap.uxap.Importance));