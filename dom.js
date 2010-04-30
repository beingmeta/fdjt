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

    var css_selector_regex=/((^|[.#])\w+)|(\[\w+=\w+\])/g;

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
	node=document.createElement(attrib.tagName);
	for (attrib in spec) {
	  if (attrib==="tagName") {}
	  else node.setAttribute(attrib,spec[attrib]);}}
      domappend(node,arguments,1);
      return node;}

    fdjtDOM.revid="$Id$";
    fdjtDOM.version=parseInt("$Revision$".slice(10,-1));

    /* Various class functions and predicates */

    var whitespace_pat=/(\s)+/;
    var trimspace_pat=/^(\s)+|(\s)+$/;
    var classpats={};
    function classPat(name){
      var rx=new RegExp("\\b"+name+"\\b","g");
      classpats[name]=rx;
      return rx;};

    function hasClass(elt,classname,attrib){
      var classinfo=((attrib) ? (elt.getAttribute(attrib)||"") : (elt.className));
      if (!(classinfo)) return false;
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
      else fdjtLog.warn("Can't find %o to replace it",existing);};

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

    /* Real simple DOM search */

    function hasParent(elt,parent,attrib){
      if ((typeof parent === 'string')||(!(parent.nodeType))) {
	var scan=elt;
	var pat=((typeof parent === 'string')?
		 (classpats[parent]||classPat(parent)):
		 parent);
	while (scan)
	  if ((scan.className)&&(scan.className.search(pat)>=0))
	    return scan;
	  else scan=scan.parentNode;
	return false;}
      else {
	while (elt=elt.parentNode) {
	  if (elt===parent) return parent;}
	return false;}}
    fdjtDOM.hasParent=hasParent;

    function getParent(elt,parent,attrib){
      var scan=elt;
      var pat=((typeof parent === 'string')?
	       (classpats[parent]||classPat(parent)):
	       parent);
      while (scan)
	if ((attrib)?
	    ((scan.getAttribute(attrib))&&
	     ((scan.getAttribute(attrib)).search(pat)>=0)):
	    ((scan.className)&&(scan.className.search(pat)>=0)))
	  return scan;
	else scan=scan.parentNode;
      return false;}
    fdjtDOM.getParent=getParent;

    /* Getting style information generally */

    function getStyle(elt,prop){
      var style=((window.getComputedStyle)&&
		 (window.getComputedStyle(elt,null)));
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
      var winx=window.pageXOffset;
      var winy=window.pageYOffset;
      var winxedge=winx+window.innerWidth;
      var winyedge=winy+window.innerHeight;
  
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
      var winx=window.pageXOffset;
      var winy=window.pageYOffset;
      var winxedge=winx+window.innerWidth;
      var winyedge=winy+window.innerHeight;
  
      while(elt.offsetParent) {
	elt = elt.offsetParent;
	top += elt.offsetTop;
	left += elt.offsetLeft;}

      return ((top>winx) && (top<winyedge) && (top<winx+delta));}
    fdjtDOM.isAtTop=isAtTop;

    /* Getting various kinds of metadata */

    fdjtDOM.getMeta=function(name,multiple,matchcase){
      var results=[];
      var matchname=((matchcase)&&(name.toUpperCase()));
      var elts=document.getElementsByTagName("META");
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
      var elts=document.getElementsByTagName("LINK");
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

    fdjtDOM.cancel=function(evt){
      evt=evt||event;
      if (evt.preventDefault) evt.preventDefault();
      else evt.returnValue=false;
      evt.cancelBubble=true;};
    return fdjtDOM;
  })();

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
