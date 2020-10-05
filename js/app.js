/* eslint-disable */
var customSearch;

// 函数防抖 (只执行最后一次点击) 
var Debounce = (fn, t) => {
	let delay = t || 200;
	let timer;
	return function () {
		let args = arguments;
		if(timer){
			clearTimeout(timer);
		}
		timer = setTimeout(() => {
			timer = null;
			fn.apply(this, args);
		}, delay);
	}	
};

(function ($) {

	"use strict";
	const isMobile = /mobile/i.test(window.navigator.userAgent);

	// 校正页面定位（被导航栏挡住的区域）
	var scrollCorrection = 80; // (header height = 64px) + (gap = 16px)
	var $headerAnchor = $('.l_header');
	if ($headerAnchor[0]) {
		scrollCorrection = $headerAnchor[0].clientHeight + 16;
	}

	// 尝试： 重设数据值
	function restData() {
		scrollCorrection = 80;
		$headerAnchor = $('.l_header');
		if ($headerAnchor[0]) {
			scrollCorrection = $headerAnchor[0].clientHeight + 16;
		}
	}

	// 校正页面定位（被导航栏挡住的区域）
	function scrolltoElement(elem, correction = scrollCorrection) {
		const $elem = elem.href ? $(decodeURI(elem.getAttribute('href'))) : $(elem);
		$('html, body').animate({
			'scrollTop': $elem.offset().top - correction
		}, 500);
	}

	// 设置滚动锚点
	function setScrollAnchor() {
		const $postsBtn = $('.menu .active');            // 一级导航上的当前激活的按钮
		const $topBtn = $('.s-top');                     // 向上
		const $titleBtn = $('h1.title', '#header-meta'); // 文章内标题
		const $bodyAnchor = $('.safearea');                // 页面主体

		if ($postsBtn.length && $bodyAnchor) {
			$postsBtn.click(e => {
				e.preventDefault();
				e.stopPropagation();
				if($postsBtn.attr("href") != "/")       // TODO: fix it
					scrolltoElement($bodyAnchor);
				e.stopImmediatePropagation();
				$postsBtn.unbind('click');
			});
		}
		if ($titleBtn.length && $bodyAnchor) {
			$titleBtn.click(e => {
				e.preventDefault();
				e.stopPropagation();
				scrolltoElement($bodyAnchor);
				e.stopImmediatePropagation();
				$titleBtn.unbind('click');
			});
		}
		if ($topBtn.length && $bodyAnchor) {
			$topBtn.click(e => {
				e.preventDefault();
				e.stopPropagation();
				scrolltoElement($bodyAnchor);
				e.stopImmediatePropagation();
			});
		}

		//==========================================

		var enableCover = $('#pjax-enable-cover').text(); // Pjax 处理

		var showHeaderPoint = 0;
		var $coverHeight = 0;

		if (enableCover) {
			const $coverAnchor = $('.cover-wrapper');

			if ($coverAnchor[0]) {
				if($('.cover-wrapper#half').css('display') !== 'none') // Pjax 处理
					$coverHeight = 240;
				showHeaderPoint = $coverAnchor[0].clientHeight - $coverHeight;
			}
		}

		var pos = document.body.scrollTop + $coverHeight; 	// Pjax 处理

		$(document, window).scroll(Debounce( () => {
			let scrollTop = $(window).scrollTop();  // 滚动条距离顶部的距离

			scrollTop += $coverHeight; // Pjax 处理

			const del = scrollTop - pos;
			pos = scrollTop;
			if (scrollTop > 240) {
				$topBtn.addClass('show');
				if (del > 0) {
					$topBtn.removeClass('hl');
				} else {
					$topBtn.addClass('hl');
				}
			} else {
				$topBtn.removeClass('show').removeClass('hl');
			}
			if (scrollTop - showHeaderPoint > -1) {
				$headerAnchor.addClass('show');
			} else {
				$headerAnchor.removeClass('show');
			}
		}));
		//==========================================
	}

	// 设置导航栏
	function setHeader() {
		var HEXO_ISPAGE = $.trim($('#pjax-ispage').text());
		if(HEXO_ISPAGE == 'true')
		  window.subData = {
			title: $.trim($('#pjax-pageTitle').text()),
			tools: true
		  }

		if (!window.subData) return;
		const $wrapper = $('header .wrapper');        // 整个导航栏
		const $comment = $('.s-comment', $wrapper);   // 评论按钮  桌面端 移动端
		const $toc = $('.s-toc', $wrapper);           // 目录按钮  仅移动端

		$wrapper.find('.nav-sub .title').text(window.subData.title);   // 二级导航文章标题

		// 决定一二级导航栏的切换
		let pos = document.body.scrollTop;
		$(document, window).scroll(Debounce( () => {
			const scrollTop = $(window).scrollTop();
			const del = scrollTop - pos;
			if (del >= 50 && scrollTop > 100) {
				pos = scrollTop;
				$wrapper.addClass('sub');
			} else if (del <= -50) {
				pos = scrollTop;
				$wrapper.removeClass('sub');  // <---- 取消二级导航显示
			}
		}));

		// bind events to every btn
		let $commentTarget = $('.l_body article#comments');  // 评论区域
		if ($commentTarget.length) {
			$comment.click(e => {                     // 评论按钮点击后 跳转到评论区域
				e.preventDefault();
				e.stopPropagation();
				scrolltoElement($('.l_body article#comments'));
				e.stopImmediatePropagation();
			});
		} else $comment.remove(); // 关闭了评论，则隐藏

		const $tocTarget = $('.l_body .toc-wrapper');     // 侧边栏的目录列表  PC
		if ($tocTarget.length && $tocTarget.children().length) {
			$toc.click((e) => {
				e.stopPropagation();
				$tocTarget.toggleClass('active');
				$toc.toggleClass('active');
			});
			$(document).click(function (e) {
				e.stopPropagation();
				$tocTarget.removeClass('active');
				$toc.removeClass('active');
			});
			$(document, window).scroll(Debounce(() => {
				$tocTarget.removeClass('active');
				$toc.removeClass('active');
			}, 100));
		} else $toc.remove();
	}

	// 设置导航栏菜单选中状态
	function setHeaderMenuSelection() {
		var $headerMenu = $('body .navigation');
		// 先把已经激活的取消激活
		$headerMenu.find('li a.active').removeClass('active');
		$headerMenu.find('div a.active').removeClass('active');
		// var $underline = $headerMenu.find('.underline');
		function setUnderline($item) {
			// if (!transition) $underline.addClass('disable-trans');
			if ($item && $item.length) {
				$item.addClass('active').siblings().removeClass('active');
			}
		}
		//set current active nav
		var $active_link = null;
		// replace '%' '/' '.'
		var idname = location.pathname.replace(/\/|%|\./g, "");
		if (idname.length == 0) {
			idname = "home";
		}
		var page = idname.match(/page\d{0,}$/g);
		if (page) {
			page = page[0];
			idname = idname.split(page)[0];
		}
		var index = idname.match(/index.html/);
		if (index) {
			index = index[0];
			idname = idname.split(index)[0];
    }
    // 转义字符如 [, ], ~, #, @
    idname = idname.replace(/(\[|\]|~|#|@)/g, "\\$1");    
		if (idname && $headerMenu) {
			$active_link = $('#' + idname, $headerMenu);
			setUnderline($active_link);
		}
	}

	// 设置全局事件
	function setGlobalHeaderMenuEvent() {
		if (isMobile) {
			// 手机端 点击展开子菜单
			$('.m-phone li').click(function (e) {
				e.stopPropagation();
				$($(e.currentTarget).children('ul')).show();
			});
		} else {
			// PC端 hover时展开子菜单，点击时隐藏子菜单
			$('.m-pc li > a[href]').parent().click(function (e) {
				e.stopPropagation();
				if (e.target.origin == e.target.baseURI) {
					$('.m-pc .list-v').hide();
				}
			});
		}
		setPageHeaderMenuEvent();
	}

	function setPageHeaderMenuEvent() {
		if (!isMobile) return;
		// 手机端 点击空白处隐藏子菜单
		$(document).click(function (e) {
			$('.m-phone .list-v').hide();
		});
		// 手机端 滚动时隐藏子菜单
		$(window).scroll(Debounce(() => {
			$('.m-phone .list-v').hide();
		}));
	}
	// 设置导航栏搜索框   fix √
	function setHeaderSearch() {
		var $switcher = $('.l_header .switcher .s-search');   // 搜索按钮   移动端
		var $header = $('.l_header');                         // 移动端导航栏
		var $search = $('.l_header .m_search');               // 搜索框 桌面端
		if ($switcher.length === 0) return;
		$switcher.click(function (e) {
			e.stopPropagation();
			$header.toggleClass('z_search-open');   // 激活移动端搜索框
			$switcher.toggleClass('active');        // 搜索按钮
			$search.find('input').focus();
		});
		$(document).click(function (e) {
			$header.removeClass('z_search-open');
			$switcher.removeClass('active');
		});

		$search.click(function (e) {
			e.stopPropagation();
		});
		$header.ready(function () {
			$header.bind('keydown', function (event) {
				if (event.keyCode == 9) {
					return false;
				} else {
					var isie = (document.all) ? true : false;
					var key;
					var ev;
					if (isie) { //IE浏览器
						key = window.event.keyCode;
						ev = window.event;
					} else { //火狐浏览器
						key = event.which;
						ev = event;
					}
					if (key == 9) { //IE浏览器
						if (isie) {
							ev.keyCode = 0;
							ev.returnValue = false;
						} else { //火狐浏览器
							ev.which = 0;
							ev.preventDefault();
						}
					}
				}
			});
		});
	}

	// 设置导航栏搜索框
	function setTocToggle() {
		const $toc = $('.toc-wrapper');   // 侧边栏 TOC 移动端
		if ($toc.length === 0) return;
		$toc.click((e) => {
			e.stopPropagation();
			$toc.addClass('active');
		});
		$(document).click(() => $toc.removeClass('active'));

		$toc.on('click', 'a', (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (e.target.tagName === 'A') {
				scrolltoElement(e.target, 0);
			} else if (e.target.tagName === 'SPAN') {
				scrolltoElement(e.target.parentElement, 0);
			}
			$toc.removeClass('active');
			const $tocBtn = $('.s-toc');
			if ($tocBtn.length > 0) {
				$tocBtn.removeClass('active');
			}
		});

		let liElements = Array.from($toc.find('li a'));
		//function animate above will convert float to int.
		let getAnchor = () => liElements.map(elem => Math.floor($(decodeURI(elem.getAttribute('href'))).offset().top - scrollCorrection));

		let anchor = getAnchor();
		let domHeigth = $(document).height();
		let scrollListener = () => {
			let scrollTop = $('html').scrollTop() || $('body').scrollTop();
			if ($(document).height() != domHeigth) { // dom 高度发生变化： 普遍来说，是图片懒加载造成的
				scrollTop = $('html').scrollTop() || $('body').scrollTop();
				domHeigth = $(document).height();
				anchor = getAnchor();
			}
			if (!anchor) return;
			//binary search.
			let l = 0,
				r = anchor.length - 1,
				mid;
			while (l < r) {
				mid = (l + r + 1) >> 1;
				if (anchor[mid] === scrollTop) l = r = mid;
				else if (anchor[mid] < scrollTop) l = mid;
				else r = mid - 1;
			}
			$(liElements).removeClass('active').eq(l).addClass('active');
		};

		$(window).scroll(Debounce(() => {
			scrollListener();
		}));

		// 监听窗口改变事件
		let resizeTimer = null;
		$(window).bind('resize', function (){
			if (resizeTimer) clearTimeout(resizeTimer);
			resizeTimer = setTimeout(function(){
				anchor = getAnchor();
				scrollListener();
			} , 100);
		});

		scrollListener();
	}

	// 设置 tabs 标签
	function setTabs() {
		const $tabs = $('.tabs');
		if ($tabs.length === 0) return;
		let $navs = $tabs.find('.nav-tabs .tab');
		for (var i = 0; i < $navs.length; i++) {
			let $a = $tabs.find($navs[i].children[0]);
			$a.addClass($a.attr("href"));
			$a.removeAttr('href');
		}
		$('.tabs .nav-tabs').on('click', 'a', (e) => {
			e.preventDefault();
			e.stopPropagation();
			let $tab = $(e.target.parentElement.parentElement.parentElement);
			$tab.find('.nav-tabs .active').removeClass('active');
			$tab.find(e.target.parentElement).addClass('active');
			$tab.find('.tab-content .active').removeClass('active');
			$tab.find($(e.target).attr("class")).addClass('active');
			return false;
		});
	}

	$(function () {
		setHeader();
		setHeaderMenuSelection();
		setGlobalHeaderMenuEvent();
		setHeaderSearch();
		setTocToggle();
		setScrollAnchor();
		setTabs();

		// 全屏封面底部箭头
		$('.scroll-down').on('click', function () {
			scrolltoElement('.safearea');
		});


		try {
			// addEventListener是先绑定先执行，此处的绑定后执行
			document.addEventListener('pjax:complete', function () {
				$(function () {
					restData();
					setHeader();
					setHeaderMenuSelection();
					setPageHeaderMenuEvent();
					setTocToggle();
					setScrollAnchor();
					setTabs();

					// 处理点击事件 setHeaderSearch 没有重载，需要重新绑定单个事件
					var $switcher = $('.l_header .switcher .s-search'); // 搜索按钮   移动端
					var $header = $('.l_header'); // 移动端导航栏
					if ($switcher.length !== 0) {
						$(document).click(function (e) {
							$header.removeClass('z_search-open');
							$switcher.removeClass('active');
						});
					}
				});

			});
		} catch (error) {
			// console.log(error);
		}
	});


})(jQuery);

/*锚点定位*/
if(window.location.hash){
	var checkExist = setInterval(function() {
	   if (typeof jQuery == 'undefined'){return;}
	   if ($("#"+decodeURI(window.location.hash.split("#")[1]).replace(/\ /g,"-")).length) {
		  $('html, body').animate({scrollTop: $("#"+decodeURI(window.location.hash.split("#")[1]).replace(/\ /g,"-")).offset().top-40}, 500);
		  clearInterval(checkExist);
	   }
	}, 100);
}

// Message.js
$.extend({message:function(e){var n={title:"",message:" 操作成功",time:"3000",type:"success",showClose:!0,autoClose:!0,onClose:function(){}};"string"==typeof e&&(n.message=e),"object"==typeof e&&(n=$.extend({},n,e));var i,o,s,t=n.showClose?'<div class="c-message--close">×</div>':"",a=""!==n.title?'<h2 class="c-message__title">'+n.title+"</h2>":"",c='<div class="c-message animated animated-lento slideInRight"><i class=" c-message--icon c-message--'+n.type+'"></i><div class="el-notification__group">'+a+'<div class="el-notification__content">'+n.message+"</div>"+t+"</div></div>",m=$("body"),d=$(c);o=function(){d.addClass("slideOutRight"),d.one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",function(){s()})},s=function(){d.remove(),n.onClose(n),clearTimeout(i)},$(".c-message").remove(),m.append(d),d.one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",function(){d.removeClass("messageFadeInDown")}),m.one("click",".c-message--close",function(e){o()}),n.autoClose&&(i=setTimeout(function(){o()},n.time))}});

/*泡泡*/
(function() {
	var canvas, ctx, width, height, bubbles, animateHeader = true;
	initHeader();
	function initHeader() {
		canvas = document.getElementById('header_canvas');
		window_resize();
		ctx = canvas.getContext('2d');
		//建立泡泡
		bubbles = [];
		var num = width * 0.04;//气泡数量
		for (var i = 0; i < num; i++) {
			var c = new Bubble();
			bubbles.push(c);
		}
		animate();
	}
	function animate() {
		if (animateHeader) {
			ctx.clearRect(0, 0, width, height);
			for (var i in bubbles) {
				bubbles[i].draw();
			}
		}
		requestAnimationFrame(animate);
	}
	function window_resize() {
		//canvas铺满窗口
		width = window.innerWidth;
		height = window.innerHeight;

        //如果需要铺满内容可以换下面这个
        //var panel = document.getElementById('thumbnail_canvas');
		//width=panel.offsetWidth;
		//height=panel.offsetHeight;

		canvas.width = width;
		canvas.height = height;
	}
    window.onresize = function(){
        window_resize();
    }
	function Bubble() {
		var _this = this;
		(function() {
			_this.pos = {};
			init();
		})();
		function init() {
			_this.pos.x = Math.random() * width;
			_this.pos.y = height + Math.random() * 100;
			_this.alpha = 0.1 + Math.random() * 0.3;//气泡透明度
			_this.alpha_change = 0.0002 + Math.random() * 0.0005;//气泡透明度变化速度
			_this.scale = 0.2 + Math.random() * 0.5;//气泡大小
			_this.scale_change = Math.random() * 0.002;//气泡大小变化速度
			_this.speed = 0.2 + Math.random() * 0.4;//气泡上升速度
		}
		//气泡
		this.draw = function() {
			if (_this.alpha <= 0) {
				init();
			}
			_this.pos.y -= _this.speed;
			_this.alpha -= _this.alpha_change;
			_this.scale += _this.scale_change;
			ctx.beginPath();
			ctx.arc(_this.pos.x, _this.pos.y, _this.scale * 10, 0, 2 * Math.PI, false);
			ctx.fillStyle = 'rgba(255,255,255,' + _this.alpha + ')';
			ctx.fill();
		}; 
	}
})();