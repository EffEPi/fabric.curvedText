(function (global){

	"use strict";

	var fabric=global.fabric||(global.fabric={}),
			extend=fabric.util.object.extend,
			clone=fabric.util.object.clone;

	if(fabric.CurvedText){
		fabric.warn('fabric.CurvedText is already defined');
		return;
	}
	var stateProperties=fabric.Text.prototype.stateProperties.concat();
	stateProperties.push(
			'radius',
			'spacing',
			'reverse',
			'effect',
			'range',
			'largeFont',
			'smallFont'
			);
	var _dimensionAffectingProps=fabric.Text.prototype._dimensionAffectingProps;
	_dimensionAffectingProps['radius']=true;
	_dimensionAffectingProps['spacing']=true;
	_dimensionAffectingProps['reverse']=true;
	_dimensionAffectingProps['fill']=true;
	_dimensionAffectingProps['effect']=true;
	_dimensionAffectingProps['width']=true;
	_dimensionAffectingProps['height']=true;
	_dimensionAffectingProps['range']=true;
	_dimensionAffectingProps['fontSize']=true;
	_dimensionAffectingProps['shadow']=true;
	_dimensionAffectingProps['largeFont']=true;
	_dimensionAffectingProps['smallFont']=true;


	var delegatedProperties=fabric.Group.prototype.delegatedProperties;
	delegatedProperties['backgroundColor']=true;
	delegatedProperties['textBackgroundColor']=true;
	delegatedProperties['textDecoration']=true;
	delegatedProperties['stroke']=true;
	delegatedProperties['strokeWidth']=true;
	delegatedProperties['shadow']=true;
	delegatedProperties['fontWeight']=true;
	delegatedProperties['fontStyle']=true;
	delegatedProperties['strokeWidth']=true;
	delegatedProperties['textAlign']=true;

	/**
	 * Group class
	 * @class fabric.CurvedText
	 * @extends fabric.Text
	 * @mixes fabric.Collection
	 */
	fabric.CurvedText=fabric.util.createClass(fabric.Text, fabric.Collection, /** @lends fabric.CurvedText.prototype */ {
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
		 * Special Effects, Thanks to fahadnabbasi
		 * https://github.com/EffEPi/fabric.curvedText/issues/9
		 */
		range: 5,
		smallFont: 10,
		largeFont: 30,
		effect: 'curved',
		/**
		 * Spacing between the letters
		 * @type fabricNumber
		 * @default 20
		 */
		spacing: 20,
//		letters: null,

		/**
		 * Reversing the radius (position of the original point)
		 * @type Boolean
		 * @default false
		 */
		reverse: false,
		/**
		 * List of properties to consider when checking if state of an object is changed ({@link fabric.Object#hasStateChanged})
		 * as well as for history (undo/redo) purposes
		 * @type Array
		 */
		stateProperties: stateProperties,
		/**
		 * Properties that are delegated to group objects when reading/writing
		 * @param {Object} delegatedProperties
		 */
		delegatedProperties: delegatedProperties,
		/**
		 * Properties which when set cause object to change dimensions
		 * @type Object
		 * @private
		 */
		_dimensionAffectingProps: _dimensionAffectingProps,
		/**
		 *
		 * Rendering, is we are rendering and another rendering call is passed, then stop rendering the old and
		 * rendering the new (trying to speed things up)
		 */
		_isRendering: 0,
		/**
		 * Added complexity
		 */
		complexity: function (){
			this.callSuper('complexity');
		},
		initialize: function (text, options){
			options||(options={});
			this.letters=new fabric.Group([], {
				selectable: false,
				padding: 0
			});
			this.__skipDimension=true;
			this.setOptions(options);
			this.__skipDimension=false;
//			this.callSuper('initialize', options);
			this.setText(text);
		},
		setText: function (text){
			if(this.letters){
				while(text.length!==0&&this.letters.size()>=text.length){
					this.letters.remove(this.letters.item(this.letters.size()-1));
				}
				for(var i=0; i<text.length; i++){
					//I need to pass the options from the main options
					if(this.letters.item(i)===undefined){
						this.letters.add(new fabric.Text(text[i]));
					}else{
						this.letters.item(i).setText(text[i]);
					}
				}
			}
			this.callSuper('setText', text);
		},
		_initDimensions: function (ctx){
			// from fabric.Text.prototype._initDimensions
			// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
			if(this.__skipDimension){
				return;
			}
			if(!ctx){
				ctx=fabric.util.createCanvasElement().getContext('2d');
				this._setTextStyles(ctx);
			}
			this._textLines=this.text.split(this._reNewline);
			this._clearCache();
			var currentTextAlign=this.textAlign;
			this.textAlign='left';
			this.width=this._getTextWidth(ctx);
			this.textAlign=currentTextAlign;
			this.height=this._getTextHeight(ctx);
			// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
			this._render(ctx);
		},
		_render: function (ctx){
			var renderingCode=fabric.util.getRandomInt(100, 999);
			this._isRendering=renderingCode;
			if(this.letters){
				var curAngle=0,
						curAngleRotation=0,
						angleRadians=0,
						align=0,
						textWidth=0,
						space=parseInt(this.spacing),
						fixedLetterAngle=0;

				//get text width
				if(this.effect==='curved'){
					for(var i=0, len=this.text.length; i<len; i++){
						textWidth+=this.letters.item(i).width+space;
					}
					textWidth-=space;
				}else if(this.effect==='arc'){
					fixedLetterAngle=((this.letters.item(0).fontSize+space)/this.radius)/(Math.PI/180);
					textWidth=((this.text.length+1)*(this.letters.item(0).fontSize+space));
				}
				// Text align
				if(this.get('textAlign')==='right'){
					curAngle=90-(((textWidth/2)/this.radius)/(Math.PI/180));
				}else if(this.get('textAlign')==='left'){
					curAngle=-90-(((textWidth/2)/this.radius)/(Math.PI/180));
				}else{
					curAngle=-(((textWidth/2)/this.radius)/(Math.PI/180));
				}
				if(this.reverse)
					curAngle=-curAngle;

				var width=0,
						multiplier=this.reverse?-1:1,
						thisLetterAngle=0,
						lastLetterAngle=0;

				for(var i=0, len=this.text.length; i<len; i++){
					if(renderingCode!==this._isRendering)
						return;

					for(var key in this.delegatedProperties){
						this.letters.item(i).set(key, this.get(key));
					}

					this.letters.item(i).set('left', (width));
					this.letters.item(i).set('top', (0));
					this.letters.item(i).setAngle(0);
					this.letters.item(i).set('padding', 0);

					if(this.effect==='curved'){
						thisLetterAngle=((this.letters.item(i).width+space)/this.radius)/(Math.PI/180);
						curAngle=multiplier*((multiplier*curAngle)+lastLetterAngle);
						angleRadians=curAngle*(Math.PI/180);
						lastLetterAngle=thisLetterAngle;

						this.letters.item(i).setAngle(curAngle);
						this.letters.item(i).set('top', multiplier*-1*(Math.cos(angleRadians)*this.radius));
						this.letters.item(i).set('left', multiplier*(Math.sin(angleRadians)*this.radius));
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);

					}else if(this.effect==='arc'){//arc
						curAngle=multiplier*((multiplier*curAngle)+fixedLetterAngle);
						angleRadians=curAngle*(Math.PI/180);

						this.letters.item(i).set('top', multiplier*-1*(Math.cos(angleRadians)*this.radius));
						this.letters.item(i).set('left', multiplier*(Math.sin(angleRadians)*this.radius));
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);
					}else if(this.effect==='STRAIGHT'){//STRAIGHT
						//var newfont=(i*5)+15;
						//this.letters.item(i).set('fontSize',(newfont));
						this.letters.item(i).set('left', (width));
						this.letters.item(i).set('top', (0));
						this.letters.item(i).setAngle(0);
						width+=this.letters.item(i).get('width');
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set({
							borderColor: 'red',
							cornerColor: 'green',
							cornerSize: 6,
							transparentCorners: false
						});
						this.letters.item(i).set('selectable', false);
					}else if(this.effect==='smallToLarge'){//smallToLarge
						var small=parseInt(this.smallFont);
						var large=parseInt(this.largeFont);
						//var small = 20;
						//var large = 75;
						var difference=large-small;
						var center=Math.ceil(this.text.length/2);
						var step=difference/(this.text.length);
						var newfont=small+(i*step);

						//var newfont=(i*this.smallFont)+15;

						this.letters.item(i).set('fontSize', (newfont));

						this.letters.item(i).set('left', (width));
						width+=this.letters.item(i).get('width');
						//this.letters.item(i).set('padding', 0);
						/*this.letters.item(i).set({
						 borderColor: 'red',
						 cornerColor: 'green',
						 cornerSize: 6,
						 transparentCorners: false
						 });*/
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);
						this.letters.item(i).set('top', -1*this.letters.item(i).get('fontSize')+i);
						//this.letters.width=width;
						//this.letters.height=this.letters.item(i).get('height');

					}else if(this.effect==='largeToSmallTop'){//largeToSmallTop
						var small=parseInt(this.largeFont);
						var large=parseInt(this.smallFont);
						//var small = 20;
						//var large = 75;
						var difference=large-small;
						var center=Math.ceil(this.text.length/2);
						var step=difference/(this.text.length);
						var newfont=small+(i*step);
						//var newfont=((this.text.length-i)*this.smallFont)+12;
						this.letters.item(i).set('fontSize', (newfont));
						this.letters.item(i).set('left', (width));
						width+=this.letters.item(i).get('width');
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set({
							borderColor: 'red',
							cornerColor: 'green',
							cornerSize: 6,
							transparentCorners: false
						});
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);
						this.letters.item(i).top=-1*this.letters.item(i).get('fontSize')+(i/this.text.length);

					}else if(this.effect==='largeToSmallBottom'){
						var small=parseInt(this.largeFont);
						var large=parseInt(this.smallFont);
						//var small = 20;
						//var large = 75;
						var difference=large-small;
						var center=Math.ceil(this.text.length/2);
						var step=difference/(this.text.length);
						var newfont=small+(i*step);
						//var newfont=((this.text.length-i)*this.smallFont)+12;
						this.letters.item(i).set('fontSize', (newfont));
						this.letters.item(i).set('left', (width));
						width+=this.letters.item(i).get('width');
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set({
							borderColor: 'red',
							cornerColor: 'green',
							cornerSize: 6,
							transparentCorners: false
						});
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);
						//this.letters.item(i).top =-1* this.letters.item(i).get('fontSize')+newfont-((this.text.length-i))-((this.text.length-i));
						this.letters.item(i).top=-1*this.letters.item(i).get('fontSize')-i;

					}else if(this.effect==='bulge'){//bulge
						var small=parseInt(this.smallFont);
						var large=parseInt(this.largeFont);
						//var small = 20;
						//var large = 75;
						var difference=large-small;
						var center=Math.ceil(this.text.length/2);
						var step=difference/(this.text.length-center);
						if(i<center)
							var newfont=small+(i*step);
						else
							var newfont=large-((i-center+1)*step);
						this.letters.item(i).set('fontSize', (newfont));

						this.letters.item(i).set('left', (width));
						width+=this.letters.item(i).get('width');

						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);

						this.letters.item(i).set('top', -1*this.letters.item(i).get('height')/2);
					}
				}

				var scaleX=this.letters.get('scaleX');
				var scaleY=this.letters.get('scaleY');
				var angle=this.letters.get('angle');

				this.letters.set('scaleX', 1);
				this.letters.set('scaleY', 1);
				this.letters.set('angle', 0);

				// Update group coords
				this.letters._calcBounds();
				this.letters._updateObjectsCoords();
				this.letters.saveCoords();
				// this.letters.render(ctx);

				this.letters.set('scaleX', scaleX);
				this.letters.set('scaleY', scaleY);
				this.letters.set('angle', angle);

				this.width=this.letters.width;
				this.height=this.letters.height;
				this.letters.left=-(this.letters.width/2);
				this.letters.top=-(this.letters.height/2);
//				console.log('End rendering')
			}
		},
		_renderOld: function (ctx){
			if(this.letters){
				var curAngle=0,
						angleRadians=0,
						align=0;
				// Text align
				var rev=0;
				if(this.reverse){
					rev=0.5;
				}
				if(this.get('textAlign')==='center'||this.get('textAlign')==='justify'){
					align=(this.spacing/2)*(this.text.length-rev);	// Remove '-1' after this.text.length for proper angle rendering
				}else if(this.get('textAlign')==='right'){
					align=(this.spacing)*(this.text.length-rev);	// Remove '-1' after this.text.length for proper angle rendering
				}
				var multiplier=this.reverse?1:-1;
				for(var i=0, len=this.text.length; i<len; i++){
					// Find coords of each letters (radians : angle*(Math.PI / 180)
					curAngle=multiplier*(-i*parseInt(this.spacing, 10)+align);
					angleRadians=curAngle*(Math.PI/180);

					for(var key in this.delegatedProperties){
						this.letters.item(i).set(key, this.get(key));
					}
					this.letters.item(i).set('top', (multiplier-Math.cos(angleRadians)*this.radius));
					this.letters.item(i).set('left', (multiplier+Math.sin(angleRadians)*this.radius));
					this.letters.item(i).setAngle(curAngle);
					this.letters.item(i).set('padding', 0);
					this.letters.item(i).set('selectable', false);
				}
				// Update group coords
				this.letters._calcBounds();
				if(this.reverse){
					this.letters.top=this.letters.top-this.height*2.5;
				}else{
					this.letters.top=0;
				}
				this.letters.left=this.letters.left-this.width/2; // Change here, for proper group display
				//this.letters._updateObjectsCoords();					// Commented off this line for group misplacement
				this.letters.saveCoords();
//				this.letters.render(ctx);
				this.width=this.letters.width;
				this.height=this.letters.height;
				this.letters.left=-(this.letters.width/2);
				this.letters.top=-(this.letters.height/2);
			}
		},
		render: function (ctx, noTransform){
			// do not render if object is not visible
			if(!this.visible)
				return;
			if(!this.letters)
				return;

			ctx.save();
			this.transform(ctx);

			var groupScaleFactor=Math.max(this.scaleX, this.scaleY);

			this.clipTo&&fabric.util.clipContext(this, ctx);

			//The array is now sorted in order of highest first, so start from end.
			for(var i=0, len=this.letters.size(); i<len; i++){
				var object=this.letters.item(i),
						originalScaleFactor=object.borderScaleFactor,
						originalHasRotatingPoint=object.hasRotatingPoint;

				// do not render if object is not visible
				if(!object.visible)
					continue;

//				object.borderScaleFactor=groupScaleFactor;
//				object.hasRotatingPoint=false;

				object.render(ctx);

//				object.borderScaleFactor=originalScaleFactor;
//				object.hasRotatingPoint=originalHasRotatingPoint;
			}
			this.clipTo&&ctx.restore();

			//Those lines causes double borders.. not sure why
//			if(!noTransform&&this.active){
//				this.drawBorders(ctx);
//				this.drawControls(ctx);
//			}
			ctx.restore();
			this.setCoords();
		},
		/**
		 * @private
		 */
		_set: function (key, value){
			this.callSuper('_set', key, value);
			if(this.letters){
				this.letters.set(key, value);
				//Properties are delegated with the object is rendered
//				if (key in this.delegatedProperties) {
//					var i = this.letters.size();
//					while (i--) {
//						this.letters.item(i).set(key, value);
//					}
//				}
				if(key in this._dimensionAffectingProps){
					this._initDimensions();
					this.setCoords();
				}
			}
		},
		toObject: function (propertiesToInclude){
			var object=extend(this.callSuper('toObject', propertiesToInclude), {
				radius: this.radius,
				spacing: this.spacing,
				reverse: this.reverse,
				effect: this.effect,
				range: this.range,
				smallFont: this.smallFont,
				largeFont: this.largeFont
						//				letters: this.letters	//No need to pass this, the letters are recreated on the fly every time when initiated
			});
			if(!this.includeDefaultValues){
				this._removeDefaultValues(object);
			}
			return object;
		},
		/**
		 * Returns string represenation of a group
		 * @return {String}
		 */
		toString: function (){
			return '#<fabric.CurvedText ('+this.complexity()+'): { "text": "'+this.text+'", "fontFamily": "'+this.fontFamily+'", "radius": "'+this.radius+'", "spacing": "'+this.spacing+'", "reverse": "'+this.reverse+'" }>';
		},
		/* _TO_SVG_START_ */
		/**
		 * Returns svg representation of an instance
		 * @param {Function} [reviver] Method for further parsing of svg representation.
		 * @return {String} svg representation of an instance
		 */
		toSVG: function (reviver){
			var markup=[
				'<g ',
				'transform="', this.getSvgTransform(),
				'">'
			];
			if(this.letters){
				for(var i=0, len=this.letters.size(); i<len; i++){
					markup.push(this.letters.item(i).toSVG(reviver));
				}
			}
			markup.push('</g>');
			return reviver?reviver(markup.join('')):markup.join('');
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
	fabric.CurvedText.fromObject=function (object){
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
	fabric.CurvedText.async=false;

})(typeof exports!=='undefined'?exports:this);
