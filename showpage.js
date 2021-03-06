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
  var fdjtUI=fdjt.UI;
  var fdjtDOM=fdjt.DOM;
  var fdjtLog=fdjt.Log;
  var fdjtString=fdjt.String;
  var getStyle=fdjtDOM.getStyle;
  var getChild=fdjtDOM.getChild;
  var getChildren=fdjtDOM.getChildren;
  var dropClass=fdjtDOM.dropClass;
  var addClass=fdjtDOM.addClass;
  var hasClass=fdjtDOM.hasClass;
  var addListener=fdjtDOM.addListener;
  var toArray=fdjtDOM.toArray;
  var getGeometry=fdjtDOM.getGeometry;
  var getParent=fdjtDOM.getParent;
  
  var cancelBubble=fdjtUI.cancelBubble;
  var cancel=fdjtUI.cancel;

  var adjustFonts=fdjtDOM.adjustFonts;

  function getContainer(arg){
    var container;
    if (typeof arg === "string")
      container=document.getElementById(arg);
    else if (arg.nodeType)
      container=arg;
    else if (fdjt.UI.T(arg))
      container=fdjt.UI.T(arg);
    else container=false;
    if (!(container)) fdjtLog.warn("Bad showPage container arg %s",arg);
    else container=fdjtDOM.getParent(container,".fdjtpage")||container;
    return container;}
    
  function istootall(container,height,padding){
    if (!(height)) height=container.offsetHeight;
    if (padding)
      return container.scrollHeight>(height-padding);
    else return container.scrollHeight>(height);}
  function isOversize(elt,w,h){
    if (typeof w === "undefined") w=true;
    if (typeof h === "undefined") h=true;
    return ((h)&&(elt.scrollHeight>elt.offsetHeight))||
      ((w)&&(elt.scrollWidth>elt.offsetWidth));}
  
  function showPage(container,start,dir){
    if (!(container=getContainer(container))) return;
    if (typeof dir !== "number") dir=1; else if (dir<0) dir=-1; else dir=1;
    var shown=toArray(getChildren(container,".fdjtshow"));
    var curstart=getChild(container,".fdjtstartofpage");
    var curend=getChild(container,".fdjtendofpage");
    var info=getChild(container,".fdjtpageinfo");
    var children=getNodes(container), lim=children.length, startpos;
    var caboose=(dir<0)?("fdjtstartofpage"):("fdjtendofpage");
    var padding=getGeometry(container,false,true).bottom_padding, h;
    var tap_event_name=((fdjt.device.touch)?("touchstart"):("click"));
    if (children.length===0) return;
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
    addClass(container,"fdjtpage"); 
    h=container.offsetHeight;
    addClass(container,"formatting");
    if (!(info)) info=getProgressIndicator(container,startpos,lim);
    // Clear old page
    if (shown.length) {
      dropClass(shown,"fdjtshow");
      dropClass(shown,"fdjtoversize");}
    if (curstart) dropClass(curstart,"fdjtstartofpage");
    if (curend) dropClass(curend,"fdjtendofpage");
    addClass(start,"fdjtshow");
    addClass(start,((dir<0)?("fdjtendofpage"):("fdjtstartofpage")));
    if (start.offsetHeight>h) addClass(start,"fdjtoversize");
    if (((dir<0)&&(hasClass(start,/fdjtpagebreak(auto)?/)))||
        (istootall(container,h,padding))) {
      dropClass(container,"formatting");
      return startpos;}
    var endpos=showchildren(container,children,startpos,dir,h,padding);
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
    var at_start=false, at_end=false;
    if (startpos===0) {
      addClass(container,"fdjtfirstpage");
      at_start=true;}
    else dropClass(container,"fdjtfirstpage");
    if (endpos>=(lim-1)) {
      addClass(container,"fdjtlastpage");
      at_end=true;}
    else dropClass(container,"fdjtlastpage");
    if ((dir<0)&&(endpos===0)) {
      dropClass(container,"formatting");
      return showPage(container,0,1);}
    var minpos=((startpos<=endpos)?(startpos):(endpos));
    var maxpos=((startpos>endpos)?(startpos):(endpos));
    var countdom=fdjtDOM("span.count",fdjtDOM("strong","/"),lim);
    var txtdom=fdjtDOM("span.value",Math.floor((minpos/lim)*100));
    var pctdom=fdjtDOM("span.pct",txtdom,"%",countdom);
    var forward_button=fdjtDOM("span.button.forward"," 》");
    var backward_button=fdjtDOM("span.button.backward","《 ");
    info.innerHTML="";
    fdjtDOM.append(info,backward_button,pctdom,forward_button);
    info.title=fdjtString("Items %d through %d of %d",minpos,maxpos,lim);
    txtdom.setAttribute("contentEditable","true");
    addListener(txtdom,"blur",pageInputBlur);
    addListener(txtdom,"keyup",cancelBubble);
    addListener(txtdom,"keypress",cancelBubble);
    addListener(txtdom,"keydown",pageInputKeydown);
    addListener(pctdom,tap_event_name,pageInputTapped);
    if (at_start) backward_button.innerHTML="· ";
    else addListener(backward_button,tap_event_name,backwardButton);
    if (at_end) forward_button.innerHTML="· ";
    else addListener(forward_button,tap_event_name,forwardButton);
    addClass(container,"fdjtpagechange"); setTimeout(
      function(){dropClass(container,"fdjtpagechange");},1000);
    dropClass(container,"formatting");
    return endpos;}

  function pageInputKeydown(evt){
    var target=fdjtUI.T(evt);
    var container=getParent(target,".fdjtpage");
    if (!(container)) return;
    var kc=evt.keyCode;
    if (!(target._savedHTML))
      target._savedHTML=target.innerHTML;
    // cancelBubble(evt);
    if (kc===13) {
      try {
        var s=fdjtDOM.textify(target);
        var pct=parseFloat(s)/100;
        if ((typeof pct === "number")&&(!(Number.isNaN(pct))))
          showPage(container,pct,1);
        else {
          target.innerHTML=target._savedHTML;
          target._savedHTML=false;}
        target.blur();}
      catch (ex) {
        if (target._savedHTML) {
          target.innerHTML=target._savedHTML;
          target._savedHTML=false;}
        target.blur();}
      cancel(evt);}
    else if (kc===27) {
      if (target._savedHTML) {
        target.innerHTML=target._savedHTML;
        target._savedHTML=false;}
      target.blur();
      cancel(evt);}
    else {}}

  function pageInputBlur(evt){
    var target=fdjtUI.T(evt);
    var info=getParent(target,".fdjtpageinfo");
    if (info) dropClass(info,"fdjteditpageinfo");
    if (target._savedHTML) {
      target.innerHTML=target._savedHTML;
      target._savedHTML=false;}}

  function pageInputTapped(evt){
    var target=fdjtUI.T(evt);
    var input=fdjtDOM.getChild(target,"span.value");
    var info=getParent(target,".fdjtpageinfo");
    if (info) addClass(info,"fdjteditpageinfo");
    if (input) input.focus();
    var selection=((window.getSelection)&&(window.getSelection()));
    if ((selection)&&(selection.anchorNode)&&
        (getParent(selection.anchorNode,input))) {
      var anchor=selection.anchorNode;
      if (anchor.nodeType===3) {
        selection.extend(anchor,anchor.nodeValue.length);}}
    cancel(evt);}

  function forwardButton(evt){
    fdjt.UI.cancel(evt);
    forwardPage(evt);}
  function backwardButton(evt){
    fdjt.UI.cancel(evt);
    backwardPage(evt);}

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
    var children=[], nodes=container.childNodes;
    addClass(container,"getvisible");
    var i=0, lim=nodes.length, prev=false;
    while (i<lim) {
      var node=nodes[i++];
      if (node.nodeType===1) {
        var style=getStyle(node);
        if (style.display==='none') continue;
        else if ((style.position)&&(style.position!=='static'))
          continue;
        if (style.pageBreakBefore==="always")
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

  function showchildren(container,children,i,dir,h,padding){
    var lim=children.length, scan=children[i+dir], last=children[i]; 
    var caboose=(dir<0)?("fdjtstartofpage"):("fdjtendofpage");
    i=i+dir; addClass(last,caboose); while ((i>=0)&&(i<lim)) {
      if ((dir>0)&&(hasClass(scan,/fdjtpagebreak(auto)?/)))
        return i-dir;
      dropClass(last,caboose);
      addClass(scan,"fdjtshow");
      addClass(scan,caboose);
      if (scan.offsetHeight>h) addClass(scan,"fdjtoversize");
      if (istootall(container,h,padding)) {
        addClass(last,caboose);
        dropClass(scan,"fdjtshow");
        scan.style.display='';
        dropClass(scan,caboose);
        return i-dir;}
      if ((dir<0)&&(hasClass(scan,/fdjtpagebreak(auto)?/))) return i;
      i=i+dir; last=scan; scan=children[i];}
    return i-dir;}

  function checkOversize(scan){
    var saved=scan.style.overflow||'';
    scan.style.overflow='auto';
    if (isOversize(scan)) {
      addClass(scan,"fdjtoversize");
      if (isOversize(scan)) {
        adjustFonts(scan);}}
    scan.style.overflow=saved;}
  showPage.isOversize=isOversize;
  showPage.checkOversize=checkOversize;

  function forwardPage(container){
    if (!(container=getContainer(container))) return;
    dropClass(container,"fdjtpagechange");
    var foot=getChild(container,".fdjtendofpage");
    if (!(foot)) return showPage(container);
    if (hasClass(container,"fdjtlastpage")) return false;
    else if (foot.nextSibling) 
      return showPage(container,foot.nextSibling);
    else return false;}
  showPage.forward=forwardPage;

  function fastForwardPage(container){
    if (!(container=getContainer(container))) return;
    var foot=getChild(container,".fdjtendofpage");
    if (!(foot)) return showPage(container);
    if (hasClass(container,"fdjtlastpage")) return false;
    else if (foot.nextSibling) {
      var children=getNodes(container);
      var off=children.indexOf(foot), len=children.length;
      var next_off=Math.floor(off+(len-off)/2);
      return showPage(container,children[next_off],1);}
    else return false;}
  showPage.fastForward=fastForwardPage;

  function backwardPage(container){
    if (!(container=getContainer(container))) return;
    dropClass(container,"fdjtpagechange");
    var head=getChild(container,".fdjtstartofpage");
    if (!(head)) return showPage(container);
    if (hasClass(container,"fdjtfirstpage")) return false;
    else if (head.previousSibling) {
      return showPage(container,head.previousSibling,-1);}
    else return false;}
  showPage.backward=backwardPage;

  function fastBackwardPage(container){
    if (!(container=getContainer(container))) return;
    var head=getChild(container,".fdjtstartofpage");
    if (!(head)) return showPage(container);
    if (hasClass(container,"fdjtfirstpage")) return false;
    else if (head.previousSibling) {
      var children=getNodes(container);
      var off=children.indexOf(head);
      var next_off=Math.floor(off/2);
      return showPage(container,children[next_off],-1);}
    else return false;}
  showPage.fastBackward=fastBackwardPage;

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
    else if ((container.offsetHeight)&&(hasClass(container,"needsresize"))) {
      dropClass(container,"needsresize");
      updatePage(container);}
    else return;}
  showPage.check=checkPage;

  function showNode(container,node){
    if (!(container=getContainer(container))) return;
    if (!(hasClass(container,"fdjtpage"))) {
      if (container.offsetHeight) showPage(container);
      else return false;}
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
