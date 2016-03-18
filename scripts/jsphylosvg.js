var newick_data;

Smits = {};

Smits.Common = {
  nodeIdIncrement : 0,
  activeNode: 0,

  /* Rounds float to a defined number of decimal places */
  roundFloat : function(num, digits){
    var i = 0,
        dec = 1;
    while(i < digits){
      dec *= 10;
      i++;
    }
    return Math.round(num*dec)/dec;
  },

  /* Copies properties from one object to another */
  apply : function(obj, extObj){
    if (obj && typeof extObj == 'object') {
      for (var key in extObj) {
        obj[key] = extObj[key];
      }
    }
    return obj;
  },

  addRaphEventHandler : function(el, eventType, fn, paramsObj){
    try{
      el[eventType](function(fn, paramsObj){
        return function(e,o){
          var params = paramsObj;
          params.e = e;
          fn(params);
        };
      }(fn, paramsObj));
    } catch (err){}
  },

  isInteger : function(s) {
    return !isNaN(parseInt(s));
  }
};

Smits.PhyloCanvas = function(){
  var phylogram,
      divId,
      newickObject,
      svg,
      dataObject;

  return function(inputFormat, sDivId, canvasWidth, canvasHeight, type){
    /* Privileged Methods */
    this.getNewickObject = function(){
      return newickObject;
    };
    this.clear = function(){

    };
    this.scale = function(multiplier){
      svg.svg.scale(multiplier);
    };
    this.getSvg = function(){
      return svg;
    };
    this.getPhylogram = function(){
      return phylogram;
    };

    /* CONSTRUCTOR */

    // Process dataset -- assume newick format, else needs to provide format
    if(typeof inputFormat === "object"){
      if(inputFormat.newick){
        newick_data = inputFormat.newick;
        dataObject = new Smits.PhyloCanvas.NewickParse(inputFormat.newick);
      }else {
        console.log('Please set the format of input data');
      }
    } else {
      dataObject = new Smits.PhyloCanvas.NewickParse(inputFormat);
    }

    divId = sDivId;
    svg = new Smits.PhyloCanvas.Render.SVG( divId, canvasWidth, canvasHeight );

    /* FACTORY */
    if(type == "circular"){
      setDataObject(dataObject);
			phylogram = new Smits.PhyloCanvas.Render.CircularPhylogram(
				svg,
				dataObject
			);
		}
  }

}();


Smits.PhyloCanvas.prototype = {
};

Smits.PhyloCanvas.Node = function(){
  /**
	* Node Class
	* Allows objects to be traversed across children
	*
	*/
  return function(o, parentInstance){
    // initiate object
    this.id = Smits.Common.nodeIdIncrement += 1;
    this.level = 0;
    this.len = 0;
    this.newickLen = 0;
    this.name = '';
    this.type = '';
    this.chart = {};
    this.img = [];

    if(o) Smits.Common.apply(this, o);

    /* Cache Calculations */
    this._countAllChildren = false;
    this._countImmediateChildren = false;
    this._midBranchPosition = false;

    this.children = new Array();

    if(parentInstance){
      parentInstance.children.push(this);
    }
  }
}();


Smits.PhyloCanvas.Node.prototype = {

  getCountAllChildren : function(){
    if( this._countAllChildren !== false ) return this._countAllChildren;
    var nodeCount = 0;

    for (var key in this.children) {
      if(Smits.Common.isInteger(key)){
        var child = this.children[key];
        if(child.children && child.children.length > 0){
          nodeCount += child.getCountAllChildren();
        } else {
          nodeCount ++;
        }
      }
    }
    this._countAllChildren = nodeCount;
    return nodeCount;
  }

};

Smits.PhyloCanvas.NewickParse = function(){
  var text,
      ch,
      pos,
      mLevel = 0,
      mNewickLen = 0,
      root,
      validate,

      object = function (parentNode) {
        var node  = new Smits.PhyloCanvas.Node();

        while (ch !== ')' && ch !== ',') {
          if (ch === ':'){
            next();
            node.len = Smits.Common.roundFloat(string(), 4);			// round to 4 decimal places
            if(node.len == 0){
              node.len = 0.0001;
            }
          } else if (ch === "'" || ch === '"'){
            node.type = "label";
            node.name = quotedString(ch);
          } else {
            node.type = "label";
            node.name = string();
          }
        }
        node.level = parentNode.level + 1;
        return node;
      },

      objectIterate = function(parentNode){
        var node = new Smits.PhyloCanvas.Node();
        if(parentNode){
          node.level = parentNode.level + 1;
        }

        while( ch !== ')' ){
          next();
          if( ch === '(' ) {
            node.children.push(objectIterate(node));
          } else {
            node.children.push(object(node));
          }
        }

        next();
        if(ch !== ':' && ch !== ')' && ch !== ',' && ch !== ';'){
          node.type = "label";
          node.name = string();
        }
        if(ch === ':'){
          next();
          node.len = Smits.Common.roundFloat(string(), 4);
          if(node.len == 0){
            node.len = 0.0001;
          }
          node.type = "stem";

        }
        return node;
      },

      string = function(){
        var string = '';

        while (ch !== ':' && ch !== ')' && ch !== ',' && ch !== ';'){
          string += ch;
          next();
        }
        return string;
      },

      quotedString = function(quoteType){
        var string = '';

        while (ch !== quoteType){
          string += ch;
          next();
        }
        return string;
      },

      next = function() {
        ch = text.charAt(pos);
        pos += 1;
        return ch;
      },

      recursiveProcessRoot = function(node, parentNode){
        addToInterNodes(node);
        if(node.children && node.children.length){
          for( var i = 0; i < node.children.length; i++ ){
            var child = node.children[i];
            if(child.len === 0) {	// Dendogram
              child.len = 1;
            }
            child.newickLen = Smits.Common.roundFloat(child.len + node.newickLen, 4);
            if(child.level > mLevel) mLevel = child.level;
            if(child.newickLen > mNewickLen) mNewickLen = child.newickLen;
            if(child.children.length > 0){
              recursiveProcessRoot(child, node);
            }
          }
        }
        return node;
      };

  return function(parseText){
    /* Privileged Methods */
    this.getRoot = function(){
      return root;
    };
    this.getLevels = function(){
      return mLevel;
    };
    this.getNewickLen = function(){
      return mNewickLen;
    };
    this.getValidate = function(){
      return validate;
    };


    /* CONSTRUCTOR */
    mLevel = 0;
    mNewickLen = 0;

    text = parseText;
    pos = 0;

    next();
    root = objectIterate();
    root = recursiveProcessRoot(root);
  }

}();

Smits.PhyloCanvas.NewickParse.prototype = {

};

Smits.PhyloCanvas.Render = {};

Smits.PhyloCanvas.Render.Style = {

  /* Default Styles */

  text: {
    "font-family":	'Verdana',
    "font-size":	12,
    "text-anchor":	'start',
    "font-weight": 'bold'
  },

  path: {
    "stroke": 		'rgb(0,0,0)',
    "stroke-width":	3
  },

  connectedDash : {
    "stroke": 			'rgb(200,200,200)',
    "stroke-dasharray":	". ",
    "stroke-width":	3
  },

  textSecantBg : {
    "fill": 	'#CAE1FF',
    "stroke":	'#DDD'
  },

  highlightedEdgeCircle : {
    "fill": 	'red'
  },

  getStyle : function(requestStyle, fallbackStyle){
    if(this[requestStyle]){
      return this[requestStyle];
    } else {
      return this[fallbackStyle];
    }

  }

};

Smits.PhyloCanvas.Render.Parameters = {

  /* DEFAULT PARAMETERS */
  jsOverride: 0,				// If set, js will override chart's file setting

  /* Circular Phylogram */
  Circular : {
    bufferRadius 		: 0.33,		// Margins of Tree Circle
    // If > 1, it is in pixels
    // If < 1, it is a percentage of the full canvas size
    bufferAngle 		: 5,		// controls split size in circle
    initStartAngle 		: 160,
    innerCircleRadius 	: 0,
    minHeightBetweenLeaves : 5,

    /* Labels */
    bufferInnerLabels : 2, 			// Pixels
    bufferOuterLabels : 5 			// Pixels
  },
  /*
			Rollover Events
				At minimum, the params object has the following properties:
					.svg
					.node
					.x
					.y
					.textEl
		*/
  mouseRollOver : function(params) {
    if(params.node.edgeCircleHighlight){
      params.node.edgeCircleHighlight.show();
    } else {
      var circleObject = params.svg.draw(
        new Smits.PhyloCanvas.Render.Circle(
          params.x, params.y, 5,
          { attr: Smits.PhyloCanvas.Render.Style.highlightedEdgeCircle }
        )
      );
      params.node.edgeCircleHighlight = circleObject[0];
    }
    params.textEl.attr({ fill: 'red' });
  },
  mouseRollOut : function(params) {
    params.node.edgeCircleHighlight.hide();
    params.textEl.attr({ fill: '#000' });
    if(typeof selected_node!= 'undefined' && params.node.name == selected_node.node.name){
      params.textEl.attr({ fill: 'red' });
    }
  },
  onClickAction : function(params) {
    if (typeof selected_node != 'undefined')
      selected_node.textEl.attr({ fill: '#000' });
    setSelectedNode(params);
    params.textEl.attr({ fill: 'red' });

    path = pathFromRoot(params.node.name, newick_data);
    var table = document.getElementById("myTable");
    table.innerHTML = "";
    if(newick_data.substring(newick_data.length-8) == "groups);"){
      var row2 = table.insertRow(0);
      var cell3 = row2.insertCell(0);
      cell3.innerHTML = map[params.node.name];
    }
    for(i = 0; i< path.length; i++){
      var row = table.insertRow(0);
      var cell1 = row.insertCell(0);
      cell1.innerHTML = path[i];
      if(i == path.length-1)
        cell1.style.fontWeight = 'bold';
      var row1 = table.insertRow(0);
      var cell2 = row1.insertCell(0);
      cell2.innerHTML = "------------";
    }
  }
};

Smits.PhyloCanvas.Render.Text = function(){

  return function(x, y, text, params){
    /* Defaults */
    this.type = 'text';
    this.attr = Smits.PhyloCanvas.Render.Style.text;

    this.x = x;
    this.y = y;
    this.text = text.substring(0,25);

    if(params) {
      Smits.Common.apply(this, params);
      if(params.attr) this.attr = params.attr;
    }
  }
}();

Smits.PhyloCanvas.Render.Path = function(){
  var attr = Smits.PhyloCanvas.Render.Style.path;

  return function(path, params){
    /* Defaults */
    this.type = 'path';
    this.attr = Smits.PhyloCanvas.Render.Style.path;

    this.path = path;
    if(params) {
      Smits.Common.apply(this, params);
      if(params.attr)
        this.attr = params.attr;
    }

  }
}();

Smits.PhyloCanvas.Render.Circle = function(){

  return function(x, y, radius, params){
    /* Defaults */
    this.type = 'circle';

    this.x = x;
    this.y = y;
    this.radius = radius;

    if(params) {
      Smits.Common.apply(this, params);
      if(params.attr)
        this.attr = params.attr;
    }

  }
}();

Smits.PhyloCanvas.Render.SVG = function(){
  var divId,
      canvasSize;

  return function(sDivId, canvasWidth, canvasHeight){

    /* CONSTRUCTOR */
    divId = sDivId;
    this.canvasSize = [canvasWidth, canvasHeight];

    this.svg = Raphael(sDivId, this.canvasSize[0], this.canvasSize[1]);

  }

}();

Smits.PhyloCanvas.Render.SVG.prototype = {

  render : function(){
    var instructs = this.phylogramObject.getDrawInstructs();
    for (var i = 0; i < instructs.length; i++) {
      if(instructs[i].type == 'line'){
        var line = this.svg.path(["M", instructs[i].x1, instructs[i].y1, "L", instructs[i].x2, instructs[i].y2]).attr(Smits.PhyloCanvas.Render.Style.line);
      } else if(instructs[i].type == 'path'){
        var path = this.svg.path(instructs[i].path).attr(instructs[i].attr);
      } else if(instructs[i].type == 'circle'){
        var path = this.svg.circle(instructs[i].x, instructs[i].y, instructs[i].radius).attr({
          "stroke": 'red'
        });
      } else {
        var text = this.svg.text(instructs[i].x, instructs[i].y, instructs[i].text).attr(Smits.PhyloCanvas.Render.Style.text);
        if(instructs[i].attr){
          text.attr(instructs[i].attr);
        }
        if(instructs[i].rotate){
          text.rotate(instructs[i].rotate);
        }

        var bbox = text.getBBox();
        var hyp = Math.sqrt( (bbox.height * bbox.height) + (bbox.width * bbox.width) );	// get hypotenuse

      }
    }
  },

  draw : function(instruct){
    var obj,
        param;

    if(instruct.type == 'line'){
      obj = this.svg.path(["M", instruct.x1, instruct.y1, "L", instruct.x2, instruct.y2]).attr(Smits.PhyloCanvas.Render.Style.line);
    } else if(instruct.type == 'path'){
      obj = this.svg.path(instruct.path).attr(instruct.attr);
    } else if(instruct.type == 'circle'){
      obj = this.svg.circle(instruct.x, instruct.y, instruct.radius).attr({
        "stroke": 'red'
      });
    } else if(instruct.type == 'text'){
      obj = this.svg.text(instruct.x, instruct.y, instruct.text).attr(Smits.PhyloCanvas.Render.Style.text);
      if(instruct.attr){
        obj.attr(instruct.attr);
      }
      if(instruct.rotate){
        obj.rotate(instruct.rotate);
      }

      var bbox = obj.getBBox();
      param = Math.sqrt( (bbox.height * bbox.height) + (bbox.width * bbox.width) );	// get hypotenuse
    }

    return [obj, param];
  }

};

Smits.PhyloCanvas.Render.CircularPhylogram = (function(){

  var svg,
      sParams = Smits.PhyloCanvas.Render.Parameters.Circular, 	// Easy Reference
      canvasX, canvasY, canvasMinEdge,
      scaleRadius, scaleAngle,
      minHeightBetweenLeaves,
      innerCircleRadius,
      firstBranch = true,
      absoluteY = 0, cx, cy, maxBranch,
      labelsHold = [], bgLabelsHold = [],
      bufferRadius, bufferAngle, outerRadius,
      maxLabelLength = 0,
      initStartAngle,
      rad = (Math.PI / 180);

  function secPosition(r, deg){
    deg += initStartAngle;
    return [
      Smits.Common.roundFloat(cx + r * Math.sin(deg * rad), 4),
      Smits.Common.roundFloat(cy + r * Math.cos(deg * rad), 4)
    ]; // x,y
  };
  function rotateTextByY(yCoord){
    var rotateAngle = normalizeAngle( 90 - yCoord - initStartAngle );

    if(rotateAngle > 90 && rotateAngle < 270){
      rotateAngle += 180;
      var alignment = "end";
    } else {
      var alignment = "start";
    }

    return [rotateAngle, alignment];
  };
  function secant(r, startAngle, endAngle, params){
    var startPos = secPosition(r, startAngle);
    var endPos = secPosition(r, endAngle);
    var arr = [],
        n, inv = 0;

    if(Math.abs(normalizeAngle(endAngle-startAngle)) > 180) {
      n = 1;
    } else {
      n = -1;
    }

    // Parameter changes
    if(params && params.invertSecant){
      n *= -1;
      inv = 1;
    }
    if(params && params.noMove){
    } else {
      arr.push('M');
    }

    arr.push(startPos[0], startPos[1], "A", r, r, 0, n < 1 ? 0 : 1, inv, endPos[0], endPos[1]);
    return arr;
  };
  function secLinePath(deg, x1, x2, params){
    var arr = [];
    var startPos = secPosition(x1, deg);
    var endPos = secPosition(x2, deg);
    if(params && params.noMove){
    } else {
      arr.push('M');
    }
    arr.push(startPos[0], startPos[1], "L", endPos[0], endPos[1]);
    return arr;
  };
  function normalizeAngle(ang){
    while(ang > 360 || ang < 0){
      if(ang > 360){
        ang -= 360;
      } else if (ang < 0){
        ang += 360;
      }
    }
    return ang;
  };
  function sector(r1, r2, y1, y2){
    if(!r2 && r1.length > 1){
      var y2 = r1[3];
      var y1 = r1[2];
      var r2 = r1[1];
      var r1 = r1[0];
    }
    var arr = array_merge( "M",
                          secant(
      r1,
      y1,
      y2,
      { noMove: 1, invertSecant: 0}
    ), "L",
                          secant(
      r2,
      y2,
      y1,
      { noMove: 1, invertSecant: 1}
    ),
                          'Z'
                         );
    return arr;
  };

  function recursiveCalculateNodePositions(node, positionX){
    positionX = positionX;

    if(node.len){ // If first branch, pad only margin
      if(firstBranch){
        absoluteY = bufferAngle || 1;		// Has to be at least 1

      } else {
        if(node.children.length == 0) absoluteY = Smits.Common.roundFloat(absoluteY + scaleAngle, 4);
      }
    }
    if(node.children.length > 0){
      var nodeCoords = [], x1,x2,y1,y2;
      x1 = positionX;
      x2 = positionX += Smits.Common.roundFloat(scaleRadius * node.len, 4);


      if(node.name){ // draw bootstrap values

      }

      if(node.children && node.children.length){
        for(var i = 0; i < node.children.length; i++){
          var child = node.children[i];
          var y = recursiveCalculateNodePositions(child, positionX);
          if(y > 0) nodeCoords.push(y);
        }
      }

      var minAngle = Smits.Common.roundFloat(Math.min.apply(null, nodeCoords ), 4);
      var maxAngle = Smits.Common.roundFloat(Math.max.apply(null, nodeCoords ), 4);

      // hack: little elbows at ends in order to prevent stair-effects at edges
      if(node.level != 0){
        svg.draw(
          new Smits.PhyloCanvas.Render.Path(
            array_merge(
              "M", secPosition(positionX + 0.01, minAngle),
              "L", secant(positionX, minAngle, maxAngle, {noMove: true}),
              "L", secPosition(positionX + 0.01, maxAngle)
            )
          )
        );
      }

      if(node.len){ // draw stem
        y1 = Smits.Common.roundFloat( minAngle + (maxAngle-minAngle)/2, 4 );
        svg.draw(new Smits.PhyloCanvas.Render.Path(secLinePath(y1, x1, x2)));
      }

    } else {
      // LABEL

      // preserve for later processing
      node.y = absoluteY;
      labelsHold.push(node);

      x1 = positionX;
      x2 = positionX =  Smits.Common.roundFloat(positionX + (scaleRadius * node.len));
      y1 = absoluteY;

      svg.draw(new Smits.PhyloCanvas.Render.Path(secLinePath(y1, x1, x2)));
      svg.draw(
        new Smits.PhyloCanvas.Render.Path(
          secLinePath(y1, x2, maxBranch),
          { attr : Smits.PhyloCanvas.Render.Style.connectedDash }
        )
      );



      if(node.name){
        var pos = secPosition(maxBranch + sParams.bufferInnerLabels, y1);
        var rotateParam = rotateTextByY(y1);
        var rotateAngle = rotateParam[0];
        var alignment = rotateParam[1];

        var attr = {};
        if(node.style){
          Smits.Common.apply(attr, Smits.PhyloCanvas.Render.Style.getStyle(node.style, 'text'));
        }
        attr["text-anchor"] = alignment;
        if(node.uri) { attr.href = node.uri };
        if(node.description) {attr.title = node.description };

        var draw = svg.draw(
          new Smits.PhyloCanvas.Render.Text(
            pos[0], pos[1],
            node.name,
            {
              attr: attr,
              rotate: [rotateAngle, pos[0], pos[1]]
            }
          )
        );

        // Background Style
        if(node.bgStyle){
          bgLabelsHold.push([node.bgStyle, y1]);
        }

        // Rollover, Rollout and Click Events
        var pos = secPosition(x2, y1);
        if(Smits.PhyloCanvas.Render.Parameters.mouseRollOver){

          Smits.Common.addRaphEventHandler(
            draw[0],
            'mouseover',
            Smits.PhyloCanvas.Render.Parameters.mouseRollOver,
            { svg: svg, node: node, x: pos[0], y: pos[1], textEl: draw[0] }
          );
        }
        if(Smits.PhyloCanvas.Render.Parameters.mouseRollOut){
          Smits.Common.addRaphEventHandler(
            draw[0],
            'mouseout',
            Smits.PhyloCanvas.Render.Parameters.mouseRollOut,
            { svg: svg, node: node, x: pos[0], y: pos[1], textEl: draw[0] }
          );
        }
        if(Smits.PhyloCanvas.Render.Parameters.onClickAction){
          Smits.Common.addRaphEventHandler(
            draw[0],
            'click',
            Smits.PhyloCanvas.Render.Parameters.onClickAction,
            { svg: svg, node: node, x: pos[0], y: pos[1], textEl: draw[0] }
          );
        }

        maxLabelLength = Math.max(draw[1], maxLabelLength);
      }
    }
    if(firstBranch){
      firstBranch = false;
    }
    return y1;
  };


  function array_merge(arr) {
    var merged = arr;
    for (var i = 1; i < arguments.length; i++) {
      merged = merged.concat(arguments[i]);
    }
    return merged;
  };

  function renderBackground(){
    var arr = [];

    // Neutral Background
    var arr = sector(
      maxBranch,
      maxBranch + maxLabelLength + sParams.bufferOuterLabels,
      (bufferAngle || 1) - (scaleAngle/2),
      360  - (scaleAngle/2)
    );
    var bgObj = svg.draw(
      new Smits.PhyloCanvas.Render.Path(
        arr,
        { attr: Smits.PhyloCanvas.Render.Style.textSecantBg }
      )
    );

    bgObj[0].toBack(); 		// Put it behind the labels

    return maxBranch + maxLabelLength + sParams.bufferOuterLabels;
  };

  return function(sSvg, dataObject, bufferRadius){
    /* Privileged Methods */
    this.getCanvasSize = function(){
      return [canvasX, canvasY];
    };
    this.getRoot = function(){
      return dataObject.getRoot();
    };

    /* CONSTRUCTOR */
    // Validation
    if(dataObject.getValidate()){
      sSvg.draw({type: 'text', x: 0, y: sSvg.canvasSize[1] / 3, text: dataObject.getValidate() });
      return
    }

    // Properties Setup
    svg 			= sSvg;
    var node 		= dataObject.getRoot();
    var mNewickLen 	= dataObject.getNewickLen();
    canvasX 		= svg.canvasSize[0];															// Full Canvas Width
    canvasY 		= svg.canvasSize[1];															// Full Canvas Height
    cx 				= canvasX / 2;																	// Set Center Position
    cy 				= canvasY / 2;
    canvasMinEdge 	= Math.min.apply(null, [canvasX,canvasY]);

    bufferRadius		= (sParams.bufferRadius > 1) ? sParams.bufferRadius : Smits.Common.roundFloat(canvasMinEdge * sParams.bufferRadius, 4);
    bufferAngle 		= sParams.bufferAngle;							// controls split size in circle
    innerCircleRadius	= sParams.innerCircleRadius;
    minHeightBetweenLeaves	= sParams.minHeightBetweenLeaves;
    initStartAngle		= sParams.initStartAngle;						// Angle at which the entire tree is rotated

    maxBranch			= Math.round( (canvasMinEdge - bufferRadius - innerCircleRadius) / 2);		// maximum branch length
    scaleRadius			= (maxBranch - innerCircleRadius) / mNewickLen;								// scale multiplier to use
    scaleAngle 			= Smits.Common.roundFloat( (360 - bufferAngle) / node.getCountAllChildren(), 4 );

    // Draw Nodes and Labels
    recursiveCalculateNodePositions(node, innerCircleRadius);
    outerRadius = maxBranch + maxLabelLength + sParams.bufferOuterLabels;

    // Draw Background behind labels
    outerRadius = renderBackground();
  }
})();

Smits.PhyloCanvas.Render.CircularPhylogram.prototype = {

};

function pathFromRoot(ele, tree){
  var p = [];
  p.push(ele);

  current = tree.indexOf(ele);
  tree = tree.substring(current);

  while(true){
    o_bracket = tree.indexOf("\(");
    c_bracket = tree.indexOf("\)");
    closest = findClosestBracket(o_bracket, c_bracket);

    while(closest == "ob"){
      closest_cb = tree.indexOf("\)");
      temp_tree = tree.substring(0, closest_cb);

      n = temp_tree.split('\(').length-1;

      for(i =0; i<n; i++){
        tree = tree.substring(tree.indexOf("\)") + 1);

        o_bracket = tree.indexOf("\(");
        c_bracket = tree.indexOf("\)");
        c = findClosestBracket(o_bracket, c_bracket);

        if(c == "ob"){
          closest_cb = tree.indexOf("\)");
          temp_tree = tree.substring(0, closest_cb);

          tn = temp_tree.split('\(').length-1;
          n = n+ tn;
        }
      }
      o_bracket = tree.indexOf("\(");
      c_bracket = tree.indexOf("\)");
      closest = findClosestBracket(o_bracket, c_bracket);
    }

    c_bracket = tree.indexOf("\)");
    tree = tree.substring(c_bracket+1);

    comma = tree.indexOf(",");
    next_c_bracket = tree.indexOf("\)");

    if(next_c_bracket == -1){
      break;
    }
    else{
      if(comma != -1 && comma > next_c_bracket){
        parent = tree.substring(0,next_c_bracket);
        p.push(parent);
      }
      else if(comma != -1 && comma < next_c_bracket){
        parent = tree.substring(0,comma);
        p.push(parent);
      }
      else{
        parent = tree.substring(0,next_c_bracket);
        p.push(parent);
      }
    }
  }
  return p;
}

function findClosestBracket(ob, cb){
  if(ob == -1)
    return "cb";
  else if(cb == -1)
    return "ob";
  else if(ob != -1 && cb != -1 && ob < cb)
    return "ob";
  else
    return "cb";
}

function rotate(){
  var start_angle = Smits.PhyloCanvas.Render.Parameters.Circular.initStartAngle;
  if((start_angle + 90) > 360)
    Smits.PhyloCanvas.Render.Parameters.Circular.initStartAngle = (start_angle + 90) - 360;
  else
    Smits.PhyloCanvas.Render.Parameters.Circular.initStartAngle += 90;
  document.getElementById("svgCanvas").innerHTML = "";
  phylocanvas = new Smits.PhyloCanvas(
        dataObject,
        'svgCanvas',
        2200, 2200,
        'circular'
      );
}









