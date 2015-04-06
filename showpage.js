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

fdjt.UI.showPage=(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtString=fdjt.String;
    var getStyle=fdjtDOM.getStyle;
    var getChild=fdjtDOM.getChild;
    var getChildren=fdjtDOM.getChildren;
    var dropClass=fdjtDOM.dropClass;
    var addClass=fdjtDOM.addClass;
    var hasClass=fdjtDOM.hasClass;
    var toArray=fdjtDOM.toArray;
    
    function oversize(dom){
        return dom.scrollHeight>dom.offsetHeight;}
    function showPage(dom,start,dir){
        var shown=toArray(getChildren(dom,".fdjtshow"));
        var curstart=getChild(dom,".fdjtstartofpage");
        var curend=getChild(dom,".fdjtendofpage");
        var info=getChild(dom,".fdjtpageinfo");
        var children=getNodes(dom), lim=children.length, startpos;
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
            start=getPageElt(dom,start);
            startpos=children.indexOf(start);}
        if ((!(start))||(startpos<0)||(startpos>=lim)||
            ((startpos===0)&&(dir<0)))
            return;
        addClass(dom,"fdjtpage"); addClass(dom,"formatting");
        if (!(info)) info=getProgressIndicator(dom,startpos,lim);
        // Clear old page
        if (shown.length) unshow(shown);
        if (curstart) dropClass(curstart,"fdjtstartofpage");
        if (curend) dropClass(curend,"fdjtendofpage");
        addClass(start,"fdjtshow");
        addClass(start,((dir<0)?("fdjtendofpage"):("fdjtstartofpage")));
        if (((dir<0)&&(hasClass(start,/fdjtpagebreak(auto)?/)))||
	    (oversize(dom))) {
            dropClass(dom,"formatting");
            return startpos;}
        var endpos=showpage(dom,children,startpos,dir);
        var end=children[endpos];
        if ((dir>0)&&(hasClass(end,"fdjtpagehead"))) {
            while ((endpos>startpos)&&(hasClass(end,"fdjtpagehead"))) {
                unshow(end); dropClass(end,caboose);
                endpos--; end=children[endpos];
                addClass(end,caboose);}}
        if ((dir>0)&&(hasClass(end,"fdjtpagekeep"))) {
            while ((endpos<startpos)&&(hasClass(end,"fdjtpagekeep"))) {
                unshow(end); dropClass(end,caboose);
                endpos++; end=children[endpos];
                addClass(end,caboose);}}
        if (startpos===0) addClass(dom,"fdjtfirstpage"); else dropClass(dom,"fdjtfirstpage");
        if (endpos>=lim) addClass(dom,"fdjtlastpage"); else dropClass(dom,"fdjtlastpage");
        var minpos=((startpos<=endpos)?(startpos):(endpos)), maxpos=((startpos>endpos)?(startpos):(endpos));
        info.innerHTML=(Math.floor((minpos/lim)*100)+"%");
        info.title=fdjtString("Items %d through %d of %d",minpos,maxpos,lim);
        addClass(dom,"newpage"); setTimeout(function(){dropClass(dom,"newpage");},1000);
        dropClass(dom,"formatting");
        return endpos;}

    function unshow(elts){
        if (elts.nodeType) elts=[elts];
        var i=0, lim=elts.length; while (i<lim) {
            var elt=elts[i++];
            if (hasClass(elt,"fdjtshow")) {
                dropClass(elt,"fdjtshow"); elt.style.display='';}}}
    function show(elt){
        addClass(elt,"fdjtshow");
        elt.style.display='block';}

    function getProgressIndicator(dom,startpos,lim){
        // This could include an input element for typing in a %
        var info=fdjtDOM("div.fdjtpageinfo",(startpos+1),"/",lim);
        dom.appendChild(info);
        return info;}

    function getPageElt(dom,node){
        var scan=node, parent=scan.parentNode;
        while ((parent)&&(parent!==dom)) {
            scan=parent; parent=scan.parentNode;}
        if (parent===dom) return scan;
        else return false;}

    function getNodes(dom){
        var children=[], nodes=dom.childNodes; addClass(dom,"getvisible");
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
		else addClass(node,"fdjtpagebreakauto");
		// We don't currently make these stylable
                if ((prev)&&(hasClass(prev,"fdjtpagekeep"))) 
		    addClass(node,"fdjtpagekeep");
                if ((prev)&&(hasClass(node,"fdjtpagekeep")))
                    addClass(prev,"fdjtpagehead");
                children.push(node);}}
        dropClass(dom,"getvisible");
        return children;}

    function showpage(dom,children,i,dir){
        var lim=children.length, scan=children[i+dir], last=children[i]; 
        var caboose=(dir<0)?("fdjtstartofpage"):("fdjtendofpage");
        i=i+dir; addClass(last,caboose); while ((i>=0)&&(i<lim)) {
            if ((dir>0)&&(hasClass(scan,/fdjtpagebreak(auto)?/)))
		return i-1;
            dropClass(last,caboose); show(scan); addClass(scan,caboose);
            if (oversize(dom)) {
                addClass(last,caboose);
                dropClass(scan,"fdjtshow");
                dropClass(scan,caboose);
                return i-1;}
            if ((dir<0)&&(hasClass(scan,/fdjtpagebreak(auto)?/))) return i;
            i=i+dir; last=scan; scan=children[i];}
        return i-1;}

    function forwardPage(dom){
        var foot=getChild(dom,".fdjtendofpage");
        if (!(foot)) return showPage(dom);
        if (hasClass(dom,"fdjtlastpage")) return false;
        else if (foot.nextSibling) 
            return showPage(dom,foot.nextSibling);
        else return false;}
    showPage.forward=forwardPage;

    function backwardPage(dom){
        var head=getChild(dom,".fdjtstartofpage");
        if (!(head)) return showPage(dom);
        if (hasClass(dom,"fdjtfirstpage")) return false;
        else if (head.previousSibling) 
            return showPage(dom,head.previousSibling,-1);
        else return false;}
    showPage.backward=backwardPage;

    function updatePage(dom){
        var head=getChild(dom,".fdjtstartofpage");
        if (!(head.hidden)) showPage(dom,head);
        else {
            var scan=head;
            while (scan) {
                if (scan.nodeType!==1) scan=scan.nextSibling;
                else if (!(scan.hidden)) return showPage(dom,scan);
                else scan=scan.nextSibling;}
            showPage(dom);}}
    showPage.update=updatePage;

    function showNode(dom,node){
        var parent=node.parentNode;
        while ((parent)&&(parent!==dom)) {
            node=parent; parent=node.parentNode;}
        if (!(parent)) return;
        else if (hasClass(node,"fdjtshown")) return false;
        else return showPage(dom,node);}
    showPage.showNode=showNode;

    return showPage;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "cd ..; make" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  js-indent-level: 2 ***
   ;;;  End: ***
*/
