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
	  var hashpos=spec.indexOf('#');
	  var dotpos=spec.indexOf('.');
	  var tagend=((hashpos<0)?(dotpos):
		      (dotpos<0)?(hashpos):
		      (dotpos<hashpos)?(dotpos):(hashpos));
	  if (tagend<0)
	    node=document.createElement(spec);
	  else node=document.createElement(spec.slice(0,tagend));
	  if (hashpos>=0)
	    if ((dotpos)&&(dotpos>hashpos)) {
	      node.id=spec.slice(hashpos+1,dotpos);
	      spec=spec.slice(0,hashpos)+spec.slice(dotpos);}
	    else {
	      node.id=spec.slice(hashpos+1);
	      spec=spec.slice(0,hashpos);}
	  dotpos=spec.indexOf('.');
	  if (dotpos>=0)
	    node.className=spec.slice(dotpos+1).replace('.',' ');
	  else node.className=spec.replace('.',' ');}
      else {
	node=document.createElement(attrib.tagName);
	for (attrib in spec) {
	  if (attrib==="tagName") {}
	  else node.setAttribute(attrib,spec[attrib]);}}
      domappend(node,arguments,1);
      return node;}

    fdjtDOM.revid="$Id$";
    fdjtDOM.version=parseInt("$Revision$".slice(10,-1));

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

    function flatten(string){return string.replace(/\s+/," ");};

    function textify(arg,flat,inside){
      if (arg.text) return arg.text;
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

    fdjtDOM.getQuery=function(name,multiple,matchcase){
      if (!(location.search))
	if (multiple) return [];
	else return false;
      var results=[];
      var namepat=new RegExp("(&|^|\\?)"+name+"(=|&|$)",((matchcase)?"g":"gi"));
      var query=location.search;
      var start=query.search(namepat);
      while (start>=0) {
	// Skip over separator if non-initial
	if ((query[start]==='?')||(query[start]==='&')) start++;
	// Skip over the name
	var valstart=start+name.length; var end=false;
	if (query[valstart]==="=") {
	  var valstring=query.slice(valstart+1);
	  end=valstring.search(/(&|$)/g);
	  if (end<=0)
	    if (multiple) {
	      results.push(query.slice(start,valstart));
	      return results;}
	    else return query.slice(start,valstart);
	  else if (multiple)
	    results.push(valstring.slice(0,end));
	  else return valstring.slice(0,end);}
	else if (multiple)
	  results.push(query.slice(start,end));
	else return query.slice(start,end);
	if (end>0) {
	  query=query.slice(end);
	  start=query.search(namepat);}}
      if (multiple) return results; else return false;};

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
