/*! imageareaselecttouch - v0.0.0 - 2013-10-25
* https://github.com/gunderson/imageareaselecttouch
* Copyright (c) 2013 Patrick Gunderson; Licensed MIT */
(function ($) {
  // Static method.
  $.imageAreaSelectTouch = function (el, options) {
    var _this = this;

    // Override default options with passed-in options.
    options = $.extend(true, {}, $.imageAreaSelectTouch.options, options);
    this.options = options;
    var $img = $(el);
    var $el, $bg, $selector, imgWidth, imgHeight, imgWidthBase, imgHeightBase, src, aspectRatio;

    this.dx = [0,0];
    this.dy = [0,0];
    this.dDist = 0;

    this.px = [0,0];
    this.py = [0,0];
    this.pdDist = 0;

    this.bgOffsetX = 0;
    this.bgOffsetY = 0;

    this.isDragging = false;
    this.isPinching = false;
    this.activeTouches = 0;

    this.init = function(){
      //get img url, height, width
      src = $img.attr('src');
      var cssSrc = "url(" + src +")";

      //aspectratio < 1 = width < height = portrait
      //aspectratio > 1 = width > height = landscape
      aspectRatio = $img[0].width / $img[0].height;

      if (aspectRatio <= 1){
        //set portrait  image width to stage size and scale height
        imgWidth = imgWidthBase = this.options.dimensions.width;
        imgHeight = imgHeightBase = this.options.dimensions.width / aspectRatio;
      } else {
        //set landscape image height to stage hieght and scale width
        imgWidth = imgWidthBase = this.options.dimensions.height * aspectRatio ;
        imgHeight = imgHeightBase = this.options.dimensions.height;
      }
      //create wrapper
      $el = $('<div class="jq-iast-wrapper">')
        .css($.extend({
          backgroundColor: "#000"
        },this.options.dimensions));

      //create bg element
      $bg = $('<div class="jq-iast-bg">')
        .css($.extend({
          backgroundImage: cssSrc,
          backgroundSize: imgWidth + "px " + imgHeight + "px",
          backgroundPositionX: (this.options.dimensions.width >> 1) - (imgWidth >> 1),
          backgroundPositionY: (this.options.dimensions.height >> 1) - (imgHeight >> 1)
        },this.options.bgDimensions))
        .appendTo($el);

      //create selector element
      var selectorOffsetX = (this.options.dimensions.width >> 1) - (this.options.selectorDimensions.width >> 1),
        selectorOffsetY = (this.options.dimensions.height >> 1) - (this.options.selectorDimensions.height >> 1);

      $selector = $('<div class="jq-iast-selector">')
        .css($.extend({
          backgroundImage: cssSrc,
          backgroundSize: imgWidth + "px " + imgHeight + "px",
          backgroundPositionX: (this.options.dimensions.width >> 1) - (imgWidth >> 1) - selectorOffsetX,
          backgroundPositionY: (this.options.dimensions.height >> 1) - (imgHeight >> 1) - selectorOffsetY
        },this.options.selectorDimensions))
        .appendTo($el);

      //add wrapper to DOM
      $el.insertAfter($img);
      //remove img
      $img.remove();

      //eventListeners
      $el.on('touchstart', $.proxy(_this.onTouchStart, _this));
    };

    this.onTouchStart = function(e){
      var touches = e.originalEvent.touches;

      switch (touches.length){
        case 2:
          this.onPinchStart(e);
          $img.trigger("pinching start");
          // console.log('pinching start');
        case 1:
          //intentional fall through
          if (this.isDragging) break;
        default:
          $el.on('touchend', $.proxy(this.onTouchEnd, this));
          this.onDragStart(touches);
          $img.trigger("dragging start");
          console.log('dragging start', e);
          break;
      }
      $img.trigger("touchStart");
    };

    this.onTouchEnd = function(e){
      var touches = e.originalEvent.touches;
      switch (touches.length){
        case 2:
          $img.trigger("pinching end");
          // console.log('pinching end');
          if (this.isPinching){
            this.onPinchEnd();
          }
          break;
        case 1:
          $img.trigger("dragging end");
          // console.log('dragging end');
          break;
        case 0:
          //intentional fall through
        default:
          this.onDragEnd();
          $img.trigger("touchEnd");
          $el.off('touchend');
          // console.log('touchEnd');
          break;
          break;
      }

    };

    this.onDragStart = function(touches){
      this.isDragging = true;
      this.px[0] = touches[0].pageX;
      this.py[0] = touches[0].pageY;
      $el.on('touchmove', $.proxy(this.onDragMove, this));
    };

    this.onDragEnd = function(startedPinching){
      this.isDragging = false;
      if (!startedPinching) $el.off('touchmove');
    };

    this.onDragMove = function(e){
      if (!this.isPinching) return;
      e.preventDefault();
      var touches = e.originalEvent.touches;
      this.dx[0] = touches[0].pageX - this.px[0];
      this.dy[0] = touches[0].pageY - this.py[0];
      this.px[0] = touches[0].pageX;
      this.py[0] = touches[0].pageY;

      this.bgOffsetX += this.dx[0];
      this.bgOffsetY += this.dy[0];

      var bgOffset = this.boundedOffset(this.bgOffsetX, this.bgOffsetY);
      this.bgOffsetX = bgOffset.x;
      this.bgOffsetY = bgOffset.y;

      $bg.css({
          backgroundPositionX: bgOffset.x + (this.options.dimensions.width >> 1) - (imgWidth >> 1),
          backgroundPositionY: bgOffset.y + (this.options.dimensions.height >> 1) - (imgHeight >> 1)
        });

      var selectorOffsetX = (this.options.dimensions.width >> 1) - (this.options.selectorDimensions.width >> 1),
        selectorOffsetY = (this.options.dimensions.height >> 1) - (this.options.selectorDimensions.height >> 1);

      $selector.css({
          backgroundPositionX: bgOffset.x + (this.options.dimensions.width >> 1) - (imgWidth >> 1) - selectorOffsetX,
          backgroundPositionY: bgOffset.y + (this.options.dimensions.height >> 1) - (imgHeight >> 1) - selectorOffsetY
        });
    };

    this.boundedOffset = function(x,y){
      var minX = -(imgWidth >> 1) + (this.options.selectorDimensions.width >> 1);
      var maxX = (imgWidth >> 1) - (this.options.selectorDimensions.width >> 1);
      var minY = -(imgHeight >> 1) + (this.options.selectorDimensions.height >> 1);
      var maxY = (imgHeight >> 1) - (this.options.selectorDimensions.height >> 1);
      return {
          x: Math.max(minX, Math.min(maxX, x)),
          y: Math.max(minY, Math.min(maxY, y))
        };
    };

    this.onPinchStart = function(e){
      this.isPinching = true;
      var touches = e.originalEvent.touches;
      var dx = touches[1].pageX - touches[0].pageX;
      var dy = touches[1].pageY - touches[0].pageY;
      this.pdDist = Math.sqrt((dx*dx)+(dy+dy));
      $el.on('touchmove', this.onPinchMove);
    };

    this.onPinchEnd = function(e){
      this.isPinching = false;
      this.pdDist = 0;
      this.px[0] = touches[0].pageX;
      this.py[0] = touches[0].pageY;
      $el.off('touchmove', this.onPinchMove);
    };

    this.onPinchMove = function(e){
      e.preventDefault();
      var touches = e.originalEvent.touches;
      var dx = touches[1].pageX - touches[0].pageX;
      var dy = touches[1].pageY - touches[0].pageY;
      var dist = Math.sqrt((dx*dx)+(dy+dy));
      var deltaDist = 3 * (dist - this.pdDist);
      if (!deltaDist) return;
      this.pdDist = dist;
      console.log("onPinchMove", deltaDist);
      if (aspectRatio <= 1){
        //portrait
        imgWidth += deltaDist;
        imgHeight = imgWidth / aspectRatio;
      } else {
        //landscape
        imgHeight += deltaDist;
        imgWidth = imgHeight * aspectRatio;
      }
      var boundSize = this.boundedSize(imgWidth, imgHeight);
      imgWidth = boundSize.width;
      imgHeight = boundSize.height;
      
      $bg.css({
          backgroundSize: imgWidth + "px " + imgHeight + "px"
        });

      $selector.css({
          backgroundSize: imgWidth + "px " + imgHeight + "px"
        });

    };
    this.onPinchMove = $.proxy(this.onPinchMove, this)

    this.boundedSize = function(width, height){
      var minWidth,minHeight;

      if (aspectRatio <= 1){
        //portrait
        minWidth = this.options.selectorDimensions.width;
        minHeight = minWidth / aspectRatio;
      } else {
        //landscape
        minHeight = this.options.selectorDimensions.height;
        minWidth = minHeight * aspectRatio;

      }
      return {
        width: Math.max(minWidth, width),
        height: Math.max(minHeight, height)
      };
    };

    this.init();

    return this;
  };

  // Static method default options.
  $.imageAreaSelectTouch.options = {
    dimensions: {
      width: 300,
      height: 380,
      position: "relative"
    },
    bgDimensions: {
      width: "100%",
      height: "100%",
      position: "absolute",
      opacity: 0.5,
      backgroundRepeat: "no-repeat"
    },
    selectorDimensions: {
      width: 240,
      height: 240,
      position: "absolute",
      margin: "auto",
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      border: "1px dashed white",
      backgroundRepeat: "no-repeat"
    },
    imgDimensions: {
      width: 200,
      height: 200,
      scale: 1
    }
  };

  // Collection method.
  $.fn.imageAreaSelectTouch = function (settings) {
    return this.each(function (i) {
      var $this = $(this);
      var options, 
        iast;
        settings = settings || {};
      if(!(iast = this.imageAreaSelectTouch)) {
        this.imageAreaSelectTouch = iast = new $.imageAreaSelectTouch(this, options);
      }
      return iast;
    });
  };


  // Custom selector.
  $.expr[':'].imageAreaSelectTouch = function (elem) {
    // Is this element a iast instance?
    return $(elem).hasClass('jq-iast-wrapper');
  };

}(jQuery));
