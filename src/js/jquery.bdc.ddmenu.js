/*
 * BDC DrillDown Menu - http://www.barandis.com/dev/jquery/ddmenu
 *
 * A UI component implementing a compact, multi-level sliding menu.
 *
 * Requires:
 *     * jQuery 1.2
 *     * jQuery Dimensions 1.2 (unless jQuery is version 1.2.6+)
 * Optional:
 *     * jQuery Easing 1.3
 *
 * TERMS OF USE
 *
 * Copyright (C) 2008, Thomas J. Otterson (dev@barandis.com)
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following
 * conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright notice, this list of conditions and the
 *       following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
 *       following disclaimer in the documentation and/or other materials provided with the distribution.
 *     * Neither the name of the author nor the names of contributors may be used to endorse or promote products derived
 *       from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING,
 * BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
 * SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Version 0.3, 28.06.2008
 */

(function($){

	$.fn.ddMenu = function(options) {
		DDMenu(this, options);
	};

	function DDMenu(root, opts) {

		opts = options(opts);						// default options overridden by user-supplied options

		/*
		 * Function: object
		 *
		 * Standard library function to produce a new object.
		 *
		 * Parameters:
		 * 		parent -> the object which will act as the parent of the new object.
		 * Returns:
		 * 		a new object parented to the supplied object.
		 */
		function object(parent) {
			function F() {}
			F.prototype = parent;
			return new F();
		}

		/*
		 * Function: options
		 *
		 * Merges a supplied options object with the default one (see $.fn.ddMenu.defaults). This is used instead of $.extend
		 * because $.extend modifies the parent object (in this case, the default options). Used here, that would cause options to
		 * bleed into other menus on the same page.
		 *
		 * Parameters:
		 * 		opts -> the user-supplied options object whose properties will override those of the default options object.
		 * Returns:
		 * 		a new options object containing the default options, except where overridden by the user-supplied options.
		 */
		function options(opts) {
			var that = object($.fn.ddMenu.defaults);
			for (var i in opts) {
				that[i] = opts[i];
			}
			return that;
		}

		/*
		 * Function: init
		 *
		 * Sets up the DrillDown Menu on the object supplied as the root in the constructor. This function adds divs and classes to
		 * the user-supplied structure like this (* indicates a user-supplied menu tag, while ** indicates a user-supplied item
		 * tag and *** a user-supplied label tag):
		 *
		 * div.menuClass
		 * +-- div.menuPanelClass
		 *     +-- div.titleRootClass (on first menu panel) or div.titleClass (on second and subsequent menu panels)
		 *     |   |-- div.titleIconClass (on second and subsequent menu panels)
		 *     |   +-- div.titleLabelClass
		 *     +-- div.scrollPaneClass
		 *         |-- div.scrollUpClass (if *.subMenuClass has > height than div.scrollPaneClass)
		 *         |-- div.scrollDownClass (if *.subMenuClass has > height than div.scrollPaneClass)
		 *         +-- *.subMenuClass
		 *             +-- **.itemClass
		 *                 +-- div.labelClass
		 *                     |-- div.iconClass (if **.itemClass has *.subMenuClass child)
		 *                     |-- ***.textClass
		 *                     +-- (*.subMenuClass)?...
		 *
		 * When drilldown occurs, the next div.menuPanelClass is formed in the same manner from the *.subMenuClass child of the
		 * selected **.itemClass element and is placed as a following sibling to the current deepest div.menuPanelClass.
		 */
		function init() {
			// Bug #2847: the :first-child selector will select a comment if it happens to be the first child, but only
			// in IE. So in IE we're going to remove all of the comments first. This affects jQuery 1.2.3, but is due to
			// be fixed in 1.2.4.
			if ($.browser.msie) {
				removeComments(self.get(0));
			}

			// wrap the outer user-supplied menu with div.menuClass and div.menuPanelClass
			var self = $(root).wrap('<div class="' + opts.menuClass + '"><div class="' + opts.menuPanelClass + '"><div class="' +
					opts.scrollPaneClass + '"></div></div></div>');
			var pane = self.parents('.' + opts.scrollPaneClass);
			var panel = self.parents('.' + opts.menuPanelClass);
			var menu = self.parents('.' + opts.menuClass);

			// add .subMenuClass to all * and .itemClass to all **
			decorateMenu(self);

			// set the height and width of div.menuPanelClass to fit exactly into div.menuClass
			setOuterHeight(panel, menu.height(), true);
			setOuterWidth(panel, menu.width(), true);

			// wrap each *** (first child of **.itemClass) in div.labelClass and add .textClass to the ***
			self.find('.' + opts.itemClass + ' > *:first-child')
				.wrap('<div class="' + opts.labelClass + '"></div>')
				.addClass(opts.textClass);

			// if the **.itemClass came with a *.subMenuClass child, then add div.iconClass as div.labelClass's first child and
			// adjust the corresponding ***.textClass's width to accomodate. This means that the node is a branch.
			self.find('.' + opts.itemClass + ':has(.' + opts.subMenuClass + ') > div.' + opts.labelClass).each(function() {
				var label = $(this);
				var height = label.height();
				label.prepend('<div class="' + opts.iconClass + '">&nbsp;</div>');

				// This next line is a hack to fix a rounding error in Firefox 2.0. If FF2 calculates an element
				// height of, say, 23.7, then $(this).height() will return 24...but the element will be displayed
				// with a height of 23px. Calling setOuterHeight with the returned value of 24 will then cause
				// the icon div to be larger than the wrapper div, and then all of the icons are skewed.
				label.height(height);
				var iconDiv = label.children('.' + opts.iconClass);
				setOuterHeight(iconDiv, height, true);
				setOuterWidth(label.children('.' + opts.textClass), label.outerWidth() - iconDiv.outerWidth(true));
			});


			// add the proper hover/click behavior to each label
			self.find('.' + opts.labelClass).each(function() {
				addInteraction($(this));
			});

			self.find('.' + opts.subMenuClass).hide();			// hide all submenus that are not the root submenu
			addTitle(panel, opts.rootTitle, true);				// add div.titleClass, div.titleIconClass, and div.titleLabelClass
			setScrollPaneDimensions(panel);						// set div.scrollPaneClass height and width
			addScrollButtons(pane);

			choosePanel(menu);									// recursively create subpanels until reaching the one holding the
																// initial label
			highlight(menu);									// apply .labelInitialClass to the initial label

			// recursively adds .subMenuClass and .itemClass to all of the appropriate elements
			function decorateMenu(element) {
				element.addClass(opts.subMenuClass).css('position', 'relative');
				element.children().addClass(opts.itemClass).each(function() {
					if ($(this).children().size() > 1) {
						decorateMenu($(this).children(':last'));
					}
				});
			}
			
			
			prepareAC();
		}

		/*
		 * Function: drillDown
		 *
		 * Drills down to the next submenu according to the selected **.itemClass. This is done by wrapping that item's
		 * *.subMenuClass child in a div.menuPanelClass, sizing and positioning it, and then animating it into the main menu.
		 *
		 * Parameters:
		 * 		item -> the **.itemClass whose child *.subMenuClass element will be cloned and displayed.
		 */
		function drillDown(item) {
			var panel = cloneSubmenu(item);
			var title = item.children(':first').children(':last').text();
			var dir = opts.inDirection ? opts.inDirection : opts.direction;

			// adds the new div.menuPanelClass to the end inside the div.menuClass.
			var menu = item.parents('.' + opts.menuClass).append(panel);
			setOuterHeight(panel, menu.height(), true);
			setOuterWidth(panel, menu.width(), true);

			var pos = getPanelPosition(menu, panel, dir);

			panel.css({ position: 'relative', left: pos.outside.left, top: pos.outside.top });
			panel.show();
			addTitle(panel, title, false);

			setScrollPaneDimensions(panel);
			addScrollButtons(panel.children('.' + opts.scrollPaneClass));

			// this must be done with each drilldown because there's a good chance that the submenu with the initial label has been
			// destroyed at some point (on a drillup).
			highlight(item.parents('.' + opts.menuClass));

			panel.animate({ left: pos.inside.left, top: pos.inside.top },
					opts.inDuration ? opts.inDuration : opts.duration,
					opts.inEasing ? opts.inEasing : opts.easing);
		}

		/*
		 * Function: drillUp
		 *
		 * Drills up to the parent submenu of the currently displayed submenu. This is simpler than drilling down because no menu
		 * need be cloned and positioned; the current div.menuPanel need only be animated out of sight in the appropriate direction
		 * and then destroyed once out of sight.
		 *
		 * Parameters:
		 * 		panel -> the div.menuPanel to animate out and destroy.
		 */
		function drillUp(panel) {
			var menu = panel.parent();
			var dir = opts.outDirection ? opts.outDirection : opts.direction;

			var pos = getPanelPosition(menu, panel, dir);

			// slides the div.menuPanel out of sight and then deletes it.
			panel.animate({ left: pos.outside.left, top: pos.outside.top },
					opts.outDuration ? opts.outDuration : opts.duration,
					opts.outEasing ? opts.outEasing : opts.easing, function(){
						panel.remove();
					});
		}

		/*
		 * Function: choosePanel
		 *
		 * Recursively displays each submenu in the path indicated by the 'initial' property. Each menu is on top of the next, so at
		 * the end, the result is the same as if the menus had been drilled into (except that there is no animation). If the
		 * 'initial' path is invalid, this will drill down as far as it can and then stop, so be careful to get the paths right.
		 *
		 * Parameters:
		 * 		menu -> the div.menuClass object that encapsulates the entire menu whose initial panel is being selected.
		 */
		function choosePanel(menu) {
			if (opts.initial != null) {
				var parts = opts.initial.split(opts.separator);
				var current = menu.children(':first');

				for (var i in parts) {
					// ignore if we're on the last part of the path; highlight() handles this instead
					if (i < parts.length - 1) {
						var label = current
							.find('.' + opts.labelClass + ' .' + opts.textClass + ":contains('" + parts[i] + "')");
						if (label) {
							var submenu = label.parents('.' + opts.itemClass).children('.' + opts.subMenuClass);
							if (submenu) {
								// this section does pretty much the same thing as drillDown(), except that it always places the
								// menu panel atop the current one and does no animation.
								var panel = cloneSubmenu(submenu.parent());
								menu.append(panel);
								setOuterHeight(panel, menu.height(), true);
								setOuterWidth(panel, menu.width(), true);

								var dir = opts.inDirection ? opts.inDirection : opts.direction;
								var pos = getPanelPosition(menu, panel, dir);

								panel.css({ position: 'relative', top: pos.inside.top, left: pos.inside.left });
								panel.show();
								addTitle(panel, parts[i], false);

								setScrollPaneDimensions(panel);
								addScrollButtons(panel.children('.' + opts.scrollPaneClass));

								current = panel;
							}
						}
					}
				}
			}
		}

		/*
		 * Function: getPanelPosition
		 *
		 * Calculates the expected positions at the beginnings and ends of animations for the supplied panel in the given menu when
		 * the panel is to be animated in the selected direction. This function takes borders, paddings, and margins into account
		 * properly. The calcualted positions are relative to where the panel would be placed by natural page layout, and therefore
		 * they are appropriate to use as 'top' and 'left' properties in a 'position: relative' panel.
		 *
		 * Parameters:
		 * 		menu -> the div.menuClass to which the panel belongs.
		 * 		panel -> the div.menuPanelClass whose positions are being calculated.
		 * 		dir -> the direction from which the drilldown animation starts.
		 * Returns: Object
		 * 		an object of two properties, 'inside' and 'outside'. Each of these properties are in turn objects, each with two
		 * 		properties, 'top' and 'left'. Thus, 'value.inside.top' is the expected 'top' offset if the panel is positioned
		 * 		inside the div.menuClass (i.e., if it's visible), while 'value.outside.left' would be the 'left' offset if the panel
		 * 		is placed outside the div.menuClass; i.e., where it begins its drilldown animation.
		 */
		function getPanelPosition(menu, panel, dir) {
			var left, top;
			var index = panel.prevAll().size();		// this is important because even when a panel is placed relatively, the next
													// panel is by default positioned where it would be if the first panel was
													// placed normally. Thus, we need to determine how many times to multiply the
													// offset, which is based on how deep the submenu is in the hierarchy.
			var offset = (panel.outerHeight() + getMarginGap(panel)) * index;
			switch (dir) {
				case 'west':
					left = -panel.outerWidth(true);
					top = -offset;
					break;
				case 'north':
					left = 0;
					top = -(menu.outerHeight() + offset);
					break;
				case 'south':
					left = 0;
					top = panel.outerHeight(true) - offset;
					break;
				default:
					left = menu.outerWidth();
					top = -offset;
					break;
			}
			return {
				outside: { top: top, left: left },
				inside: { top: -offset, left: 0 }
			}
		}

		/*
		 * Function: getMarginGap
		 *
		 * Calculates the actual displayed margin gap between two panels. This calculation must be made because the margins collapse
		 * when placed against one another; i.e., the largest margin becomes the total margin between the two panels.
		 *
		 * Parameters:
		 * 		panel -> any panel with the proper div.menuPanelClass, whose effective margin between it and a preceding or
		 * 				following panel of the same class is calculated.
		 * Returns: Number
		 * 		the number of pixels in the effective margin.
		 */
		function getMarginGap(panel) {
			var top = getWidth(panel, 'margin-top');
			var bottom = getWidth(panel, 'margin-bottom');
			return top > bottom ? top : bottom;
		}

		/*
		 * Function: highlight
		 *
		 * Traces the 'initial' property path along the menu hierarchy, locates the designated menu label, and applies
		 * .labelInitialClass to it. This only happens if the menu does not already have a highlighted label; there can only be one
		 * at a time.
		 *
		 * Parameters:
		 * 		menu -> the div.menuClass object that encapsulates the entire menu whose initial label is being highlighted.
		 */
		function highlight(menu) {
			// it's only necessary to do this if there isn't already an initial class present somewhere, as the initial item
			// remains properly classed until its menu is deleted (by sliding out).
			if (opts.initial != null && menu.find('.' + opts.labelInitialClass).size() == 0) {
				var parts = opts.initial.split(opts.separator);
				var current = menu.children('.' + opts.menuPanelClass + ':first');		// the first menu panel
				for (var i = 0, count = parts.length; i < count; i++) {
					if (i == count - 1) {
						current.children('.' + opts.scrollPaneClass)
							.children('.' + opts.subMenuClass).children('.' + opts.itemClass).children('.' + opts.labelClass)
							.each(function(){	// each label wrapper in the current menu panel
								if ($(this).find('.' + opts.textClass).text() == parts[i]) {
									replaceClass($(this), opts.labelClass, opts.labelInitialClass);
									$(this).hover(
										function() {
											replaceClass($(this), opts.labelInitialClass, opts.labelInitialHoverClass);
										},
										function() {
											replaceClass($(this), opts.labelInitialHoverClass, opts.labelInitialClass);
										}
									);
								}
							});
					}
					else {
						var next = current.next();
						if (!next)
							return;
						var present = false;
						next.children('.' + opts.titleClass).find('.' + opts.titleLabelClass).each(function() {
							if ($(this).text() == parts[i]) {
								present = true;
								return false;
							}
						});
						if (!present)
							return;
						else
							current = next;
					}
				}
			}
		}

		/*
		 * Function: cloneSubmenu
		 *
		 * Clones the *.subMenuClass associated with the given **.itemClass, wraps it in a div.menuPanelClass, and returns the full
		 * panel.
		 *
		 * Parameters:
		 * 		item -> the **.itemClass whose *.subMenuClass child is being cloned and processed.
		 * Returns: jQuery
		 * 		the newly formed div.menuPanelClass with the selected submenu inside.
		 */
		function cloneSubmenu(item) {
			var panel = $('<div class="' + opts.menuPanelClass + '"><div class="' + opts.scrollPaneClass + '"></div</div>');
			var menu = item.children('.' + opts.subMenuClass + ':last').clone(true).show();
			panel.children('.' + opts.scrollPaneClass).append(menu);

			return panel;
		}

		/*
		 * Function: addTitle
		 *
		 * Adds a title consisting of div.titleCLass or div.titleRootClass wrapping div.titleLabelClass and (if necessary)
		 * div.titleIconClass as the first child of the supplied div.menuPanelClass.
		 *
		 * Parameters:
		 * 		panel -> the div.menuPanelClass having a title added.
		 * 		title -> the text of the title.
		 * 		root -> a Boolean indicating whether this menu is the root. This determines which class is added to the new title
		 * 				element and also whether it has an icon.
		 */
		function addTitle(panel, title, root) {
			var markup = '<div class="' + opts.titleClass + '">';
			if (!root) {
				markup += '<div class="' + opts.titleIconClass + '">&nbsp;</div>';
				markup += '<div class="' + opts.titleLabelClass + '">' + title + '<span style="float:right;">'+opts.backText+'</span>'+ '</div></div>';
			}else{ //1�re fois lorsqu'on ouvre le menu
				//markup += '<div class="' + opts.titleLabelClass + '">' + title + '</div></div>';
				
				//je cr�e l'input (compl�tion automatique)
				var inputCA = '<input type="text" id="completion" class="search" />' ;
				
				//j'ins�re le input
				markup += '<div class="' + opts.titleLabelClass + '" style="padding:0">' + inputCA + '</div></div>';
			}
			panel.prepend(markup);

			var titleDiv = panel.find('.' + opts.titleClass);
			if (root) {
				
				replaceClass(titleDiv, opts.titleClass, opts.titleRootClass);
				titleDiv.hover(
					function() {
						replaceClass($(this), opts.titleRootClass, opts.titleRootHoverClass);
					},
					function() {
						replaceClass($(this), opts.titleRootHoverClass, opts.titleRootClass);
					}
				);
			}
			else {
				var label = titleDiv.find('.' + opts.titleLabelClass);
				var icon = titleDiv.find('.' + opts.titleIconClass);

				titleDiv.hover(function() {
					replaceClass($(this), opts.titleClass, opts.titleHoverClass);
				}, function() {
					replaceClass($(this), opts.titleHoverClass, opts.titleClass);
				}).click(function() {
					drillUp(panel);
				});

				setOuterHeight(icon, label.outerHeight(), true);
				setOuterWidth(label, titleDiv.outerWidth() - (icon.size() == 0 ? 0 : icon.outerWidth(true)));
				label.css('margin-right', icon.outerWidth({ margin: true }));
			}
		}

		/*
		 * Function: addInteraction
		 *
		 * Adds all of the hover and click functionalities to parts of a label. This is a set up function, running only once upon
		 * the menu setup.
		 *
		 * Parameters:
		 * 		label -> the label being set up with interactive functionality.
		 */
		function addInteraction(label) {
			// Used when the div.labelClass has one child, meaning that there is no icon and therefore that there is no submenu
			// anchored here. In this case, the div.labelClass gets the hover. No click is added because presumably
			// ***.textClass came with an action already (<a href="*">, onclick, etc.).
			if (label.children().size() == 1) {
				label.hover(function() {
					replaceClass($(this), opts.labelClass, opts.labelHoverClass);
				}, function() {
					replaceClass($(this), opts.labelHoverClass, opts.labelClass);
				});
			}
			else {
				var link = label.find('a[href].' + opts.textClass);

				// Used when the div.labelClass has two children (icon and text) and the ***.textClass child is an <a> element
				// with an href attribute. In this case, div.textClass and div.iconClass get separate hover behaviors and the
				// div.iconClass gets a click action that drills down to the next menu. This is a split branch, and the already-
				// existent a.textClass provides the action for the text part of the branch.
				if (link.size() == 1) {
					link.hover(function() {
						replaceClass($(this), opts.textClass, opts.textHoverClass);
					}, function(){
						replaceClass($(this), opts.textHoverClass, opts.textClass);
					});
					label.find('div.' + opts.iconClass).hover(function() {
						replaceClass($(this), opts.iconClass, opts.iconHoverClass);
					}, function() {
						replaceClass($(this), opts.iconHoverClass, opts.iconClass);
					}).click(function() {
						drillDown(label.parent());
					});
				}

				// Used when the div.labelClass has two children (icon and text) but the ***.textClass is not an <a> element
				// with an href attribute. In this case, the div.labelClass receives both the hover and a click action which
				// drills down to the next menu. This is an unsplit branch.
				else {
					label.hover(function(){
						replaceClass($(this), opts.labelClass, opts.labelHoverClass);
					}, function(){
						replaceClass($(this), opts.labelHoverClass, opts.labelClass);
					}).click(function(){
						drillDown(label.parent());
					});
				}
			}
		}

		/*
		 * Function: addScrollButtons
		 *
		 * As the name suggests, this function adds the up and down scroll buttons to a scroll pane. This function is run only once
		 * per submenu, when it's created, and it only acts if the submenu is longer than the menu itself (i.e., if scrolling might
		 * be necessary). The "scroll up" button is initially hidden, since the menu starts in its topmost position anyway.
		 *
		 * Parameters:
		 * 		pane -> the scroll pane for the submenu, where the scroll buttons will be added.
		 */
		function addScrollButtons(pane) {
			var submenu = pane.children('.' + opts.subMenuClass);
			if (submenu.height() > pane.height()) {
 
				var up = $('<div class="' + opts.scrollUpClass + '">&nbsp;</div>');
				var down = $('<div class="' + opts.scrollDownClass + '">&nbsp;</div>');
				pane.prepend(down).prepend(up);
				var position = getScrollPosition(pane, submenu);

				up
					.hover(
						function() {
							replaceClass($(this), opts.scrollUpClass, opts.scrollUpHoverClass);
						},
						function() {
							replaceClass($(this), opts.scrollUpHoverClass, opts.scrollUpClass);
							replaceClass($(this), opts.scrollUpClickClass, opts.scrollUpClass);
							up.scroll = false;
						})
					.mousedown(
						function() {
							replaceClass($(this), opts.scrollUpHoverClass, opts.scrollUpClickClass);
							up.scroll = true;
							scrollUp(submenu, up, down, position);
						})
					.mouseup(
						function() {
							replaceClass($(this), opts.scrollUpClickClass, opts.scrollUpHoverClass);
							up.scroll = false;
						});
				down.
					hover(
						function() {
							replaceClass($(this), opts.scrollDownClass, opts.scrollDownHoverClass);
						},
						function() {
							replaceClass($(this), opts.scrollDownHoverClass, opts.scrollDownClass);
							replaceClass($(this), opts.scrollDownClickClass, opts.scrollDownClass);
							down.scroll = false;
						})
					.mousedown(
						function() {
							replaceClass($(this), opts.scrollDownHoverClass, opts.scrollDownClickClass);
							down.scroll = true;
							scrollDown(submenu, up, down, position);
						})
					.mouseup(
						function() {
							replaceClass($(this), opts.scrollDownClickClass, opts.scrollDownHoverClass);
							down.scroll = false;
						});

				up.hide();
			}
		}

		/*
		 * Function: scrollUp
		 *
		 * Scrolls the supplied menu panel up. This is presumably done in response to a click on the "scroll up" button. This
		 * automatically handles the display of each of the buttons in relation to the current position of the submenu.
		 *
		 * Parameters:
		 * 		submenu -> the submenu that is actually being scrolled.
		 * 		up -> the "scroll up" button element.
		 * 		down -> the "scroll down" button element.
		 * 		position -> an object denoting the starting and ending position for scrolling the submenu. This comes directly from
		 * 				getScrollPosition().
		 */
		function scrollUp(submenu, up, down, position) {
			if (up.scroll) {
				var newTop = getWidth(submenu, 'top') + 2;
				submenu.css('top', newTop);
				down.show();
				if (newTop >= position.start) {
					submenu.css('top', position.start);
					up.hide();
					up.scroll = false;
				}
				else {
					setTimeout(function() { scrollUp(submenu, up, down, position) }, opts.scrollSpeed);
				}
			}
		}

		/*
		 * Function: scrollDown
		 *
		 * Scrolls the supplied menu panel down. This is presumably done in response to a click on the "scroll down" button. This
		 * automatically handles the display of each of the buttons in relation to the current position of the submenu.
		 *
		 * Parameters:
		 * 		submenu -> the submenu that is actually being scrolled.
		 * 		up -> the "scroll up" button element.
		 * 		down -> the "scroll down" button element.
		 * 		position -> an object denoting the starting and ending position for scrolling the submenu. This comes directly from
		 * 				getScrollPosition().
		 */
		function scrollDown(submenu, up, down, position) {
			if (down.scroll) {
				var newTop = getWidth(submenu, 'top') - 2;
				submenu.css('top', newTop);
				up.show();
				if (newTop <= position.end) {
						submenu.css('top', position.end);
					down.hide();
					down.scroll = false;
				}
				else {
					setTimeout(function() { scrollDown(submenu, up, down, position) }, opts.scrollSpeed);
				}
			}
		}

		/*
		 * Function: getScrollPosition
		 *
		 * Returns an object detailing the starting and ending "top" parameters for the given submenu within the supplied pane. Note
		 * that if the submenu is smaller than the scroll pane, 'start' and 'end' will have the same values.
		 *
		 * Parameters:
		 * 		pane -> the scroll pane in which a submenu is being scrolled.
		 * 		submenu -> the submenu whose starting and ending scroll position is being queried.
		 * Returns: Object
		 * 		an object with two members: 'start', which gives the value of the 'top' property of the submenu when it is at its
		 * 		starting scroll position, and 'end', which is the value of the same property when the submenu is scrolled all the
		 * 		way up.
		 */
		function getScrollPosition(pane, submenu) {
			var initialTop = getWidth(submenu, 'top');
			var submenuHeight = submenu.outerHeight(true);
			var paneHeight = pane.height();
			if (submenuHeight <= paneHeight) {
				return { start: initialTop, end: initialTop	};
			}
			return { start: initialTop, end: initialTop - (submenuHeight - paneHeight) };
		}

		/*
		 * Function: setOuterHeight
		 *
		 * Sets the height of a set of elements by taking their borders, paddings, and (possibly) margins into account by
		 * subtracting them from the supplied height. The end result will be an element whose outerHeight() method will return the
		 * supplied height.
		 *
		 * NOTE: Due to the goofy way that IE handles border widths (see the ranting comment in getWidth() below), it is suggested
		 * that you NEVER set a border to 'thin', 'medium', or 'thick'. Those will all be counted as 0 for border-widths by this
		 * function. Use numerical values instead.
		 *
		 * Parameters:
		 * 		elements -> the set of elements to set to the supplied height.
		 * 		height -> the value that the outer height of all of the elements should be set to.
		 * 		margins -> a Boolean indicating whether to include margins in the calculation. If false, only paddings and borders
		 * 				will be taken into account.
		 */
		function setOuterHeight(elements, height, margins) {
			elements.each(function() {
				var element = $(this);
				var outside = 0;
				var props = ['border-top-width', 'border-bottom-width', 'padding-top', 'padding-bottom'];

				if (margins) {
					props.push('margin-top');
					props.push('margin-bottom');
				}

				for (var i in props) {
					outside += getWidth(element, props[i]);
				}
				element.height(height - outside);
			});
		}

		/*
		 * Function: setOuterWidth
		 *
		 * Sets the width of a set of elements by taking their borders, paddings, and (possibly) margins into account by
		 * subtracting them from the supplied width. The end result will be an element whose outerWidth() method will return the
		 * supplied width.
		 *
		 * NOTE: Due to the goofy way that IE handles border widths (see the ranting comment in getWidth() below), it is suggested
		 * that you NEVER set a border to 'thin', 'medium', or 'thick'. Those will all be counted as 0 for border-widths by this
		 * function. Use numerical values instead.
		 *
		 * Parameters:
		 * 		elements -> the set of elements to set to the supplied width.
		 * 		width -> the value that the outer width of all of the elements should be set to.
		 * 		margins -> a Boolean indicating whether to include margins in the calculation. If false, only paddings and borders
		 * 				will be taken into account.
		 */
		function setOuterWidth(elements, width, margins) {
			elements.each(function() {
				var element = $(this);
				var outside = 0;
				var props = ['border-left-width', 'border-right-width', 'padding-left', 'padding-right'];

				if (margins) {
					props.push('margin-left');
					props.push('margin-right');
				}

				for (var i in props) {
					outside += getWidth(element, props[i]);
				}
				element.width(width - outside);
			});
		}

		function setScrollPaneDimensions(panel) {
			var pane = panel.children('.' + opts.scrollPaneClass);
			setOuterHeight(pane,
					panel.height() - panel.children('.' + opts.titleClass + ', .' + opts.titleRootClass).outerHeight(true),
					true);
			setOuterWidth(pane, panel.width(), true);
		}

		/*
		 * Function: removeComments
		 *
		 * Removes all of the comments from the supplied node and all of its children. This is included due to a bug in jQuery
		 * versions 1.2.3 and earlier...in IE, a comment node will be returned from a :first-child selector if it is indeed the
		 * first child (comments are ignored in other browsers). Best way to be sure is to eliminate the comments.
		 *
		 * Parameters:
		 * 		node -> the node to remove comments from.
		 */
		function removeComments(node) {
			var i = 0;
			var children = node.childNodes;
			var x;

			while ((x = children[i++])) {
				switch (x.nodeType) {
					case 1: // Element type, for recursing
						removeComments(x);
						break;
					case 8: // Comment type
						node.removeChild(x);
						i--;
						break;
				}
			}
		}

		/*
		 * Function: replaceClass
		 *
		 * A convenience function that simply removes the supplied old class and adds the supplied new class to a given element.
		 * However, note that no replacement is done if the element does not already have the old class.
		 *
		 * Parameters:
		 *		element -> the element whose class is to be replaced.
		 *		oldClass -> the class being removed from the element.
		 *		newClass -> the class being added to the element.
		 */
		function replaceClass(element, oldClass, newClass) {
			if (element.hasClass(oldClass)) {
				element.removeClass(oldClass);
				element.addClass(newClass);
			}
		}

		/*
		 * Function: getWidth
		 *
		 * Determines the numerical pixel value for the supplied property on a given element. This discards any 'px' suffixes and
		 * returns a number. If the value returned by the browser does not start with a number (like IE returning 'medium'), this
		 * function will return 0. Best to set borders and the like to numerical values rather than the keyword values.
		 *
		 * Parameters:
		 * 		element -> the element whose property's value is being returned.
		 * 		property -> the property whose value is being returned.
		 * Returns: Number
		 * 		the numerical value of the property supplied, stripped of any of its textual component (like 'px').
		 */
		function getWidth(element, property) {
			var value = element.css(property).replace(/\D\-/g, '');

			// This conditional is a hack to account for some truly outstanding IE7 behavior.
			//
			// For any other browser, element.css('border-top-width') (for instance) will return a number.
			// If, for example, the border width is 'medium', FF will return '3px', which gets chopped
			// down to '3' by the above replace. IE returns 'medium'. Worse yet, if no border at all is
			// set, all browsers return '0px'...except IE, which returns 'medium'. Even if you set
			// 'border: none', IE returns...you guessed it...'medium'. Presumably the border-width wasn't
			// set, so it's still the improper non-numeric default value.
			//
			// Then, just for the fun of it, parseInt is supposed to return NaN if it tries to parse a
			// string that isn't a number. In IE, it errors out instead. Nice.
			if (value != NaN && value != '') {
				return parseInt(value, 10);
			}
			return 0;
		}
		
		/**
		 * prepareAutoComplete
		 * scroll with : http://flesler.blogspot.com/2007/10/jqueryscrollto.html
		 */
		function prepareAC(){
			//init
			$('#completion').val(opts.startTypingText);
			
			//gestion de la completion dans le menu
			$('#completion').keyup(function(){
				
				var currText = $(this).val();
				currText = accentsTidy(currText);
				
				var contactSpans = $('span.bdc-dd-text').filter(function(){
					if(accentsTidy(this.innerHTML).substr(0, currText.length) == currText){
						return true;
					}else{
						return false;
					}
				});

				//Scroll
				if(contactSpans.length != 0){ //Check selected result is empty or not
					$('.bdc-dd-scroll-pane').scrollTo(contactSpans.first(),200);	
				}

			});
			
			$('#completion').focus(function(){
				var currText = $(this).val();
				if(currText.length == 0){
					$(this).val(opts.startTypingText);
				}
				else if (currText == opts.startTypingText){
					$(this).val("");
				} 
			});
			
			$('#completion').blur(function(){
				var currText = $(this).val();
				if(currText.length == 0){
					$(this).val(opts.startTypingText);
				}
			});
		}
		
		 		 
		accentsTidy = function(s){
			//var reg = /[èéêë]/g;
			var r=s.toLowerCase();
            r = r.replace(new RegExp("\\s", 'g'),"");
            r = r.replace(new RegExp("[àáâãäå]", 'g'),"a");
            r = r.replace(new RegExp("æ", 'g'),"ae");
            r = r.replace(new RegExp("ç", 'g'),"c");
            r = r.replace(new RegExp("[èéêë]", 'g'),"e");
            r = r.replace(new RegExp("[ìíîï]", 'g'),"i");
            r = r.replace(new RegExp("ñ", 'g'),"n");                            
            r = r.replace(new RegExp("[òóôõö]", 'g'),"o");
            r = r.replace(new RegExp("œ", 'g'),"oe");
            r = r.replace(new RegExp("[ùúûü]", 'g'),"u");
            r = r.replace(new RegExp("[ýÿ]", 'g'),"y");
            r = r.replace(new RegExp("\\W", 'g'),"");
            return r;
		};
		
		
		//S C R I P T   I N I T 
		init();
		return this;
	}

	
	
	
	
	/*
	 * These are the default values, or more appropriately, the "default default" values. If you have mulriple menus in your page
	 * and wish to change the default values for any of them, you can do so like this example:
	 *
	 * $.fn.ddMenu.defaults.duration = 1000
	 *
	 * Any DDMenu created after that point will have a default duration of 1000 instead of 500.
	 */
	$.fn.ddMenu.defaults = {
		backText:'',									// reda : the text to appear right of the sub title: generally : back or préc
		rootTitle: 'Menu', 								// the text to appear as the title of the top-level menu.
		initial: null, 									// the path to the initial menu item.
		separator: '|',									// the separator used in the path of the 'initial' property above.
		scrollSpeed: 10,								// the scrolling speed for the menu (lower is faster)
		duration: 500, 									// the time taken to complete the drill down/up animation.
		inDuration: null,								// the time taken to complete the drill down animation.
		outDuration: null,								// the time taken to complete the drill up animation.
		easing: 'swing', 								// the easing used at the start and/or end of the animation. This default
														// value is available with or without the jQuery Easing plugin, so said
														// plugin isn't necessary. However, many more options are available with it.
		inEasing: null,									// easing specifically for drilldown down.
		outEasing: null,								// easing specifically for drilldown up.
		direction: 'east',								// the direction from and to which a new menu panel slides in and out.
		inDirection: null, 							    // the direction from which a new menu panel should slide in.
		outDirection: null, 							// the direction to which an old menu panel should slide out.

		menuClass: 'bdc-dd-menu', 						// the CSS class for the entire menu.
		menuPanelClass: 'bdc-dd-menu-panel', 			// the CSS class for each individual menu panel.
		scrollPaneClass: 'bdc-dd-scroll-pane',			// the CSS class for the scroll pane. This element appears whether the
														// menu panel is scrollable or not.
		scrollUpClass: 'bdc-dd-scroll-up',				// the CSS class for the div that acts as a "scroll up" button. This element
														// only appears when a scrollable menu panel is not in its highest position.
		scrollUpHoverClass: 'bdc-dd-scroll-up-hover',	// the CSS class for the scroll up button when it's hovered over.
		scrollUpClickClass: 'bdc-dd-scroll-up-click',	// the CSS class for the scroll up button when it's clicked.
		scrollDownClass: 'bdc-dd-scroll-down',			// the CSS class for the div that acts as a "scroll down" button. This
														// element only appears when a scrollable menu panel is not in its lowest
														// position.
		scrollDownHoverClass: 'bdc-dd-scroll-down-hover',	// the CSS class for the scroll down button when it's hovered over.
		scrollDownClickClass: 'bdc-dd-scroll-down-click',	// the CSS class for the scroll down button when it's clicked.
		subMenuClass: 'bdc-dd-sub-menu', 				// the CSS class for each submenu within the whole menu. This class is
														// applied to whatever tag is used for menus.
		titleClass: 'bdc-dd-title',			 			// the CSS class for the title.
		titleRootClass: 'bdc-dd-title-root',			// the CSS class for the title added to the root menu panel.
		titleHoverClass: 'bdc-dd-title-hover',			// the CSS class for the title when it's hovered over.
		titleRootHoverClass: 'bdc-dd-title-root-hover',	// the CSS class for the title added to the root menu panel when it's
														// hovered over.
		titleLabelClass: 'bdc-dd-title-label',			// the CSS class for the label title of each menu panel.
		titleIconClass: 'bdc-dd-title-icon', 			// the CSS class for the icon to appear next to the title label.
		itemClass: 'bdc-dd-item', 						// the CSS class for each menu item. This class is applied to whatever
														// tag is used for menu items.
		labelClass: 'bdc-dd-label',				 		// the CSS class for the element that wraps both label text and icon.
		labelHoverClass: 'bdc-dd-label-hover',			// the CSS class for the label when it's hovered over.
		labelInitialClass: 'bdc-dd-label-initial',		// the CSS class for the label when it is on the initial item.
		labelInitialHoverClass: 'bdc-dd-label-initial-hover',
														// the CSS class for the label when it's the initial item and hovered over.
		textClass: 'bdc-dd-text',						// the CSS class for the label text in each menu item.
		textHoverClass: 'bdc-dd-text-hover',			// the CSS class for the label text when it's hovered over (used ONLY in
														// split branches).
		iconClass: 'bdc-dd-icon', 						// the CSS class for the icon to appear next to the label (if necessary).
		iconHoverClass: 'bdc-dd-icon-hover',			// the CSS class for the icon when it's hovered over (used ONLY in split
														// branches).
			
		startTypingText: 'Start typing...'
	};

})(jQuery);
