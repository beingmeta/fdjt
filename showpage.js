/* -*- Mode: Javascript; Character-encoding: utf-8; -*- */

/* ######################### fdjt/showpage.js ###################### */

/* Copyright (C) 2009-2015 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   It provides for simple and fast paginated display

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

   Use, modification, and redistribution of this program is permitted
   under either the GNU General Public License (GPL) Version 2 (or any
   later version) or under the GNU Lesser General Public License
   (version 3 or later).

   These licenses may be found at www.gnu.org, particularly:
   http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
   http://www.gnu.org/licenses/lgpl-3.0-standalone.html

   Use and redistribution (especially embedding in other CC licensed
   content) is also permitted under the terms of the Creative Commons
   "Attribution-NonCommercial" license:

   http://creativecommons.org/licenses/by-nc/3.0/ 

   Other uses may be allowed based on prior agreement with
   beingmeta, inc.  Inquiries can be addressed to:

   licensing@beingmeta.com

   Enjoy!

*/
/* jshint browser: true */

fdjt.showPage=fdjt.UI.showPage=(function(){
  "use strict";
  var fdjtDOM=fdjt.DOM;
  var fdjtLog=fdjt.Log;
  var fdjtString=fdjt.String;
  var getStyle=fdjtDOM.getStyle;
  var getChild=fdjtDOM.getChild;
  var getChildren=fdjtDOM.getChildren;
  var dropClass=fdjtDOM.dropClass;
  var addClass=fdjtDOM.addClass;
  var hasClass=fdjtDOM.hasClass;
  var toArray=fdjtDOM.toArray;
  
  function getContainer(arg){
    var container;
    if (typeof arg === "string")
      container=document.getElementById(arg);
    else if (arg.nodeType)
      container=arg;
    else container=false;
    if (!(container)) fdjtLog.warn("Bad showPage container arg %s",arg);
    return container;}
    
  function isoversize(container){
    return container.scrollHeight>container.offsetHeight;}
  function showPage(container,start,dir){
    if (!(container=getContainer(container))) return;
    var shown=toArray(getChildren(container,".fdjtshow"));
    var curstart=getChild(container,".fdjtstartofpage");
    var curend=getChild(container,".fdjtendofpage");
    var info=getChild(container,".fdjtpageinfo");
    var children=getNodes(container), lim=children.length, startpos;
    var caboose=(dir<0)?("fdjtstartofpage"):("fdjtendofpage");
    if (children.length===0) return;
    if (typeof dir !== "number") dir=1; else if (dir<0) dir=-1; else dir=1;
    if (!(start)) {
      startpos=0; start=children[0];}
    else if ((typeof start === "number")&&(start>0)&&(start<1)) {
      startpos=Math.round(start*children.length);
      start=children[startpos];}
    else if (typeof start === "number") {
      startpos=start-1; start=children[startpos];}
    else if (start.nodeType) {
      start=getPageElt(container,start);
      startpos=children.indexOf(start);}
    if ((!(start))||(startpos<0)||(startpos>=lim)||
        ((startpos===0)&&(dir<0)))
      return;
    addClass(container,"fdjtpage"); addClass(container,"formatting");
    if (!(info)) info=getProgressIndicator(container,startpos,lim);
    // Clear old page
    if (shown.length) dropClass(shown,"fdjtshow");
    if (curstart) dropClass(curstart,"fdjtstartofpage");
    if (curend) dropClass(curend,"fdjtendofpage");
    addClass(start,"fdjtshow");
    addClass(start,((dir<0)?("fdjtendofpage"):("fdjtstartofpage")));
    if (((dir<0)&&(hasClass(start,/fdjtpagebreak(auto)?/)))||
	(isoversize(container))) {
      dropClass(container,"formatting");
      return startpos;}
    var endpos=showpage(container,children,startpos,dir);
    var end=children[endpos];
    if ((dir>0)&&(hasClass(end,"fdjtpagehead"))) {
      while ((endpos>startpos)&&(hasClass(end,"fdjtpagehead"))) {
        dropClass(end,"fdjtshow"); dropClass(end,caboose);
        endpos--; end=children[endpos];
        addClass(end,caboose);}}
    if ((dir>0)&&(hasClass(end,"fdjtpagekeep"))) {
      while ((endpos<startpos)&&(hasClass(end,"fdjtpagekeep"))) {
        dropClass(end,"fdjtshow"); dropClass(end,caboose);
        endpos++; end=children[endpos];
        addClass(end,caboose);}}
    if (startpos===0) addClass(container,"fdjtfirstpage");
    else dropClass(container,"fdjtfirstpage");
    if (endpos>=lim) addClass(container,"fdjtlastpage");
    else dropClass(container,"fdjtlastpage");
    var minpos=((startpos<=endpos)?(startpos):(endpos));
    var maxpos=((startpos>endpos)?(startpos):(endpos));
    info.innerHTML=Math.floor((minpos/lim)*100)+"%"+
      "<span class='count'>("+lim+")</span>";
    info.title=fdjtString("Items %d through %d of %d",minpos,maxpos,lim);
    addClass(container,"newpage"); setTimeout(
      function(){dropClass(container,"newpage");},1000);
    dropClass(container,"formatting");
    return endpos;}

  function getProgressIndicator(container,startpos,lim){
    // This could include an input element for typing in a %
    var info=fdjtDOM("div.fdjtpageinfo",(startpos+1),"/",lim);
    container.appendChild(info);
    return info;}

  function getPageElt(container,node){
    var scan=node, parent=scan.parentNode;
    while ((parent)&&(parent!==container)) {
      scan=parent; parent=scan.parentNode;}
    if (parent===container) return scan;
    else return false;}

  function getNodes(container){
    var children=[], nodes=container.childNodes; addClass(container,"getvisible");
    var i=0, lim=nodes.length, prev=false;
    while (i<lim) {
      var node=nodes[i++];
      if (node.nodeType===1) {
        var style=getStyle(node);
        if (style.display==='none') continue;
        else if ((style.position)&&(style.position!=='static'))
          continue;
	if (style.pageBreakBefore==="force")
	  addClass(node,"fdjtpagebreakauto");
	else dropClass(node,"fdjtpagebreakauto");
	// We don't currently make these stylable
        if ((prev)&&(hasClass(prev,"fdjtpagekeep"))) 
	  addClass(node,"fdjtpagekeep");
        if ((prev)&&(hasClass(node,"fdjtpagekeep")))
          addClass(prev,"fdjtpagehead");
        children.push(node);}}
    dropClass(container,"getvisible");
    return children;}

  function showpage(container,children,i,dir){
    var lim=children.length, scan=children[i+dir], last=children[i]; 
    var caboose=(dir<0)?("fdjtstartofpage"):("fdjtendofpage");
    i=i+dir; addClass(last,caboose); while ((i>=0)&&(i<lim)) {
      if ((dir>0)&&(hasClass(scan,/fdjtpagebreak(auto)?/)))
	return i-dir;
      dropClass(last,caboose); addClass(scan,"fdjtshow"); addClass(scan,caboose);
      if (isoversize(container)) {
        addClass(last,caboose);
        dropClass(scan,"fdjtshow");
        scan.style.display='';
        dropClass(scan,caboose);
        return i-dir;}
      if ((dir<0)&&(hasClass(scan,/fdjtpagebreak(auto)?/))) return i;
      i=i+dir; last=scan; scan=children[i];}
    return i-dir;}

  function forwardPage(container){
    if (!(container=getContainer(container))) return;
    var foot=getChild(container,".fdjtendofpage");
    if (!(foot)) return showPage(container);
    if (hasClass(container,"fdjtlastpage")) return false;
    else if (foot.nextSibling) 
      return showPage(container,foot.nextSibling);
    else return false;}
  showPage.forward=forwardPage;

  function backwardPage(container){
    if (!(container=getContainer(container))) return;
    var head=getChild(container,".fdjtstartofpage");
    if (!(head)) return showPage(container);
    if (hasClass(container,"fdjtfirstpage")) return false;
    else if (head.previousSibling) 
      return showPage(container,head.previousSibling,-1);
    else return false;}
  showPage.backward=backwardPage;

  function updatePage(container){
    if (!(container=getContainer(container))) return;
    var head=getChild(container,".fdjtstartofpage");
    if (!(head.hidden)) showPage(container,head);
    else {
      var scan=head;
      while (scan) {
        if (scan.nodeType!==1) scan=scan.nextSibling;
        else if (!(scan.hidden)) return showPage(container,scan);
        else scan=scan.nextSibling;}
      showPage(container);}}
  showPage.update=updatePage;

  function checkPage(container){
    if (!(container=getContainer(container))) return;
    if (!(hasClass(container,"fdjtpage"))) {
      if (container.offsetHeight) showPage(container);}
    else if ((container.offsetHeight)&&(!(hasClass(container,"needsresize")))) {
      dropClass(container,"needsresize");
      updatePage(container);}
    else return;}
  showPage.check=checkPage;

  function showNode(container,node){
    if (!(container=getContainer(container))) return;
    var parent=node.parentNode;
    while ((parent)&&(parent!==container)) {
      node=parent; parent=node.parentNode;}
    if (!(parent)) return;
    else if (hasClass(node,"fdjtshown")) return false;
    else return showPage(container,node);}
  showPage.showNode=showNode;

  return showPage;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "cd ..; make" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  js-indent-level: 2 ***
   ;;;  End: ***
*/
