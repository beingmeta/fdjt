/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009-2010 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides extended Javascript utility functions
    of various kinds.

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

    Use, modification, and redistribution of this program is permitted
    under either the GNU General Public License (GPL) Version 2 (or
    any later version) or under the GNU Lesser General Public License
    (version 3 or later).

    These licenses may be found at www.gnu.org, particularly:
      http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
      http://www.gnu.org/licenses/lgpl-3.0-standalone.html

*/

var fdjtDOM=
  (function(){
    function fdjtDOM(spec){
      var node;
      if (spec.nodeType) node=spec;
      else if (typeof spec==='string')
	if (spec[0]==='<') {
	  var container=document.createElement("DIV");
	  container.innerHTML=spec;
	  var children=container.childNodes;
	  var i=0; var len=children.length;
	  while (i<len)
	    if (children[i].nodeType===1) return children[i];
	    else i++;
	  return false;}
	else {
	  var elts=spec.match(css_selector_regex);
	  var classname=false;
	  node=document.createElement(elts[0]);
	  var i=1; var len=elts.length;
	  while (i<len) {
	    var sel=elts[i++];
	    if (sel[0]==='#') node.id=sel.slice(1);
	    else if (sel[0]==='.')
	      if (classname) classname=classname+" "+sel.slice(1);
	      else classname=sel.slice(1);
	    else if (sel[0]==='[') {
	      var eqpos=sel.indexOf('=');
	      if (eqpos<0)
		node.setAttribute
		  (sel.slice(1,sel.length-1),
		   sel.slice(1,sel.length-1));
	      else node.setAttribute
		     (sel.slice(1,eqpos),
		      sel.slice(eqpos+1,sel.length-1));}
	    else {}}
	  if (classname) node.className=classname;}
      else {
	node=document.createElement(spec.tagName||"span");
	for (attrib in spec) {
	  if (attrib==="tagName") continue;
	  else node.setAttribute(attrib,spec[attrib]);}}
      domappend(node,arguments,1);
      return node;}

    fdjtDOM.revid="$Id$";
    fdjtDOM.version=parseInt("$Revision$".slice(10,-1));

    function domappend(node,content,i) {
      if (typeof i === 'undefined') i=0;
      var len=content.length;
      while (i<len) {
	var elt=content[i++];
	if (!(elt)) {}
	else if (typeof elt === 'string')
	  node.appendChild(document.createTextNode(elt));
	else if (elt.nodeType)
	  node.appendChild(elt);
	else if (elt.length)
	  domappend(node,elt,0);
	else if (elt.toDOM)
	  domappend(node,elt.toDOM());
	else if (elt.toString)
	  node.appendChild(document.createTextNode(elt.toString()));
	else node.appendChild(document.createTextNode(""+elt));}}
    function dominsert(before,content,i) {
      var node=before.parentNode;
      if (typeof i === 'undefined') i=0;
      var j=content.length-1;
      while (j>=i) {
	var elt=content[j--];
	if (!(elt)) {}
	else if (typeof elt === 'string')
	  node.insertBefore(document.createTextNode(elt),before);
	else if (elt.nodeType)
	  node.insertBefore(elt,before);
	else if (elt.length)
	  dominsert(before,elt,0);
	else if (elt.toDOM)
	  dominsert(before,elt.toDOM());
	else if (elt.toString)
	  node.insertBefore(document.createTextNode(elt.toString()),before);
	else node.insertBefore(document.createTextNode(""+elt),before);}}

    /* Utility patterns and functions */

    var css_selector_regex=/((^|[.#])\w+)|(\[\w+=\w+\])/g;

    var whitespace_pat=/(\s)+/;
    var trimspace_pat=/^(\s)+|(\s)+$/;
    var classpats={};
    function classPat(name){
      var rx=new RegExp("\\b"+name+"\\b","g");
      classpats[name]=rx;
      return rx;};

    function string_trim(string){
      var start=string.search(/\S/); var end=string.search(/\s+$/g);
      if ((start===0) && (end<0)) return string;
      else return string.slice(start,end);}

    /* Simple class/attrib manipulation functions */

    function hasClass(elt,classname,attrib){
      var classinfo=((attrib) ? (elt.getAttribute(attrib)||"") : (elt.className));
      if (!(classinfo)) return false;
      else if (classname===true) return true;
      else if (classinfo===classname) return true;
      else if (typeof classname === 'string')
	if (classinfo.indexOf(' ')<0) return false;
	else classname=classpats[classname]||classPat(classname);
      else {}
      if (classinfo.search(classname)>=0) return true;
      else return false;}
    fdjtDOM.hasClass=hasClass;

    function addClass(elt,classname,attrib){
      var classinfo=
      (((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className))||null);
      if (!(classinfo)) {
	elt.className=classname; return true;}
      var class_regex=classpats[classname]||classPat(classname);
      var newinfo=classinfo;
      if (classinfo===classname) return false;
      else if (classinfo.search(class_regex)>=0) return false;
      else newinfo=classname+" "+classinfo;
      if (attrib) {
	elt.setAttribute(attrib,newinfo);
	// This sometimes trigger a CSS update that doesn't happen otherwise
	elt.className=elt.className;}
      else elt.className=newinfo;
      return true;}
    fdjtDOM.addClass=addClass;

    fdjtDOM.classAdder=function(elt,classname){
      return function() {
	if (elt) addClass(elt,classname);}};

    function dropClass(elt,classname,attrib){
      var classinfo=
      (((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className))||null);
      if (!(classinfo)) return false;
      var class_regex=
      ((typeof classname === 'string')?
       (classpats[classname]||classPat(classname)):
       classname);
      var newinfo=classinfo;
      if (classinfo===classname) 
	newinfo=null;
      else if (classinfo.search(class_regex)>=0) 
	newinfo=classinfo.replace(class_regex,"");
      else return false;
      if (newinfo)
	newinfo=newinfo.
	  replace(whitespace_pat," ").
	  replace(trimspace_pat,"");
      if (attrib)
	if (newinfo) {
	  elt.setAttribute(attrib,newinfo);
	  elt.className=elt.className;}
	else if (!(keep)) {
	  elt.removeAttribute(attrib);
	  elt.className=elt.className;}
	else {}
      else elt.className=newinfo;
      return true;}
    fdjtDOM.dropClass=dropClass;

    fdjtDOM.classDropper=function(elt,classname){
      return function() {
	if (elt) dropClass(elt,classname);}};

    function swapClass(elt,drop,add,attrib) {
      dropClass(elt,drop,attrib); addClass(elt,add,attrib);}
    fdjtDOM.swapClass=swapClass;

    function toggleClass(elt,classname,attrib){
      var classinfo=
      (((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className))||null);
      if (!(classinfo)) {
	if (attrib) elt.setAttribute(attrib,classname);
	else elt.className=classname;
	return true;}
      var class_regex=
      ((typeof classname === 'string')?
       (classpats[classname]||classPat(classname)):
       classname);
      var newinfo=classinfo;
      if (classinfo===classname) 
	newinfo=null;
      else if (classinfo.search(class_regex)>=0) 
	newinfo=classinfo.replace(class_regex,"");
      else {
	if (attrib)
	  elt.setAttribute(attrib,classinfo+' '+classname);
	else elt.className=classinfo+' '+classname;
	return true;}
      if (newinfo)
	newinfo=newinfo.
	  replace(whitespace_pat," ").
	  replace(trimspace_pat,"");
      if (attrib)
	if (newinfo) {
	  elt.setAttribute(attrib,newinfo);
	  elt.className=elt.className;}
	else if (!(keep)) {
	  elt.removeAttribute(attrib);
	  elt.className=elt.className;}
	else {}
      else elt.className=newinfo;
      return false;}
    fdjtDOM.toggleClass=toggleClass;

    fdjtDOM.isClickable=function(target){
      while (target)
	if (((target.tagName==='A')&&(target.href))||
	    (target.tagName==="INPUT") ||
	    (target.tagName==="TEXTAREA") ||
	    (target.tagName==="SELECT") ||
	    (target.tagName==="OPTION") ||
	    (hasClass(target,"fdjtclickable")))
	  return true;
	else target=target.parentNode;
      return false;};

    fdjtDOM.isTextInput=function(target){
      return ((target.tagName==='INPUT')||(target.tagName==='TEXTAREA'));};

    /* Simple CSS selectors */

    var selectors={};

    function Selector(spec,tagcs) {
      if (!(spec)) return this; // just cons with type
      else if (selectors[spec]) return selectors[spec]; // check cache
      else if (!(this instanceof Selector))
	// handle case of the forgotten 'new'
	return Selector.call(new Selector(),spec);
      if (spec.indexOf(',')>0) { // compound selectors
	var specs=spec.split(','); var compound=[];
	var i=0; var lim=specs.length;
	while (i<lim) {
	  var sub=string_trim(specs[i++]);
	  compound.push(new Selector(sub));}
	this.compound=compound;
	selectors[spec]=this;
	return this;}
      // Otherwise, parse and set up this
      var elts=spec.match(css_selector_regex);
      var i=0; var lim=elts.length;
      var classes=[]; var classnames=[]; var attribs=false;
      if (!((elts[0][0]==='.')||(elts[0][0]==='#')||(elts[0][0]==='['))) {
	this.tag=((tagcs)?(elts[0]):(elts[0].toUpperCase()));
	i=1;}
      while (i<lim)
	if (elts[i][0]==='#') this.id=elts[i++].slice(1);
	else if (elts[i][0]==='.') {
	  classnames.push(elts[i].slice(1));
	  classes.push(classPat(elts[i++].slice(1)));}
	else if (elts[i][0]==='[') {
	  var aelts=elts[i++]; var eltsend=aelts.length-1;
	  if (!(attribs)) attribs={};
	  var eqpos=aelts.indexOf('=');
	  if (eqpos<0)
	    attribs[aelts.slice(1,eltsend)]=true;
	  else if (aelts[eqpos+1]==='~') 
	    attribs[aelts.slice(1,eqpos)]=
	      classPat(aelts.slice(eqpos+2,eltsend));
	  else attribs[aelts.slice(1,eqpos)]=aelts.slice(eqpos+1,eltsend);}
	else fdjtLog.uhoh("weird elts %o",elts[i++]);
      if (classes.length) {
	this.classes=classes; this.classnames=classnames;}
      if (attribs) this.attribs=attribs;
      selectors[spec]=this;
      return this;}
    Selector.prototype.match=function(elt){
      if (this.compound) {
	var compound=this.compound; var i=0; var lim=compound.length;
	while (i<lim) if (compound[i++].match(elt)) return true;
	return false;} 
      if ((this.tag)&&(this.tag!==elt.tagName)) return false;
      else if ((this.id)&&(this.id!==elt.id)) return false;
      if (this.classes)
	if (elt.className) {
	  var classname=elt.className; var classes=this.classes;
	  var i=0; var lim=classes.length;
	  while (i<lim) if (classname.search(classes[i++])<0) return false;}
	else return false;
      if (this.attribs) {
	var attribs=this.attribs;
	for (var name in attribs) {
	  var val=elt.getAttribute(name);
	  if (!(val)) return false;
	  var need=this[name];
	  if (need===true) {}
	  else if (typeof need === 'string') {
	    if (need!==val) return false;}
	  else if (val.search(need)<0) return false;}}
      return true;};
    Selector.prototype.find=function(elt,results){
      var pickfirst=false;
      if (!(results)) results=[];
      if (this.compound) {
	var compound=this.compound; var i=0; var lim=compound.length;
	while (i<lim) compound[i++].find(elt,results);
	return results;}
      if (this.id) {
	var elt=document.getElementById(this.id);
	if (!(elt)) return results;
	else if (this.match(elt)) {
	  results.push(elt); return results;}
	else return results;}
      var candidates=[];
      var classnames=this.classnames; var attribs=this.attribs;
      if (this.classes) 
	if (elt.getElementsByClassName)
	  candidates=elt.getElementsByClassName(classnames[0]);
	else gatherByClass(elt,this.classes[0],candidates);
      else if ((this.tag)&&(elt.getElementsByTagName))
	candidates=elt.getElementsByTagName(this.tag);
      else if (this.attribs) {
	var attribs=this.attribs;
	for (var name in attribs) {
	  gatherByAttrib(elt,name,attribs[name],candidates);
	  break;}}
      else if (this.tag) {
	gatherByTag(elt,this.tag,candidates);}
      else {}
      if (candidates.length===0) return candidates;
      if (((this.tag)&&(!(this.classes))&&(!(this.attribs)))||
	  ((!(this.tag))&&(this.classes)&&(this.classes.length===1)&&
	   (!(this.attribs))))
	// When there's only one test, don't bother filtering
	return candidates;
      var i=0; var lim=candidates.length;
      while (i<lim) {
	var candidate=candidates[i++];
	if (this.match(candidate)) results.push(candidate);}
      return results;};
    fdjtDOM.Selector=Selector;

    function gatherByClass(node,pat,results){
      if (node.nodeType===1) {
	if ((node.className)&&(node.className.search(pat)>=0))
	  results.push(node);
	var children=node.childNodes;
	if (children) {
	  var i=0; var lim=children.length; var result;
	  while (i<lim) gatherByClass(children[i++],pat,results);}}}
    function gatherByTag(node,tag,results){
      if (node.nodeType===1) {
	if (node.tagName===tag) results.push(node);
	var children=node.childNodes;
	if (children) {
	  var i=0; var lim=children.length; var result;
	  while (i<lim) gatherByTag(children[i++],tag,results);}}}
    function gatherByAttrib(node,attrib,val,results){
      if (node.nodeType===1) {
	if ((node.getAttribute(attrib))&&
	    ((typeof val === 'string')?
	     (node.getAttribute(attrib)===val):
	     (node.getAttribute(attrib).search(val)>=0)))
	  results.push(node);
	var children=node.childNodes;
	if (children) {
	  var i=0; var lim=children.length; var result;
	  while (i<lim) gatherByTag(children[i++],tag,results);}}}
    
    function gather_children(node,pat,attrib,results){
      if (!(attrib)) gatherByClass(node,pat,results);
      else if (attrib==='class') gatherByClass(node,pat,results);
      else if (attrib==='tagName') gatherByTag(node,pat,results);
      else gatherByAttrib(node,attrib,pat,results);}

    /* Real simple DOM search */

    function getParent(elt,parent,attrib){
      if (parent.nodeType) {
	while (elt) {
	  if (elt===parent) return parent;
	  else elt=elt.parentNode;}
	return false;}
      else if (typeof parent === 'function') {
	while (elt) {
	  if (parent(elt)) return elt;
	  else elt=elt.parentNode;}
	return false;}
      else if (parent instanceof Selector) {
	while (elt) {
	  if (parent.match(elt)) return elt;
	  else elt=elt.parentNode;}
	return false;}
      else if (typeof parent === 'string')
	return getParent(elt,new Selector(parent));
      else throw { error: 'invalid parent spec'};}
    fdjtDOM.getParent=getParent;
    fdjtDOM.hasParent=getParent;
    fdjtDOM.inherits=function(node,spec) {
      var sel=new Selector(spec);
      return ((sel.match(node))?(node):(getParent(node,sel)));};

    function getChildren(node,classname,attrib,results){
      if (!(results)) results=[]; 
      if ((!(attrib))&&(typeof classname === 'function'))
	filter_children(node,classname,results);
      else if (attrib) {
	var pat=(classpats[parent]||classPat(parent));
	gather_children(node,classname,attrib||false,results);}
      else if (classname instanceof Selector)
	return classname.find(node,results);
      else if (typeof classname === 'string')
	return getChildren(node,new Selector(classname),false,results);
      else throw { error: 'bad selector arg', selector: classname};
      return results;}
    fdjtDOM.getChildren=getChildren;
    fdjtDOM.$=function(spec,root){return getChildren(root||document,spec);};
    fdjtDOM.getFirstChild=function(elt,spec){
      var children=getChildren(elt,spec);
      if (children.length) return children[0]; else return false;};
    
    function filter_children(node,filter,results){
      if (node.nodeType===1) {
	if (filter(node)) results.push(node);
	var children=node.childNodes;
	if (children) {
	  var i=0; var lim=children.length; var result;
	  while (i<lim) filter_children(children[i++],filter,results);}}}

    /* Manipulating the DOM */

    fdjtDOM.replace=function(existing,replacement){
      var cur=existing;
      if (typeof existing === 'string')
	if (existing[0]==='#')
	  cur=document.getElementById(existing.slice(1));
	else cur=document.getElementById(existing);
      if (cur) {
	cur.parentNode.replaceChild(replacement,cur);
	if ((cur.id)&&(!(replacement.id))) replacement.id=cur.id;}
      else fdjtLog.uhoh("Can't find %o to replace it with %o",existing,replacement);};

    fdjtDOM.append=function (node) {
      if (typeof node === 'string') node=document.getElementById(node);
      domappend(node,arguments,1);};
    fdjtDOM.prepend=function (node) {
      if (typeof node === 'string') node=document.getElementById(node);
      if (node.firstChild)
	dominsert(node.firstChild,arguments,1);
      else domappend(node,arguments,1);};

    fdjtDOM.insertBefore=function (before) {
      if (typeof before === 'string') before=document.getElementById(before);
      dominsert(before,arguments,1);};
    fdjtDOM.insertAfter=function (before) {
      if (typeof before === 'string') before=document.getElementById(before);
      if (before.nextSibling)
	dominsert(before.nextSibling,arguments,1);
      else domappend(before.parentNode,arguments,1);};
      
    /* DOM construction shortcuts */

    fdjtDOM.Input=function(spec,name,value){
      if (spec.search(/\w/)!==0) spec='INPUT'+spec;
      var node=fdjtDOM(spec);
      node.name=name; if (value) node.value=value;
      return node;};
    fdjtDOM.Anchor=function(spec,href){
      if (spec.search(/\w/)!==0) spec='A'+spec;
      var node=fdjtDOM(spec); node.href=href;
      domappend(node,arguments,2);
      return node;};

    /* Getting style information generally */

    function getStyle(elt,prop){
      var style=
	((window.getComputedStyle)&&(window.getComputedStyle(elt,null)))||
	(elt.currentStyle);
      if (!(style)) return false;
      else if (prop) return style[prop];
      else return style;}
    fdjtDOM.getStyle=getStyle;

    /* Getting display style */

    var display_styles={
      "DIV": "block","P": "block","BLOCKQUOTE":"block",
      "H1": "block","H2": "block","H3": "block","H4": "block",
      "H5": "block","H6": "block","H7": "block","H8": "block",
      "UL": "block","LI": "list-item",
      "DL": "block","DT": "list-item","DD": "list-item",
      "SPAN": "inline","EM": "inline","STRONG": "inline",
      "TT": "inline","DEFN": "inline","A": "inline",
      "TD": "table-cell","TR": "table-row",
      "TABLE": "table", "PRE": "preformatted"};

    function getDisplayStyle(elt){
      return (((window.getComputedStyle)&&(window.getComputedStyle(elt,null))&&
	       (window.getComputedStyle(elt,null).display))||
	      (display_styles[elt.tagName])||
	      "inline");}
    fdjtDOM.getDisplay=getDisplayStyle;

    /* Generating text from the DOM */

    function flatten(string){return string.replace(/\s+/," ");};

    function textify(arg,flat,inside){
      if (arg.text) return flatten(arg.text);
      else if (arg.nodeType)
	if (arg.nodeType===3) return arg.nodeValue;
	else if (arg.nodeType===1) {
	  var children=arg.childNodes;
	  var display_type=getDisplayStyle(arg);
	  var string=""; var suffix="";
	  // Figure out what suffix and prefix to use for this element
	  // If inside is false, don't use anything.
	  if (!(inside)) {}
	  else if (!(display_type)) {}
	  else if (display_type==="inline") {}
	  else if (flat) suffix=" ";
	  else if ((display_type==="block") ||
		   (display_type==="table") ||
		   (display_type==="preformatted")) {
	    string="\n"; suffix="\n";}
	  else if (display_type==="table-row") suffix="\n";
	  else if (display_type==="table-cell") string="\t";
	  else {}
	  var i=0; while (i<children.length) {
	    var child=children[i++];
	    if ((child.nodeType) && (child.nodeType===3))
	      if (flat)
		string=string+flatten(child.nodeValue);
	      else string=string+child.nodeValue;
	    else {
	      var stringval=textify(child,flat,true);
	      if (stringval) string=string+stringval;}}
	  return string+suffix;}
	else {}
      else if (arg.toString)
	return arg.toString();
      else return arg.toString();}
    fdjtDOM.textify=textify;

    /* Geometry functions */

    function getGeometry(elt,withstack,root){
      var result={};
      var top = elt.offsetTop;
      var left = elt.offsetLeft;
      var stack = ((withstack) ? (new Array(elt)) : false);
      var width=elt.offsetWidth;
      var height=elt.offsetHeight;

      while (elt.offsetParent) {
	if ((root)&&(elt===root)) break;
	elt = elt.offsetParent;
	if (withstack) withstack.push(elt);
	top += elt.offsetTop;
	left += elt.offsetLeft;}
      
      result.left=left; result.top=top;
      result.width=width;
      result.height=height;
      
      result.right=left+width; result.bottom=top+height;

      if (stack) result.stack=stack;

      return result;}
    fdjtDOM.getGeometry=getGeometry;

    function isVisible(elt,partial){
      if (!(partial)) partial=false;
      var top = elt.offsetTop;
      var left = elt.offsetLeft;
      var width = elt.offsetWidth;
      var height = elt.offsetHeight;
      var winx=(window.pageXOffset||document.documentElement.scrollLeft||0);
      var winy=(window.pageYOffset||document.documentElement.scrollTop||0);
      var winxedge=winx+(document.documentElement.clientWidth);
      var winyedge=winy+(document.documentElement.clientHeight);
  
      while(elt.offsetParent) {
	if (elt===window) break;
	elt = elt.offsetParent;
	top += elt.offsetTop;
	left += elt.offsetLeft;}

      /*
	fdjtTrace("fdjtIsVisible%s top=%o left=%o height=%o width=%o",
	((partial)?("(partial)"):""),
	top,left,height,width);
	fdjtTrace("fdjtIsVisible winx=%o winy=%o winxedge=%o winyedge=%o",
	winx,winy,winxedge,winyedge);
      */

      if (partial)
	// There are three cases we check for:
	return (
		// top of element in window
		((top > winy) && (top < winyedge) &&
		 (left > winx) && (left < winxedge)) ||
		// bottom of element in window
		((top+height > winy) && (top+height < winyedge) &&
		 (left+width > winx) && (left+width < winxedge)) ||
		// top above/left of window, bottom below/right of window
		(((top < winy) || (left < winx)) &&
		 ((top+height > winyedge) && (left+width > winxedge))));
      else return ((top > winy) && (left > winx) &&
		   (top + height) <= (winyedge) &&
		   (left + width) <= (winxedge));}
    fdjtDOM.isVisible=isVisible;

    function isAtTop(elt,delta){
      if (!(delta)) delta=50;
      var top = elt.offsetTop;
      var left = elt.offsetLeft;
      var width = elt.offsetWidth;
      var height = elt.offsetHeight;
      var winx=(window.pageXOffset||document.documentElement.scrollLeft||0);
      var winy=(window.pageYOffset||document.documentElement.scrollTop||0);
      var winxedge=winx+(document.documentElement.clientWidth);
      var winyedge=winy+(document.documentElement.clientHeight);
  
      while(elt.offsetParent) {
	elt = elt.offsetParent;
	top += elt.offsetTop;
	left += elt.offsetLeft;}

      return ((top>winx) && (top<winyedge) && (top<winx+delta));}
    fdjtDOM.isAtTop=isAtTop;

    function textwidth(node){
      if (node.nodeType===3) return node.nodeValue.length;
      else if ((node.nodeType===1)&&(node.childNodes)) {
	var children=node.childNodes;
	var i=0; var lim=children.length; var width=0;
	while (i<lim) {
	  var child=children[i++];
	  if (child.nodeType===3) width=width+child.nodeValue.length;
	  else if (child.nodeType===1)
	    width=width+textwidth(child);
	  else {}}
	return width;}
      else return 0;}
    fdjtDOM.textWidth=textwidth;

    /* Getting various kinds of metadata */

    function getHTML(){
      var children=document.childNodes;
      var i=0; var lim=children.length;
      while (i<lim)
	if (children[i].tagName==='HTML') return children[i];
	else i++;
      return false;}
    fdjtDOM.getHTML=getHTML;

    function getHEAD(){
      var children=document.childNodes;
      var i=0; var lim=children.length;
      while (i<lim)
	if (children[i].tagName==='HTML') {
	  var grandchildren=children[i].childNodes;
	  i=0; lim=grandchildren.length;
	  while (i<lim)
	    if (grandchildren[i].tagName==='HEAD')
	      return grandchildren[i];
	    else i++;
	  return false;}
	else i++;
      return false;}
    fdjtDOM.getHEAD=getHEAD;

    fdjtDOM.getMeta=function(name,multiple,matchcase){
      var results=[];
      var matchname=((matchcase)&&(name.toUpperCase()));
      var elts=((document.getElementsByTagName)?
		(document.getElementsByTagName("META")):
		(getChildren(document,"META")));
      var i=0; while (i<elts.length)
		 if (elts[i])
		   if (elts[i].name===name)
		     if (multiple) results.push(elts[i++].content);
		     else return elts[i].content;
		   else if ((matchname)&&
			    (elts[i].name.toUpperCase()===matchname))
		     if (multiple) results.push(elts[i++].content);
		     else return elts[i].content;
		   else i++;
      if (multiple) return results;
      else return false;};

    // This gets a LINK href field
    fdjtDOM.getLink=function(name,multiple,matchcase){
      var results=[];
      var matchname=((matchcase)&&(name.toUpperCase()));
      var elts=((document.getElementsByTagName)?
		(document.getElementsByTagName("LINK")):
		(getChildren(document,"LINK")));
      var i=0; while (i<elts.length)
		 if (elts[i])
		   if (elts[i].rel===name)
		     if (multiple) results.push(elts[i++].href);
		     else return elts[i].href;
		   else if ((matchname)&&
			    (elts[i].rel.toUpperCase()===matchname))
		     if (multiple) results.push(elts[i++].href);
		     else return elts[i].href;
		   else i++;
      if (multiple) return results;
      else return false;};

    /* DOM walking */

    function next_node(node){
      while (node)
	if (node.nextSibling)
	  return node.nextSibling;
	else node=node.parentNode;
      return false;}

    function forward_node(node){
      if ((node.childNodes)&&((node.childNodes.length)>0))
	return node.childNodes[0];
      else while (node)
	     if (node.nextSibling)
	       return node.nextSibling;
	     else node=node.parentNode;
      return false;}

    function next_element(node){
      if (node.nextElementSibling)
	return node.nextElementSibling;
      else {
	var scan=node;
	while (scan=scan.nextSibling) {
	  if (!(scan)) return null;
	  else if (scan.nodeType==1) break;
	  else {}}
	return scan;}}

    function forward_element(node){
      if ((node.childNodes)&&((node.childNodes.length)>0))
	return node.childNodes[0];
      else if (node.nextElementSibling)
	return node.nextElementSibling;
      else while (node)
	     if (node.nextElementSibling)
	       return node.nextSibling;
	     else if (next_element(node))
	       return next_element(node);
	     else node=node.parentNode;
      return false;}

    function previous_element(node){
      if (node.previousElementSibling)
	return node.previousElementSibling;
      else {
	var scan=node;
	while (scan=scan.previousSibling) 
	  if (!(scan)) return null;
	  else if (scan.nodeType==1) break;
	  else {}
	return scan;}}
    fdjtDOM.prevElt=previous_element;

    function scan_forward(node,test,justelts){
      if (!(test))
	if (justelts) return forward_element(node);
	else return forward_node(node);
      var scan=((justelts)?(forward_element(node)):(forward_node(node)));
      while (scan)
	if (test(scan)) return scan;
	else if (justelts) scan=forward_element(scan);
	else scan=forward_node(scan);
      return false;}

    function scan_next(node,test,justelts){
      if (!(test))
	if (justelts) return next_element(node);
	else return next_node(node);
      var scan=((justelts)?(next_element(node)):(next_node(node)));
      while (scan)
	if (test(scan)) return scan;
	else if (justelts) scan=next_element(scan);
	else scan=next_node(scan);
      return false;}

    fdjtDOM.nextElt=next_element;
    fdjtDOM.forwardElt=forward_element;
    fdjtDOM.forward=scan_forward;
    fdjtDOM.next=scan_next;

    fdjtDOM.viewTop=function(win){
      win=win||window;
      return (win.scrollY||win.document.documentElement.scrollTop||0);};
    fdjtDOM.viewLeft=function(win){
      win=win||window;
      return (win.scrollX||win.document.documentElement.scrollLeft||0);};
    fdjtDOM.viewHeight=function(win){
      return (win||window).document.documentElement.clientHeight;};
    fdjtDOM.viewWidth=function(win){
      return (win||window).document.documentElement.clientWidth;};

    fdjtDOM.addListener=function(node,evtype,handler){
      if (node.addEventListener)
	return node.addEventListener(evtype,handler,false);
      else if (node.attachEvent)
	return node.attachEvent('on'+evtype,handler);
      else fdjtLog.warn('This node never listens');};

    fdjtDOM.T=function(evt) {
      evt=evt||event; return (evt.target)||(evt.srcElement);};

    fdjtDOM.cancel=function(evt){
      evt=evt||event;
      if (evt.preventDefault) evt.preventDefault();
      else evt.returnValue=false;
      evt.cancelBubble=true;};
    return fdjtDOM;
  })();

function fdjtID(id) { return document.getElementById(id);}
function _(string) { return string;}

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
