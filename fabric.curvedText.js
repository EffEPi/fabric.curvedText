(function(global){

	"use strict";
	
	var fabric = global.fabric || (global.fabric = { }),
		extend = fabric.util.object.extend,
//		clone = fabric.util.object.clone,
//		min = fabric.util.array.min,
//		max = fabric.util.array.max,
//		invoke = fabric.util.array.invoke,
		i=0
		;

	if (fabric.curvedText) {
		fabric.warn('fabric.curvedText is already defined');
		return;
	}
	/**
	 * Group class
	 * @class fabric.curvedText
	 * @extends fabric.Text
	 * @mixes fabric.Collection
	 */
	fabric.curvedText = fabric.util.createClass(fabric.Text, fabric.Collection, /** @lends fabric.curvedText.prototype */ {
		/**
		 * Type of an object
		 * @type String
		 * @default
		 */
		type: 'curvedText',
		/**
		 * The radius of the curved Text
		 * @type Number
		 * @default 50
		 */
		radius: 50,

		/**
		 * Spacing between the letters
		 * @type fabricNumber
		 * @default 20
		 */
		spacing: 15,
        
        letters: null,

		/**
		 * Reversing the radius (position of the original point)
		 * @type Boolead
		 * @default false
		 */
		reverse: false,
        
		delegatedProperties: {
			fill:					true,
			opacity:				true,
			fontFamily:				true,
			fontWeight:				true,
			fontSize:				true,
			fontStyle:				true,
			lineHeight:				true,
			textDecoration:			true,
			textAlign:				true,
			stroke:					true,
			strokeWidth:			true,
			backgroundColor:		true,
			textBackgroundColor:	true
		},
		_dimensionAffectingProps: {
			align:					true, 
			fontSize:				true,
			fontWeight:				true,
			fontFamily:				true,
			textDecoration:			true,
			fontStyle:				true,
			lineHeight:				true,
			stroke:					true,
			strokeWidth:			true,
			text:					true,
            radius:					true,
            spacing:				true,
            reverse:				true
		},
		initialize: function(text, options){
			options || (options = { });
			this.letters = new fabric.Group([], options);
			this.setText(text);
			this.setOptions(options);
			this.__skipDimension = false;
			this._initDimensions();
			this.setCoords();
//			this.callSuper('initialize', options);
		},
		setText: function(text){
			while ( text.length !== 0 && this.letters.size() >= text.length ) {
				this.letters.remove( this.letters.item( this.letters.size()-1 ) );
			}
			for(var i=0; i<text.length; i++){
				//I need to pass the options from the main options
				if ( this.letters.item(i) === undefined ){
					var letter = new fabric.Text(text[i]);
					letter.group = this;
					this.letters.add(letter);
				}
				this.letters.item(i).setText(text[i]);
			}
//            this.text = text;
			this.callSuper('setText', text);
			this.letters.top = this.top;
			this.letters.left = this.left;
		},
		toObject: function(propertiesToInclude) {
			return extend(this.callSuper('toObject', propertiesToInclude), {
				radius: this.radius,
				spacing: this.spacing,
				reverse: this.reverse,
                letters: this.letters
			});
		},
		_render: function(ctx) {
//            this.callSuper('_render', ctx);
			var curAngle=0,
					angleRadians=0,
					align=0;
			// Text align
			if(this.get('align') === 'center') {
				align = ( this.spacing / 2) * ( this.text.length - 1) ;
			}else if(this.get('align') === 'right') {
				align = ( this.spacing ) * ( this.text.length - 1) ;
			}
			for (var i = 0, len = this.text.length; i < len; i++) {
				// Find coords of each letters (radians : angle*(Math.PI / 180)
				var multiplier = this.reverse?1:-1;
				curAngle = (multiplier*-i*parseInt(this.spacing, 10))+(multiplier * align);
				angleRadians = curAngle * (Math.PI / 180);
				this.letters.item(i).set('top',(multiplier*Math.cos(angleRadians)*this.radius));
				this.letters.item(i).set('left',(multiplier*-Math.sin(angleRadians)*this.radius));
				this.letters.item(i).setAngle(curAngle);
			}
			// Update group coords
			this.letters._calcBounds();
			this.letters._updateObjectsCoords();
			this.letters.saveCoords();
//            this.letters.render(ctx);
            this.width = this.letters.width;
            this.height = this.letters.height;
		},
		render: function(ctx, noTransform){
			// do not render if object is not visible
			if (!this.visible) return;

			ctx.save();
			this.transform(ctx);

			var groupScaleFactor = Math.max(this.scaleX, this.scaleY);

			this.clipTo && fabric.util.clipContext(this, ctx);

			//The array is now sorted in order of highest first, so start from end.
			for (var i = 0, len = this.letters.size(); i < len; i++) {

				var object = this.letters.item(i),
					originalScaleFactor = object.borderScaleFactor,
					originalHasRotatingPoint = object.hasRotatingPoint;

				// do not render if object is not visible
				if (!object.visible) continue;

				for(var key in this.delegatedProperties) {
					object.set(key, this.get(key));
				}

				object.borderScaleFactor = groupScaleFactor;
				object.hasRotatingPoint = false;

				object.render(ctx);

				object.borderScaleFactor = originalScaleFactor;
				object.hasRotatingPoint = originalHasRotatingPoint;
			}
			this.clipTo && ctx.restore();

			if (!noTransform && this.active) {
				this.drawBorders(ctx);
				this.drawControls(ctx);
			}
			ctx.restore();
			this.setCoords();
		},
		/**
		* @private
		*/
		_set: function(key, value) {
			this.callSuper('_set',key, value);
			if(key in this.delegatedProperties) {
				var i = this.letters.size();
				while (i--) {
					this.letters.item(i).set(key, value);
				}
			}
			if (key in this._dimensionAffectingProps) {
				this._initDimensions();
				this.setCoords();
			}
		}
});

	/**
	 * Returns {@link fabric.curvedText} instance from an object representation
	 * @static
	 * @memberOf fabric.curvedText
	 * @param {Object} object Object to create a group from
	 * @param {Object} [options] Options object
	 * @return {fabric.curvedText} An instance of fabric.curvedText
	*/
	fabric.curvedText.fromObject = function(object, callback) {
		fabric.util.enlivenObjects(object.objects, function(enlivenedObjects) {
			delete object.objects;
			callback && callback(new fabric.curvedText(enlivenedObjects, object));
		});
	};

	/**
	 * Indicates that instances of this type are async
	 * @static
	 * @memberOf fabric.curvedText
	 * @type Boolean
	 * @default
	*/
	fabric.curvedText.async = true;

})(typeof exports !== 'undefined' ? exports : this);
