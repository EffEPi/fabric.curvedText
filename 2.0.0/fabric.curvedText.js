(function (global){

	"use strict";

	const fabric = global.fabric || (global.fabric = {});
  const { extend, clone } = fabric.util.object;

  if (fabric.CurvedText) {
    fabric.warn('fabric.CurvedText is already defined');
    return;
  }

  fabric.CurvedText = fabric.util.createClass(fabric.Text, fabric.Collection, {
    _dimensionAffectingProps: fabric.Text.prototype._dimensionAffectingProps.concat([
      'radius',
      'spacing',
      'reverse',
    ]),

    delegatedProperties: {
      fill: true,
      stroke: true,
      strokeWidth: true,
      fontFamily: true,
      fontWeight: true,
      fontSize: true,
      fontStyle: true,
      lineHeight: true,
      textDecoration: true,
      textAlign: true,
      backgroundColor: true,
      textBackgroundColor: true,
      shadow: true,
      globalCompositeOperation: true,
    },

    stateProperties: fabric.Text.prototype.stateProperties.concat([
      'radius',
      'spacing',
      'reverse',
      'effect',
      'range',
      'largeFont',
      'smallFont',
    ]),

    type: 'CurvedText',
    text: '',

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

    /**
    * Reversing the radius (position of the original point)
    * @type Boolean
    * @default false
    */
    reverse: false,

    /**
    *
    * Rendering, is we are rendering and another rendering call is passed,
    * then stop rendering the old and
    * rendering the new (trying to speed things up)
    */
    _isRendering: 0,

    initialize(text, options) {
      const textOptions = options || {};

      this.letters = new fabric.Group([], {
        selectable: false,
        padding: 0,
      });

      this.__skipDimension = true;
      this.callSuper('initialize', text, textOptions);
      this.setOptions(textOptions);
      this.__skipDimension = false;

      this.set({ text });
      this._render();
    },

    initializeLetters(text) {
      if (this.letters && text) {
        while (text.length !== 0 && this.letters.size() >= text.length) {
          this.letters.remove(this.letters.item(this.letters.size() - 1));
        }
        if (text.length === 0) {
          this.letters._objects = [];
        }

        for (let i = 0; i < text.length; i += 1) {
          // I need to pass the options from the main options
          if (this.letters.item(i) === undefined) {
            this.letters.add(new fabric.Text(text[i], {
              // Text will get blurry when enlarged if object caching is on. Need to check how to refresh
              // cache when cache properties is updated.
              objectCaching: false,
            }));
          } else {
            this.letters.item(i).set({ text: text[i] });
          }
        }

        this._objects = this.letters;
      }
    },

    _set(key, value) {
      this.callSuper('_set', key, value);

      if (key === 'text') {
        this.initializeLetters(value);
      }
    },

    _renderChar(effect, index, multiplier, curAngle, letterAngle, space, width) {
      const char = this.letters.item(index);
      let thisLetterAngle = letterAngle;
      let thisCurAngle = curAngle;
      let thisWidth = width;

      if (char) {
        Object.keys(this.delegatedProperties).forEach(key => char.set(key, this.get(key)));

        char.set({
          left: width,
          top: 0,
          angle: 0,
          padding: 0,
        });

        if (effect === 'curved') {
          thisLetterAngle = ((char.width + space) / this.radius) / (Math.PI / 180);
          thisCurAngle = multiplier * ((multiplier * curAngle) + letterAngle);
          const angleRadians = thisCurAngle * (Math.PI / 180);

          char.set({
            top: multiplier * -1 * (Math.cos(angleRadians) * this.radius),
            left: multiplier * (Math.sin(angleRadians) * this.radius),
            angle: thisCurAngle,
            padding: 0,
            selectable: false,
          });
        } else if (effect === 'arc') {
          thisCurAngle = multiplier * ((multiplier * curAngle) + letterAngle);
          const angleRadians = thisCurAngle * (Math.PI / 180);

          char.set({
            top: multiplier * -1 * (Math.cos(angleRadians) * this.radius),
            left: multiplier * (Math.sin(angleRadians) * this.radius),
            padding: 0,
            selectable: false,
          });
        } else if (effect === 'straight') {
          char.set({
            top: 0,
            left: width,
            angle: 0,
            padding: 0,
            borderColor: 'red',
            cornerColor: 'green',
            cornerSize: 6,
            transparentCorners: false,
            selectable: false,
          });

          thisWidth = width + char.getScaledWidth();
        } else if (effect === 'smalltolarge') {
          const small = parseInt(this.smallFont, 10);
          const large = parseInt(this.largeFont, 10);
          const difference = large - small;
          const step = difference / (this.text.length);
          const newFont = small + (index * step);

          char.set({
            fontSize: newFont,
            left: width,
            padding: 0,
            selectable: false,
            top: (-1 * char.get('fontSize')) + index,
          });

          thisWidth = width + char.getScaledWidth();
        } else if (effect === 'largetosmalltop') {
          const small = parseInt(this.largeFont, 10);
          const large = parseInt(this.smallFont, 10);
          const difference = large - small;
          const step = difference / this.text.length;
          const newFont = small + (index * step);

          char.set({
            fontSize: newFont,
            left: width,
            padding: 0,
            borderColor: 'red',
            cornerColor: 'green',
            cornerSize: 6,
            transparentCorners: false,
            selectable: false,
            top: (-1 * char.get('fontSize')) + (index / this.text.length),
          });

          thisWidth = width + char.getScaledWidth();
        } else if (effect === 'largetosmallbottom') {
          const small = parseInt(this.largeFont, 10);
          const large = parseInt(this.smallFont, 10);
          const difference = large - small;
          const step = difference / (this.text.length);
          const newFont = small + (index * step);

          char.set({
            fontSize: newFont,
            left: width,
            padding: 0,
            borderColor: 'red',
            cornerColor: 'green',
            cornerSize: 6,
            transparentCorners: false,
            selectable: false,
            top: (-1 * char.get('fontSize')) - index,
          });

          thisWidth = width + char.getScaledWidth();
        } else if (effect === 'bulge') {
          const small = parseInt(this.smallFont, 10);
          const large = parseInt(this.largeFont, 10);
          const difference = large - small;
          const center = Math.ceil(this.text.length / 2);
          const step = difference / (this.text.length - center);
          const newFont = (index < center) ?
            (small + (index * step)) :
            (large - (((index - center) + 1) * step));

          char.set({
            fontSize: newFont,
            left: width,
            padding: 0,
            selectable: false,
            top: -1 * (char.get('height') / 2),
          });

          thisWidth = width + char.getScaledWidth();
        }
      }

      return {
        char,
        thisLetterAngle,
        thisCurAngle,
        thisWidth,
      };
    },

    _render() {
      const renderingCode = fabric.util.getRandomInt(100, 999);
      this._isRendering = renderingCode;

      if (this.letters) {
        let curAngle = 0;
        let letterAngle = 0;
        let width = 0;
        let textWidth = 0;

        const space = parseInt(this.spacing, 10);
        const lowerCaseEffect = this.effect ? this.effect.toLowerCase() : '';

        // Get text width
        if (lowerCaseEffect === 'curved') {
          for (let i = 0, len = this.text.length; i < len; i += 1) {
            if (this.letters.item(i)) {
              textWidth += this.letters.item(i).width + space;
            }
          }
          textWidth -= space;
        } else if (lowerCaseEffect === 'arc') {
          if (this.letters && this.letters.item(0) && this.text) {
            letterAngle = ((this.letters.item(0).fontSize + space) / this.radius) / (Math.PI / 180);
            textWidth = ((this.text.length + 1) * (this.letters.item(0).fontSize + space));
          }
        }

        // Text align
        if (this.get('textAlign') === 'right') {
          curAngle = 90 - (((textWidth / 2) / this.radius) / (Math.PI / 180));
        } else if (this.get('textAlign') === 'left') {
          curAngle = -90 - (((textWidth / 2) / this.radius) / (Math.PI / 180));
        } else {
          curAngle = -(((textWidth / 2) / this.radius) / (Math.PI / 180));
        }

        if (this.reverse) { curAngle = -curAngle; }
        const multiplier = this.reverse ? -1 : 1;

        for (let i = 0, len = this.text.length; i < len; i += 1) {
          if (renderingCode !== this._isRendering) {
            return;
          }

          const renderedChar = this._renderChar(
            lowerCaseEffect,
            i,
            multiplier,
            curAngle,
            letterAngle,
            space,
            width,
          );
          if (renderedChar) {
            letterAngle = renderedChar.thisLetterAngle;
            curAngle = renderedChar.thisCurAngle;
            width = renderedChar.thisWidth;
          }
        }

        const scaleX = this.letters.get('scaleX');
        const scaleY = this.letters.get('scaleY');
        const angle = this.letters.get('angle');

        this.letters.set('scaleX', 1);
        this.letters.set('scaleY', 1);
        this.letters.set('angle', 0);

        // Update group coords
        this.letters._calcBounds();
        this.letters._updateObjectsCoords();

        this.letters.set('scaleX', scaleX);
        this.letters.set('scaleY', scaleY);
        this.letters.set('angle', angle);

        this.width = this.letters.width;
        this.height = this.letters.height;
        this.letters.set('left', -(this.letters.width / 2));
        this.letters.set('top', -(this.letters.height / 2));
      }
    },

    render(ctx) {
      // do not render if object is not visible
      if (!this.visible) {
        return;
      }

      if (!this.letters) {
        return;
      }

      this._render();
      ctx.save();
      this.transform(ctx);

      if (this.clipTo) { fabric.util.clipContext(this, ctx); }

      // The array is now sorted in order of highest first, so start from end.
      for (let i = 0, len = this.letters.size(); i < len; i += 1) {
        const object = this.letters.item(i);
        // do not render if object is not visible
        if (!object || !object.visible) {
          continue;
        }

        object.render(ctx);
      }

      if (this.clipTo) { ctx.restore(); }

      ctx.restore();
      this.setCoords();
    },

    toObject(propertiesToInclude) {
      const object = extend(this.callSuper('toObject', propertiesToInclude), {
        radius: this.radius,
        spacing: this.spacing,
        reverse: this.reverse,
        effect: this.effect,
        range: this.range,
        smallFont: this.smallFont,
        largeFont: this.largeFont,
      });

      if (!this.includeDefaultValues) {
        this._removeDefaultValues(object);
      }

      return object;
    },

    /**
    * Returns string represenation of a group
    * @return {String}
    */
    toString() {
      return `#<fabric.CurvedText ( ${this.complexity()} ): ` +
             `{ "text": "${this.text}", "fontFamily": "${this.fontFamily}", ` +
             `"radius": "${this.radius}", "spacing": "${this.spacing}", ` +
             `"reverse": "${this.reverse}" }>`;
    },

    /**
    * Returns svg representation of an instance
    * @param {Function} [reviver] Method for further parsing of svg representation.
    * @return {String} svg representation of an instance
    */
    toSVG(reviver) {
      const markup = [
        '<g ',
        'transform="', this.getSvgTransform(),
        '">',
      ];

      if (this.letters) {
        for (let i = 0, len = this.letters.size(); i < len; i += 1) {
          markup.push(this.letters.item(i).toSVG(reviver));
        }
      }
      markup.push('</g>');

      return reviver ? reviver(markup.join('')) : markup.join('');
    },
  });

  /**
  * Returns {@link fabric.CurvedText} instance from an object representation
  * @static
  * @memberOf fabric.CurvedText
  * @param {Object} object Object to create a group from
  * @param {Object} [options] Options object
  * @return {fabric.CurvedText} An instance of fabric.CurvedText
  */
  fabric.CurvedText.fromObject = object => new fabric.CurvedText(object.text, clone(object));

  if (fabric.util.createAccessors) {
    fabric.util.createAccessors(fabric.CurvedText);
  }
  fabric.CurvedText.async = false;

})(typeof exports !== 'undefined' ? exports : this);
