/*---------------------------------------------------------------------------------------------

@author       Constantin Saguin - @brutaldesign
@link            http://csag.co
@github        http://github.com/brutaldesign/swipebox
@version     1.2.1
@license      MIT License

----------------------------------------------------------------------------------------------*/

;(function (window, document, $, undefined) {
	
	$.swipebox = function(elem, options) {

		var defaults = {
			useCSS : true,
			initialIndexOnArray : 0,
			hideBarsDelay : 3000,
			videoMaxWidth : 1140,
			beforeOpen: null,
		      	afterClose: null
		},
		
		plugin = this,
		elements = [], // slides array [{href:'...', title:'...'}, ...],
		elem = elem,
		selector = elem.selector,
		$selector = $(selector),
		isTouch = document.createTouch !== undefined || ('ontouchstart' in window) || ('onmsgesturechange' in window) || navigator.msMaxTouchPoints,
		supportSVG = !!(window.SVGSVGElement),
		winWidth = window.innerWidth ? window.innerWidth : $(window).width(),
		winHeight = window.innerHeight ? window.innerHeight : $(window).height(),
		html = '<div id="swipebox-overlay">\
				<div id="swipebox-slider"></div>\
				<div id="swipebox-caption"></div>\
				<div id="swipebox-action">\
					<a id="swipebox-close"></a>\
					<a id="swipebox-prev"></a>\
					<a id="swipebox-next"></a>\
				</div>\
		</div>';

		plugin.settings = {}

		plugin.init = function(){

			plugin.settings = $.extend({}, defaults, options);

			if ($.isArray(elem)) {

				elements = elem;
				ui.target = $(window);
				ui.init(plugin.settings.initialIndexOnArray);

			}else{

				$selector.click(function(e){
					elements = [];
					var index , relType, relVal;

					if (!relVal) {
						relType = 'rel';
						relVal  = $(this).attr(relType);
					}

					if (relVal && relVal !== '' && relVal !== 'nofollow') {
						$elem = $selector.filter('[' + relType + '="' + relVal + '"]');
					}else{
						$elem = $(selector);
					}

					$elem.each(function(){

						var title = null, href = null;
						
						if( $(this).attr('title') )
							title = $(this).attr('title');

						if( $(this).attr('href') )
							href = $(this).attr('href');

						elements.push({
							href: href,
							title: title
						});
					});
					
					index = $elem.index($(this));
					e.preventDefault();
					e.stopPropagation();
					ui.target = $(e.target);
					ui.init(index);
				});
			}
		}

		plugin.refresh = function() {
			if (!$.isArray(elem)) {
				ui.destroy();
				$elem = $(selector);
				ui.actions();
			}
		}

		var ui = {

			init : function(index){
				if (plugin.settings.beforeOpen) 
					plugin.settings.beforeOpen();
				this.target.trigger('swipebox-start');
				$.swipebox.isOpen = true;
				this.build();
				this.openSlide(index);
				this.openMedia(index);
				this.preloadMedia(index+1);
				this.preloadMedia(index-1);
			},

			build : function(){
				var $this = this;

				$('body').append(html);

				/*
				if($this.doCssTrans()){
					
					$('#swipebox-slider').css({
						'-webkit-transition' : 'all 0.4s ease',
						'-moz-transition' : 'all 0.4s ease',
						'-o-transition' : 'all 0.4s ease',
						'-khtml-transition' : 'all 0.4s ease',
						'transition' : 'all 0.4s ease'
					});
					$('#swipebox-overlay').css({
						'-webkit-transition' : 'opacity 1s ease',
						'-moz-transition' : 'opacity 1s ease',
						'-o-transition' : 'opacity 1s ease',
						'-khtml-transition' : 'opacity 1s ease',
						'transition' : 'opacity 1s ease'
					});
					$('#swipebox-action, #swipebox-caption').css({
						'-webkit-transition' : '0.5s',
						'-moz-transition' : '0.5s',
						'-o-transition' : '0.5s',
						'-khtml-transition' : '0.5s',
						'transition' : '0.5s'
					});
				}*/


				if(supportSVG){
					var bg = $('#swipebox-action #swipebox-close').css('background-image');
					bg = bg.replace('png', 'svg');
					$('#swipebox-action #swipebox-prev,#swipebox-action #swipebox-next,#swipebox-action #swipebox-close').css({
						'background-image' : bg
					});
				}
				
				
				$.each( elements,  function(){
					$('#swipebox-slider').append('<div class="slide"></div>');
				});

				$this.setDim();
				$this.actions();
				$this.keyboard();
				$this.gesture();
				$this.animBars();
				$this.resize();
				
			},

			setDim : function(){

				var width, height, sliderCss = {};
				
				if( "onorientationchange" in window ){

					window.addEventListener("orientationchange", function() {
						if( window.orientation == 0 ){
							width = winWidth;
							height = winHeight;
						}else if( window.orientation == 90 || window.orientation == -90 ){
							width = winHeight;
							height = winWidth;
						}
					}, false);
					
				
				}else{

					width = window.innerWidth ? window.innerWidth : $(window).width();
					height = window.innerHeight ? window.innerHeight : $(window).height();
				}

				sliderCss = {
					width : width,
					height : height
				}


				$('#swipebox-overlay').css(sliderCss);

			},

			

			supportTransition : function() {
				var prefixes = 'transition WebkitTransition MozTransition OTransition msTransition KhtmlTransition'.split(' ');
				for(var i = 0; i < prefixes.length; i++) {
					if(document.createElement('div').style[prefixes[i]] !== undefined) {
						return prefixes[i];
					}
				}
				return false;
			},

			doCssTrans : function(){
				if(plugin.settings.useCSS && this.supportTransition() ){
					return true;
				}
			},

			gesture : function(){
				if ( isTouch ){
					var $this = this,
					distance = null,
					swipMinDistance = 10,
					startCoords = {},
					endCoords = {};
					var bars = $('#swipebox-caption, #swipebox-action');

					bars.addClass('visible-bars');
					$this.setTimeout();

					$('body').bind('touchstart', function(e){

						$(this).addClass('touching');

		  				endCoords = e.originalEvent.targetTouches[0];
		    				startCoords.pageX = e.originalEvent.targetTouches[0].pageX;

						$('.touching').bind('touchmove',function(e){
							e.preventDefault();
							e.stopPropagation();
		    					endCoords = e.originalEvent.targetTouches[0];

						});
			           			
			           			return false;

	           			}).bind('touchend',function(e){
	           				e.preventDefault();
					e.stopPropagation();
   				
   					distance = endCoords.pageX - startCoords.pageX;
	       				
	       				if( distance >= swipMinDistance ){
	       					
	       					// swipeLeft
	       					$this.getPrev();
	       				
	       				}else if( distance <= - swipMinDistance ){
	       					
	       					// swipeRight
	       					$this.getNext();
	       				
	       				}else{
	       					// tap
	       					if(!bars.hasClass('visible-bars')){
							$this.showBars();
							$this.setTimeout();
						}else{
							$this.clearTimeout();
							$this.hideBars();
						}

	       				}	

	       				$('.touching').off('touchmove').removeClass('touching');
						
					});

           				}
			},

			setTimeout: function(){
				if(plugin.settings.hideBarsDelay > 0){
					var $this = this;
					$this.clearTimeout();
					$this.timeout = window.setTimeout( function(){
						$this.hideBars() },
						plugin.settings.hideBarsDelay
					);
				}
			},
			
			clearTimeout: function(){	
				window.clearTimeout(this.timeout);
				this.timeout = null;
			},

			showBars : function(){
				var bars = $('#swipebox-caption, #swipebox-action');
				if(this.doCssTrans()){
					bars.addClass('visible-bars');
				}else{
					$('#swipebox-caption').animate({ bottom : -50 }, 500);
					$('#swipebox-action').animate({ opacity : 0 }, 500);
					setTimeout(function(){
						bars.addClass('visible-bars');
					}, 1000);
				}
			},

			hideBars : function(){
				var bars = $('#swipebox-caption, #swipebox-action');
				if(this.doCssTrans()){
					bars.removeClass('visible-bars');
				}else{
					$('#swipebox-caption').animate({ bottom : '-50px' }, 500);
					$('#swipebox-action').animate({ opacity : '1' }, 500);
					setTimeout(function(){
						bars.removeClass('visible-bars');
					}, 1000);
				}
			},

			animBars : function(){
				var $this = this;
				var bars = $('#swipebox-caption, #swipebox-action');
					
				bars.addClass('visible-bars');
				$this.setTimeout();
				
				$('#swipebox-slider').click(function(e){
					if(!bars.hasClass('visible-bars')){
						$this.showBars();
						$this.setTimeout();
					}
				});

				$('#swipebox-action').hover(function() {
				  		$this.showBars();
						bars.addClass('force-visible-bars');
						$this.clearTimeout();
					
					},function() { 
						bars.removeClass('force-visible-bars');
						$this.setTimeout();

				});
			},

			keyboard : function(){
				var $this = this;
				$(window).bind('keyup', function(e){
					e.preventDefault();
					e.stopPropagation();
					if (e.keyCode == 37){
						$this.getPrev();
					}
					else if (e.keyCode==39){
						$this.getNext();
					}
					else if (e.keyCode == 27) {
						$this.closeSlide();
					}
				});
			},

			actions : function(){
				var $this = this;
				
				if( elements.length < 2 ){
					$('#swipebox-prev, #swipebox-next').hide();
				}else{
					$('#swipebox-prev').bind('click touchend', function(e){
						e.preventDefault();
						e.stopPropagation();
						$this.getPrev();
						$this.setTimeout();
					});
					
					$('#swipebox-next').bind('click touchend', function(e){
						e.preventDefault();
						e.stopPropagation();
						$this.getNext();
						$this.setTimeout();
					});
				}

				$('#swipebox-close').bind('click touchend', function(e){
					$this.closeSlide();
				});
			},
			
			setSlide : function (index, isFirst){
				isFirst = isFirst || false;
				
				var slider = $('#swipebox-slider');
				
				if(this.doCssTrans()){
					
					width = window.innerWidth ? window.innerWidth : $(window).width();
					off = "translate3d(-"+(index*width)+"px, 0, 0)";
					slider.css({ "-webkit-transform": off,"-moz-transform": off,"-ms-transform": off,"-o-transform": off,"transform": off});
					
				}else{
					slider.animate({ left : (-index*100)+'%' });
				}
				
				$('#swipebox-slider .slide').removeClass('current');
				$('#swipebox-slider .slide').eq(index).addClass('current');
				this.setTitle(index);

				if( isFirst ){
					slider.fadeIn();
				}

				$('#swipebox-prev, #swipebox-next').removeClass('disabled');
				if(index == 0){
					$('#swipebox-prev').addClass('disabled');
				}else if( index == elements.length - 1 ){
					$('#swipebox-next').addClass('disabled');
				}
			},
		
			openSlide : function (index){
				$('html').addClass('swipebox');
				$(window).trigger('resize'); // fix scroll bar visibility on desktop
				this.setSlide(index, true);
			},
		
			preloadMedia : function (index){
				var $this = this, src = null;

				if( elements[index] !== undefined )
					src = elements[index].href;

				if( !$this.isVideo(src) ){
					setTimeout(function(){
						$this.openMedia(index);
					}, 1000);
				}else{
					$this.openMedia(index);
				}
			},
			
			openMedia : function (index){
				var $this = this, src = null;

				if( elements[index] !== undefined )
					src = elements[index].href;

				if(index < 0 || index >= elements.length){
					return false;
				}

				if( !$this.isVideo(src) ){
					$this.loadMedia(src, function(){
						$('#swipebox-slider .slide').eq(index).html(this);
					});
				}else{
					$('#swipebox-slider .slide').eq(index).html($this.getVideo(src));
				}
				
			},

			setTitle : function (index, isFirst){
				var title = null;

				$('#swipebox-caption').empty();

				if( elements[index] !== undefined )
					title = elements[index].title;
				
				/*if(title){
					$('#swipebox-caption').append(title);
				}*/
				if(title){
					cleantitle=' <span class="title">'+title+'</span> ';
				}else{ cleantitle=' ';}
				
				tot = $('#swipebox-slider .slide').length;
				
				if(tot>1){
					counter=' <span class="counter">'+(index+1)+'/'+tot+'</span> ';
				}else{ counter=' '; }
				
				$('#swipebox-caption').append(counter+cleantitle);
				
			},

			isVideo : function (src){

				if( src ){
					if( 
						src.match(/youtube\.com\/watch\?v=([a-zA-Z0-9\-_]+)/) 
						|| src.match(/vimeo\.com\/([0-9]*)/) 
						|| src.match('://(www.)?dailymotion\.com')
					){
						return true;
					}
				}
					
			},

			/*getVideo : function(url){
				var iframe = '';
				var output = '';
				var youtubeUrl = url.match(/watch\?v=([a-zA-Z0-9\-_]+)/);
				var vimeoUrl = url.match(/vimeo\.com\/([0-9]*)/);
				if( youtubeUrl ){

					iframe = '<iframe width="560" height="315" src="//www.youtube.com/embed/'+youtubeUrl[1]+'?controls=1&color=white&showinfo=0&autoplay=1&hd=1&fs=1&rel=0" frameborder="0" allowfullscreen></iframe>';
				
				}else if(vimeoUrl){

					iframe = '<iframe width="560" height="315"  src="http://player.vimeo.com/video/'+vimeoUrl[1]+'?byline=0&amp;title=0&byline=0&portrait=0&color=ffffff&autoplay=1" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
				
				}

				return '<div class="swipebox-video-container" style="max-width:'+plugin.settings.videomaxWidth+'px"><div class="swipebox-video">'+iframe+'</div></div>';
			}*/
			getVideo : function(url){
                var success = false;
                if (url.match('://(www.)?youtube|youtu\.be')) {
                    if (url.match('embed')) { youtube_id = url.split(/embed\//)[1].split('"')[0]; }
                    else { youtube_id = url.split(/v\/|v=|youtu\.be\//)[1].split(/[?&]/)[0]; }
                    v_id    = youtube_id;
                    i_src = "http://www.youtube.com/embed/"+v_id+"?controls=1&color=white&showinfo=0&autoplay=1&hd=1&fs=1&rel=0";
                    success = true;
                }
                else if (url.match('://(player.)?vimeo\.com')) {
                    vimeo_Reg = /https?:\/\/(?:www\.)?vimeo.com\/(?:channels\/|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
                    match = url.match(vimeo_Reg);
                    v_id = match[3];            
                    i_src = "http://player.vimeo.com/video/"+v_id+"?title=0&byline=0&portrait=0&color=ffffff&autoplay=1"; 
                    success = true;
                }
                else if (url.match('://(www.)?dailymotion\.com')) {
                    m = url.match(/^.+dailymotion.com\/((video|hub)\/([^_]+))?[^#]*(#video=([^_&]+))?/);
                    v_id = m ? m[5] || m[3] : null;
                    i_src = "http://www.dailymotion.com/embed/video/"+v_id+"?autoplay=true&background=000000&foreground=ffffff&highlight=ffffff";
                    success = true;
                }
                if (success) { 
                    iframe = '<iframe width="560" height="315"  src="'+i_src+'" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
                    return '<div class="swipebox-video-container" style="max-width:'+plugin.settings.videomaxWidth+'px"><div class="swipebox-video">'+iframe+'</div></div>';}
                },
			
			loadMedia : function (src, callback){
				if( !this.isVideo(src) ){
					var img = $('<img>').on('load', function(){
						callback.call(img);
					});
					
					img.attr('src',src);
				}	
			},
			
			getNext : function (){
				var $this = this;
				index = $('#swipebox-slider .slide').index($('#swipebox-slider .slide.current'));
				if(index+1 < elements.length){
					index++;
					$this.setSlide(index);
					$this.preloadMedia(index+1);
				}
				else{
					
					$('#swipebox-slider').addClass('rightSpring');
					setTimeout(function(){
						$('#swipebox-slider').removeClass('rightSpring');
					},500);
				}
			},
			
			getPrev : function (){
				index = $('#swipebox-slider .slide').index($('#swipebox-slider .slide.current'));
				if(index > 0){
					index--;
					this.setSlide(index);
					this.preloadMedia(index-1);
				}
				else{
					
					$('#swipebox-slider').addClass('leftSpring');
					setTimeout(function(){
						$('#swipebox-slider').removeClass('leftSpring');
					},500);
				}
			},
			resize : function (){
				var $this = this;
				
				$(window).resize(function() {
					curr = $('#swipebox-slider .slide').index($('#swipebox-slider .slide.current'));
					$this.setDim();
                    $this.setSlide(curr);
				}).resize();
			},


			closeSlide : function (){
				$('html').removeClass('swipebox');
				$(window).trigger('resize');
				this.destroy();
			},

			destroy : function(){
				$(window).unbind('keyup');
				$('body').unbind('touchstart');
				$('body').unbind('touchmove');
				$('body').unbind('touchend');
				$('#swipebox-slider').unbind();
				$('#swipebox-overlay').remove();
				if (!$.isArray(elem))
					elem.removeData('_swipebox');
				if ( this.target )
					this.target.trigger('swipebox-destroy');
				$.swipebox.isOpen = false;
				if (plugin.settings.afterClose) 
					plugin.settings.afterClose();
 			}

		};

		plugin.init();
		
	};

	$.fn.swipebox = function(options){
		if (!$.data(this, "_swipebox")) {
			var swipebox = new $.swipebox(this, options);
			this.data('_swipebox', swipebox);
		}
		return this.data('_swipebox');
	}

}(window, document, jQuery));
