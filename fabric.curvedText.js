(function(global){

	"use strict";
	
	var fabric = global.fabric || (global.fabric = { }),
		extend = fabric.util.object.extend,
		clone = fabric.util.object.clone
		;

	if (fabric.CurvedText) {
		fabric.warn('fabric.CurvedText is already defined');
		return;
	}
	/**
	 * Group class
	 * @class fabric.CurvedText
	 * @extends fabric.Text
	 * @mixes fabric.Collection
	 */
	fabric.CurvedText = fabric.util.createClass(fabric.Text, fabric.Collection, /** @lends fabric.CurvedText.prototype */ {
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
		
        letters: new fabric.Group([], {}),

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
			this.__skipDimension = true;
			this.setOptions(options);
			this.__skipDimension = false;
			this.callSuper('initialize', options);
//			this.letters = new fabric.Group([], options);
//			this._initDimensions();
//			this.setCoords();
			this.setText(text);
		},
		setText: function(text){
			while ( text.length !== 0 && this.letters.size() >= text.length ) {
				this.letters.remove( this.letters.item( this.letters.size()-1 ) );
			}
			for(var i=0; i<text.length; i++){
				//I need to pass the options from the main options
				if(this.letters.item(i) === undefined){
					this.letters.add(new fabric.Text(text[i]));
				}else{
					this.letters.item(i).setText(text[i]);
				}
			}
			this.callSuper('setText', text);
//			this.letters.top = this.top;
//			this.letters.left = this.left;
		},
		_render: function(ctx) {
			var curAngle=0,
					angleRadians=0,
					align=0;
			// Text align
			if(this.get('textAlign') === 'center') {
				align = ( this.spacing / 2) * ( this.text.length - 1) ;
			}else if(this.get('textAlign') === 'right') {
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
		},
		toObject: function(propertiesToInclude) {
			return extend(this.callSuper('toObject', propertiesToInclude), {
				radius: this.radius,
				spacing: this.spacing,
				reverse: this.reverse
//				letters: this.letters	//No need to pass this, the letters are recreated on the fly every time when initiated
			});
		},
		/**
		 * Returns string represenation of a group
		 * @return {String}
		 */
		toString: function() {
			return '#<fabric.CurvedText (' + this.complexity() +
					'): { "text": "' + this.text + '", "fontFamily": "' + this.fontFamily + '", "radius": "' + this.radius + '", "spacing": "' + this.spacing + '", "reverse": "' + this.reverse + '" }>';
		},
		/* _TO_SVG_START_ */
		/**
		 * Returns svg representation of an instance
		 * @return {String} svg representation of an instance
		 */
		toSVG: function() {
			var objectsMarkup = [ ];
			for (var i = 0, len = this.letters.size(); i < len; i++) {
				objectsMarkup.push(this.letters.item(i).toSVG());
			}
			return (
			        '<g transform="' + this.getSvgTransform() + '">' +
					objectsMarkup.join('') +
					'</g>');
		}
		/* _TO_SVG_END_ */
});

	/**
	 * Returns {@link fabric.CurvedText} instance from an object representation
	 * @static
	 * @memberOf fabric.CurvedText
	 * @param {Object} object Object to create a group from
	 * @param {Object} [options] Options object
	 * @return {fabric.CurvedText} An instance of fabric.CurvedText
	 */
	fabric.CurvedText.fromObject = function(object) {
		return new fabric.CurvedText(object.text, clone(object));
	};

	fabric.util.createAccessors(fabric.CurvedText);

	/**
	 * Indicates that instances of this type are async
	 * @static
	 * @memberOf fabric.CurvedText
	 * @type Boolean
	 * @default
	 */
	fabric.CurvedText.async = false;

})(typeof exports !== 'undefined' ? exports : this);
