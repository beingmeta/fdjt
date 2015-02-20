/* -*- Mode: Javascript; Character-encoding: utf-8; -*- */

/* ######################### fdjt/codexlayout.js ###################### */

/* Copyright (C) 2009-2015 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   It implements a method for breaking narrative HTML content
   across multiple pages, attempting to honor page break constraints,
   etc.

   Check out the 'mini manual' at the bottom of the file or read the
   code itself.

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

// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));

fdjt.CodexLayout=
    (function(){
        "use strict";
        /* globals Promise: false */

        var fdjtDOM=fdjt.DOM;
        var fdjtLog=fdjt.Log;
        var fdjtAsync=fdjt.Async;
        var fdjtTime=fdjt.Time;
        var fdjtState=fdjt.State;
        var fdjtID=fdjt.ID;

        var hasContent=fdjtDOM.hasContent;
        var hasParent=fdjtDOM.hasParent;
        var getParent=fdjtDOM.getParent;
        var getStyle=fdjtDOM.getStyle;
        var parsePX=fdjtDOM.parsePX;
        var hasClass=fdjtDOM.hasClass;
        var addClass=fdjtDOM.addClass;
        var dropClass=fdjtDOM.dropClass;
        var toArray=fdjtDOM.toArray;
        var getElementValue=fdjtDOM.getElementValue;
        
        var setLocal=fdjtState.setLocal, pushLocal=fdjtState.pushLocal;
        var dropLocal=fdjtState.dropLocal, removeLocal=fdjtState.removeLocal;

        var floor=Math.floor;

        var layoutDB;

        function appendChildren(node,children,start,end){
            var lim=end||children.length; var i=(start)||0;
            var frag=document.createDocumentFragment();
            while (i<lim) {
                var child=children[i++];
                if (!(child)) i++;
                else if ((child.nodeType===3)&&
                         (child.nodeValue.length===0)) {}
                else frag.appendChild(child);}
            node.appendChild(frag);}

        function getGeom(elt,root,extra){
            var top = elt.offsetTop;
            var left = elt.offsetLeft;
            var width=elt.offsetWidth;
            var height=elt.offsetHeight;
            var rootp=((root)&&(root.offsetParent));
            var style=((extra)&&(getStyle(elt)));

            if (elt===root) 
                return {left: 0,top: 0,width:width,height: height};
            elt=elt.offsetParent;
            while (elt) {
                if ((root)&&((elt===root)||(elt===rootp))) break;
                top += elt.offsetTop;
                left += elt.offsetLeft;
                elt=elt.offsetParent;}
            
            if (extra) {
                var t_margin=parsePX(style.marginTop);
                var r_margin=parsePX(style.marginRight);
                var b_margin=parsePX(style.marginBottom);
                var l_margin=parsePX(style.marginLeft);
                var t_padding=parsePX(style.paddingTop);
                var r_padding=parsePX(style.paddingRight);
                var b_padding=parsePX(style.paddingBottom);
                var l_padding=parsePX(style.paddingLeft);
                var t_border=parsePX(style.borderTopWidth);
                var r_border=parsePX(style.borderRightWidth);
                var b_border=parsePX(style.borderBottomWidth);
                var l_border=parsePX(style.borderLeftWidth);
                var outer_width=width+l_margin+r_margin;
                var outer_height=height+t_margin+b_margin;
                var inner_width=width-(l_border+l_padding+r_border+r_padding);
                var inner_height=height-(t_border+t_padding+b_border+b_padding);
                var lh=style.lineHeight, fs=style.fontSize, lhpx=false;
                if (lh==="normal") lhpx=parsePX(fs);
                else if (lh.search(/px$/)>0) lhpx=parsePX(lh);
                else if (lh.search(/%$/)>0) 
                    lhpx=(parseFloat(lh.slice(0,-1))/100)*(parsePX(fs));
                else lhpx=parsePX(fs);
                return {left: left, top: top, width: width,height: height,
                        right:left+width,bottom:top+height,
                        top_margin: t_margin, bottom_margin: b_margin,
                        left_margin: l_margin, right_margin: r_margin,
                        outer_height: outer_height,outer_width: outer_width,
                        inner_height: inner_height,inner_width: inner_width,
                        line_height: lhpx};}
            else return {left: left, top: top, width: width,height: height,
                         right:left+width,bottom:top+height};}

        var getChildren=fdjtDOM.getChildren;
        var getChild=fdjtDOM.getChild;

        /* Node testing */

        var notspace=/[^ \n\r\t\f\x0b\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u202f\u205f\u3000\uf3ff]/g;
     
        function isEmpty(string){
            if (typeof string === "string")  {
                var pt;
                if (string.length===0) return true;
                else pt=string.search(notspace);
                if (pt<0) return true;
                else if (string[pt]!=='&') return false;
                else {
                    string=string.replace(/&nbsp;/g,"\u00a0");
                    pt=string.search(notspace);
                    return (pt<0);}}
            else return false;}

        function inFlow(node){
            var style=getStyle(node);
            if ((style.display!=='none')&&
                ((style.position==='static')||
                 (style.position==='')))
                return node;
            else return false;}
        
        function optimizeLayoutRule(rule){
            if (!(rule)) return rule;
            else if (typeof rule === "string") {
                if ((rule[0]===".")&&
                    (rule.slice(1).search(/\.|#|\[/)<0)) 
                    return new RegExp("\\b"+rule.slice(1)+"\\b");
                else return new fdjtDOM.Selector(rule);}
            else if (rule instanceof RegExp) return rule;
            else if (rule.match) return rule;
            else if (rule.length) {
                var newrules=[]; var firstrules=[];
                var classes=[]; var selectors=[];
                var i=0, lim=rule.length;
                while (i<lim) {
                    var r=rule[i++];
                    if (typeof r !== "string") newrules.push(r);
                    else if (r[0]===".") {
                        if (r.slice(1).search(/\.|#|\[/)>=0)
                            // complex selector (not just a classname)
                            selectors.push(r);
                        else classes.push(r.slice(1));}
                    else if ((r[0]==="#")||(r[0]==="["))
                        selectors.push(r);
                    else classes.push(r);}
                if (classes.length)
                    firstrules.push(new RegExp("\\b("+classes.join("|")+")\\b"));
                if (selectors.length)
                    firstrules.push(new fdjtDOM.Selector(selectors.join(", ")));
                return firstrules.concat(newrules);}
            else return rule;}

        function testNode(node,test) {
            var tests;
            if (!(test)) return true;
            if (typeof test === 'string') tests=[test];
            else if (test instanceof Array) tests=test;
            else tests=[test];
            var i=0; var lim=tests.length;
            while (i<lim) {
                var atest=tests[i++];
                if (node===test) return true;
                else if (atest instanceof RegExp) {
                    if (!(node.className)) continue;
                    if (!(node.className.search)) continue;
                    // Handle inadvertant use of selector syntax
                    if (node.className.search(atest)>=0) return true;}
                else if (typeof atest === 'string') {
                    if (!(node.className)) continue;
                    if (!(node.className.search)) continue;
                    // Handle inadvertant use of selector syntax
                    if (atest[0]==='.') atest=atest.slice(1);
                    var classrx=new RegExp("\\b"+atest+"\\b");
                    if (node.className.search(classrx)>=0) return true;}
                else if ((atest.match)&&(atest.match(node)))
                    // This should get most versions of CSS selectors
                    return true;
                else {}}
            return false;}

        /* Scaling elements and nodes */

        var adjustFontSize=fdjt.DOM.adjustFontSize;
        var adjustFonts=fdjt.DOM.adjustFonts;
        var tweakImage=fdjt.DOM.tweakImage;

        function scaleToPage(elt,width,height,leavefont){
            if (typeof elt === "string") elt=fdjtID(elt);
            if ((!(elt))||(elt.length===0)) return;
            else if (elt.nodeType) {
                if (elt.nodeType!==1) return;
                if ((hasClass(elt,"_pagescaled"))||(elt.getAttribute("style")))
                    return;
                var ps=elt.getAttribute("data-pagescale")||
                    elt.getAttribute("pagescale")||
                    getElementValue(elt,"xdatapagescale");
                var psw=1, psh=1;
                var style=elt.style;
                var cstyle=getStyle(elt);
                // If it has an individual transform, don't mess it up
                if ((style[fdjtDOM.transform])&&
                    (style[fdjtDOM.transform]!=="none")&&
                    (style[fdjtDOM.transform]!==""))
                    return;
                if (ps) {
                    var psv=ps.split(/ |,|x/g);
                    if (psv.length===2) {
                        psw=parseScale(psv[0]);
                        psh=parseScale(psv[1]);}
                    else psh=psw=parseScale(psv[0]);}
                // Target width and height
                var tw=width*psw, th=height*psh;
                var w=elt.offsetWidth, h=elt.offsetHeight;
                // Scale factors for width and height
                var sw=tw/w, sh=th/h;
                if (elt.tagName==="IMG") {
                    style.maxHeight=style.minHeight="inherit";
                    style.maxWidth=style.minWidth="inherit";
                    // Get width and height again, with the constraints off
                    //  This means that pagescaling trumps CSS constraints,
                    //  but we'll accept that for now
                    w=elt.offsetWidth; h=elt.offsetHeight; sw=tw/w; sh=th/h;
                    if (sw<sh) {
                        style.width=Math.round(w*sw)+"px";
                        style.height="auto";}
                    else {
                        style.height=Math.round(h*sh)+"px";
                        style.width="auto";}}
                else if (leavefont) {
                    var wrapper=((cstyle.display==="inline")?
                                 (fdjtDOM("span.codexscalewrapper")):
                                 (fdjtDOM("div.codexscalewrapper")));
                    if (cstyle.display==="inline") {
                        style.display="inline-block";
                        wrapper.display="inline-block";}
                    wrapper.style.width=tw+"px"; wrapper.style.height=th+"px";
                    elt.style[fdjtDOM.transform]="scale("+sw+","+sh+")";
                    elt.style[fdjtDOM.transformOrigin]=
                        ((cstyle.textAlign==="left")?("top left"):
                         (cstyle.textAlign==="right")?("top right"):
                         ("top center"));
                     elt.parentNode.replaceChild(wrapper,elt);}
                else {
                    adjustFontSize(elt);
                    if (cstyle.display==="inline")
                        style.display="inline-block";
                    style.width=tw+"px"; style.height=th+"px";}
                addClass(elt,"_pagescaled");}
            else if (elt.length) {
                var i=0, lim=elt.length;
                while (i<lim) scaleToPage(
                    elt[i++],width,height,leavefont||false);}
            else {}}

        function parseScale(s){
            if (s.search(/%$/g)>0) {
                var pct=parseFloat(s.slice(0,s.length-1));
                return pct/100;}
            else return parseFloat(s);}

        function atPageTop(node,page,body){
            if (!(body)) body=document.body;
            var scan=node; while (scan) {
                if (scan===page) return true;
                else if (scan===body) return false;
                else if (!(scan.previousSibling)) scan=scan.parentNode;
                else if ((scan.previousSibling.nodeType===3)&&
                         (isEmpty(scan.previousSibling.nodeValue)))
                    scan=scan.previousSibling;
                else if ((scan.previousSibling.nodeType===1)&&
                         (!(inFlow(scan.previousSibling))))
                    scan=scan.previousSibling;
                else break;}
            return ((scan.nodeType===1)&&
                    (scan.className)&&(scan.className.search)&&
                    (scan.className.search(/\bcodexpage\b/g)>=0));}

        /* Duplicating nodes */

        var tmpid_count=1;

        // This recreates a node and it's DOM context (containers) on
        //  a new page, calling itself recursively as needed
        function dupContext(node,page,dups,crumbs){
            if ((node===document.body)||(node.id==="CODEXCONTENT")||
                (hasClass(node,"codexroot"))||(hasClass(node,"codexpage")))
                return false;
            else if (hasParent(node,page)) return node;
            else if ((node.className)&&(node.className.search)&&
                     (node.className.search(/\bcodexwraptext\b/)>=0))
                // We don't bother duplicating text wrapping convenience
                //  classes
                return dupContext(node.parentNode,page,dups,crumbs);
            // Now we actually duplicate it.  
            var id=node.id, baseid=node.getAttribute("data-baseid");
            if (!(id)) id=baseid;
            var duplist=dups[id];
            var last_dup=((duplist)&&(duplist.length)&&
                          (duplist[duplist.length-1]));
            // If it doesn't have an ID, we give it one, because we'll want
            //  to refer to it later while wanting to avoid DOM cycles
            if (!(id)) id=node.id="CODEXTMPID"+(tmpid_count++);
            else if (duplist) {
                // See if it's already been duplicated
                var d=duplist.length-1;
                while (d>=0) {
                    if (hasParent(duplist[d],page)) return duplist[d];
                    else d--;}}
            // Duplicate it's parent
            var copy=node.cloneNode(false);
            var parent=dupContext(node.parentNode,page,dups,crumbs);
            var nodeclass=((node.className)&&(node.className.search)&&
                           (node.className))||"";
            var lastclass=((last_dup)&&(last_dup.className)&&
                           (last_dup.className.search)&&
                           (last_dup.className));
            if (baseid) copy.codexbaseid=baseid;
            // Jigger the class name
            if (nodeclass.search(/\bcodexdupend\b/g)>=0) {
                node.className=nodeclass.replace(/\bcodexdupend\b/g,"codexdup");
                stripBottomStyles(node,true);}
            else if (nodeclass.search(/\bcodexdupstart\b/g)<0) {
                node.className=nodeclass+" codexdupstart";
                stripBottomStyles(node,true);
                stripTopStyles(copy,true);
                copy.className=nodeclass.replace(/\bcodexrelocated\b/g,"")+
                    " codexdupend";}
            else {}
            if ((lastclass)&&
                (lastclass.search(/\bcodexdupend\b/g)>=0)) {
                last_dup.className=lastclass.replace(
                        /\bcodexdupend\b/g,"codexdup");
                stripBottomStyles(last_dup,true);}
            // if (copy.getAttribute("style")) 
            // If the original had an ID, save it in various ways
            if (id) {
                copy.codexbaseid=id;
                copy.setAttribute("data-baseid",id);
                copy.removeAttribute("id");}
            // Record the copy you've made (to avoid recreation)
            if (duplist) duplist.push(copy);
            else dups[id]=[copy];
            // If it's got a copied context, append it to the context;
            //   otherwise, just append it to the page
            if (parent) parent.appendChild(copy);
            else page.appendChild(copy);
            return copy;}

        function stripBottomStyles(node,keep){
            var style=node.style;
            if ((keep)&&(!(node.hasAttribute("data-savedstyle")))) 
                node.setAttribute("data-savedstyle",style.cssText);
            style.paddingBottom="0px";
            style.borderBottomWidth="0px";
            style.marginBottom="0px";}
        function stripTopStyles(node,keep){
            var style=node.style;
            if ((keep)&&(!(node.hasAttribute("data-savedstyle"))))
                node.setAttribute("data-savedstyle",style.cssText);
            style.textIndent="0px";
            style.paddingTop="0px";
            style.borderTopWidth="0px";
            style.marginTop="0px";}

        /* Moving nodes */

        function getFirstContent(node){
            var child=node.firstChild;
            while (child) {
                if (((child.nodeType===3)&&(!(isEmpty(child.nodeValue))))||
                    ((child.nodeType===1)&&(inFlow(child))))
                    return child;
                else child=child.nextSibling;}
            return false;}
        
        // This moves a node into another container, leaving
        // a back pointer for restoration
        function moveNode(arg,into,blockp,crumbs){
            var baseclass; var node=arg, weird=false;
            if (hasParent(node,into)) return node;
            if (node.nodeType===1) {
                baseclass=node.className;
                if ((baseclass)&&(typeof baseclass !== "string"))
                    weird=true;}
            else if (node.nodeType===3) {
                if (node.nodeValue.search(/\w/g)>=0) {
                    // Wrap non-empty text nodes in elements before
                    // moving
                    var wrapnode=fdjtDOM(
                        ((blockp)?"div.codexwraptext":"span.codexwraptext"));
                    if (node.parentNode)
                        node.parentNode.replaceChild(wrapnode,node);
                    wrapnode.appendChild(node);
                    baseclass="codexwraptext";
                    node=wrapnode;}
                else node=node.cloneNode(true);}
            else {}
            if (weird) {}
            else if ((node.nodeType===1)&&(hasClass(node,"codextextsplit"))) {}
            else if ((node.parentNode)&&((!(node.id))||(!(crumbs[node.id])))) {
                // If the node has a parent and hasn't been moved before,
                //  we leave a "crumb" (a placeholder) in the original
                //  location.
                if (!(node.id)) node.id="CODEXTMPID"+(tmpid_count++);
                // Record origin information; we'll use this to revert
                //  the layout if we need to (for example, before
                //  laying out again under different constraints)
                var crumb=document.createTextNode("");
                crumbs[node.id]=crumb;
                if (baseclass) node.className=baseclass+" codexrelocated";
                else node.className="codexrelocated";
                node.parentNode.replaceChild(crumb,node);}
            if (into) {
                var dragged=[], scan=node.nextSibling;
                while (scan) {
                    if ((scan.nodeType===1)&&
                        (typeof scan.className === "string")&&
                        (scan.className.search(/\bcodexblock\b/g)>=0))
                        break;
                    dragged.push(scan);
                    scan=scan.nextSibling;}
                into.appendChild(node);
                if (dragged.length) {
                    var d=0, ndrags=dragged.length;
                    while (d<ndrags) into.appendChild(dragged[d++]);}}
            return node;}
        
        function markPageTop(node,force){
            if ((!force)&&(hasClass(node,"codexpagetop"))) return;
            var nodestyle=node.getAttribute("style")||"";
            var newstyle=nodestyle+((nodestyle)?("; "):(""))+
                "margin-top: 0px !important;";
            if (!(node.hasAttribute("data-savedstyle")))
                node.setAttribute("data-savedstyle",nodestyle);
            node.setAttribute("style",newstyle);
            addClass(node,"codexpagetop");
            if (node.childNodes) {
                var children=node.childNodes, i=0, lim=children.length;
                while (i<lim) {
                    var child=children[i++];
                    if (child.nodeType===1) {
                        var style=getStyle(child);
                        if ((style.position!=='static')&&(style.position!=='')) {}
                        else if ((child.classname)&&
                                 (child.className.search(/\bfdjtskiptext\b/g)>=0)) {}
                        else return markPageTop(child);}
                    else if (child.nodeType===3) {
                        if (!(isEmpty(child.nodeValue))) return;}
                    else {}}}}

        // This moves a node onto a page, recreating (as far as
        // possible) its original DOM context on the new page.
        function moveNodeToPage(node,page,dups,crumbs){
            if (hasParent(node,page)) {
                if ((node.nodeType===1)&&(!(hasContent(page,true,false,node))))
                    markPageTop(node);
                return node;}
            else {
                var move=node, parent=move.parentNode;
                // If we're moving a first child, we might as well
                // move the parent
                while ((parent)&&
                       (parent!==document.body)&&
                       (parent.id!=="CODEXCONTENT")&&
                       (!(hasClass(parent,"codexroot")))&&
                       (!(hasClass(parent,"codexpage")))&&
                       (move===getFirstContent(parent))) {
                    move=parent; parent=move.parentNode;}
                if ((!(parent))||(parent===document.body)||
                    (parent.id==="CODEXCONTENT")||
                    (hasClass(parent,"codexroot"))||
                    (hasClass(parent,"codexpage"))) {
                    // If the node isn't on a page or is at top level of a
                    // page, the parent doesn't need to be duplicated to
                    // move the child.  However, the motion might modify
                    // the moved node (for example, cloning it).
                    if (move===node)
                        node=move=moveNode(node,page,false,crumbs);
                    else move=moveNode(move,page,false,crumbs);}
                else {
                    // Otherwise duplicate the parent and move the child
                    var dup_parent=dupContext(parent,page,dups,crumbs);
                    if (move===node)                    
                        node=move=moveNode(node,dup_parent||page,false,crumbs);
                    else move=moveNode(move,dup_parent||page,false,crumbs);}
                if ((node)&&(node.nodeType===1)&&
                    (!hasContent(page,true,false,move)))
                    markPageTop(move);
                return node;}}

        // Reverting layout

        function restoreNode(node,info,crumbs){
            var id=node.id;
            if (!(id)) return;
            var origin=crumbs[id];
            if (origin) {
                var parent=origin.parentNode;
                if (hasClass(node,/\bcodexwraptext\b/g)) 
                    parent.replaceChild(node.childNodes[0],origin);
                else origin.parentNode.replaceChild(node,origin);}
            dropClass(node,"codexrelocated");}
        
        function revertLayout(layout) {
            var crumbs=layout.crumbs; var now=fdjtTime(), i=0, lim;
            if ((layout.reverting)&&((now-layout.reverting)<10000)) return;
            else layout.reverting=now;
            var textsplits=layout.textsplits;
            var node;
            var pagescaled=toArray(
                layout.container.getElementsByClassName("_pagescaled"));
            i=0; lim=pagescaled.length; while (i<lim) {
                var elt=pagescaled[i++];
                var wrapper=getParent(elt,".codexscalewrapper");
                var saved=elt.getAttribute("data-savedstyle");
                dropClass(elt,"_pagescaled");
                if (saved) elt.setAttribute("style",saved);
                else elt.setAttribute("style","");
                if (wrapper) wrapper.parentNode.replaceChild(elt,wrapper);}
            var cantsplit=toArray(
                layout.container.getElementsByClassName("codexcantsplit"));
            dropClass(cantsplit,"codexcantsplit");
            var split=toArray(
                layout.container.getElementsByClassName("codexsplitstart"));
            i=0; lim=split.length; while (i<lim) {
                node=split[i++];
                var nodeid=node.id;
                var text=textsplits[nodeid];
                node.parentNode.replaceChild(text,node);}
            var shards=toArray(
                layout.container.getElementsByClassName("codextextsplit"));
            i=0; lim=shards.length; while (i<lim) {
                node=shards[i++];
                node.parentNode.removeChild(node);}
            var ragged=toArray(
                layout.container.getElementsByClassName("codexraggedsplit"));
            dropClass(ragged,"codexraggedsplit");
            var leading=toArray(
                layout.container.getElementsByClassName("codexdupleading"));
            if ((leading)&&(leading.length)) fdjtDOM.remove(leading);
            var moved=toArray(
                layout.container.getElementsByClassName("codexrelocated"));
            var dupstarts=toArray(layout.container.getElementsByClassName(
                "codexdupstart"));
            var dupends=toArray(layout.container.getElementsByClassName(
                "codexdupend"));
            var dupmiddle=toArray(layout.container.getElementsByClassName(
                "codexdup"));
            var pagetops=toArray(layout.container.getElementsByClassName(
                "codexpagetop"));
            dropClass(dupstarts,"codexdupstart");
            dropClass(dupends,"codexdupend");
            dropClass(dupmiddle,"codexdup");
            dropClass(pagetops,"codexpagetop");
            if ((moved)&&(moved.length)) {
                layout.logfn(
                    "Reverting layout of %d nodes and %d split texts",
                    moved.length,textsplits.length);
                i=0; lim=moved.length;
                while (i<lim) {
                    restoreNode(moved[i++],layout,crumbs);}}
            var restyled=fdjtDOM.$("[data-savedstyle]");
            i=0; lim=restyled.length;
            while (i<lim) {
                var rs=restyled[i++];
                if (rs.hasAttribute("data-savedstyle")) {
                    var os=rs.getAttribute("data-savedstyle");
                    if (os) rs.setAttribute("style",os);
                    else rs.removeAttribute("style");
                    rs.removeAttribute("data-savedstyle");}}
            fdjtDOM.unwrapChildren("div.fdjtfontwrapper",layout.container);
            layout.textsplits={}; layout.crumbs={};}
        
        /* Codex trace levels */
        /* 0=notrace
           1=trace tracked nodes
           2=trace addition of top level chunks
           3=trace insertion of page breaks
           4=trace every node consideration
        */

        function CodexLayout(init){
            if (!(init)) init={};

            var layout=this;

            this.init=init;
            this.thenfns=[];

            // Layout rules
            var fullpages=this.fullpages=
                optimizeLayoutRule(init.fullpages||false);
            var singlepages=this.singlepages=
                optimizeLayoutRule(init.singlepages||false);
            var floatpages=this.floatpages=
                optimizeLayoutRule(init.floatpages||false);
            var floatblocks=this.floatblocks=
                optimizeLayoutRule(init.floatblocks||false);

            var pageprefix=this.pageprefix=init.pageprefix||"CODEXPAGE";

            // Layout Dimensions
            var page_height=this.height=init.page_height||fdjtDOM.viewHeight();
            var page_width=this.width=init.page_width||fdjtDOM.viewWidth();
            // Set the orientation when provided
            var orientation=(init.orientation)||
                ((page_width>page_height)?('landscape'):('portrait'));
            this.orientation=orientation;
            
            var pagefn=(init.pagefn)||false;

            var serialize=false; // Stop timeslicing
            this.serialize=function(val){
                if (typeof val === "undefined") serialize=true;
                else serialize=val;};

            // What constitutes a short page
            var short_page_height=
                ((init.hasOwnProperty("short_page_height"))&&
                 ((init.short_page_height)&&
                  ((init.short_page_height<=1)?(page_height*init.short_page_height):
                   (init.short_page_height))));

            // Break 'paragraphs' (anything with just text and inline nodes)
            var break_blocks=this.break_blocks=
                ((typeof init.break_blocks === 'undefined')?(true):
                 (init.break_blocks));

            // Atomic nodes can't be broken.  Specifying this can
            // speed up page layout in some cases.
            var atomic=init.atomic||false;
            if (typeof atomic === "string") atomic=fdjtDOM.selector(atomic);
            else if ((atomic.length)&&(atomic.join))
                // Arrays of selector strings
                atomic=fdjtDOM.selector(atomic.join(","));
            else {}
            this.atomic=atomic;

            this.dontsave=init.dontsave||false;

            var use_scaling=
                ((typeof init.use_scaling === 'undefined')?(true):
                 (init.use_scaling));

            // Scale pages (use CSS to shrink pages to fit)
            var scale_pages=this.scale_pages=
                ((use_scaling)&&
                 ((typeof init.scale_pages === 'undefined')?(true):
                  (init.scale_pages)));
            
            // This is the node DOM container where we place new pages
            var container=this.container=
                init.container||fdjtDOM("div.codexpages");
            
            var origin=this.origin=init.origin||false;

            function noop(){}
            var logfn=this.logfn=
                init.logfn||CodexLayout.logfn||
                ((typeof fdjtLog !== 'undefined')?(fdjtLog):(noop));

            // STATE variables

            var pagenum=this.pagenum=0; // Tracks current page number
            var pages=this.pages=[]; // Array of all pages generated, in order
            var dups=this.dups={}; // Tracks nodes/contexts already duplicated
            // Maps IDs to text nodes left behind as placeholders when
            //  the original nodes were moved.
            var crumbs=this.crumbs={}; 
            var cur_root=this.root=false; // The root currently being added

            // Tracks text nodes which have been split, keyed by the
            // temporary IDs assigned to them
            var textsplits=this.textsplits={};
            // Tracks split blocks
            var splits=this.splits={};

            var page=this.page=init.page; // Contains the currently open page

            var prev=this.prev=false; // The last terminal block we processed
            var prevstyle=this.prevstyle=false;

            // this.drag[] contains nodes which will go on the next
            // page when we get there.  The nodes in this.drag[] have
            // already been placed on pages, but we keep track of them
            // in case we need to move them to a new page to honor
            // nobreak constraints.
            var drag=this.drag=[];

            // this.floating contains fully-assembled page nodes to
            // placed in pages after this one; it is intended for
            // out-of-flow or 'too bit to fit' content
            var floating=this.floating=[];

            if (init.layout_id) this.layout_id=init.layout_id;

            // Startup

            this.started=false; // When we started
            var trace=this.tracelevel=  // How much to trace
            init.tracelevel||CodexLayout.tracelevel||
                (fdjtState.getLocal("codexlayout.trace",true))||0;
            var track=init.track||CodexLayout.track||
                (fdjtState.getLocal("codexlayout.track"))||false;
            if (track) {
                this.track=track=fdjtDOM.Selector(track);
                if (!(trace)) trace=this.tracelevel=1;}
            else this.track=false;
            this.roots=init.roots||[]; // Where all roots can be tracked
            this.root_count=0; // Number of root nodes added
            this.block_count=0;
            this.lastid=false;
            this.timeslice=
                ((init.hasOwnProperty('timeslice'))?(init.timeslice):
                 (CodexLayout.timeslice));
            this.timeskip=
                ((init.hasOwnProperty('timeskip'))?(init.timeskip):
                 (CodexLayout.timeskip));
            
            var pagerule=this.pagerule=init.pagerule||false;
            
            function moveUp(node){
                if (trace) {
                    if ((trace>3)||((track)&&(track.match(node))))
                        logfn("Moving node %o to page %o",node,page);}
                // if (lastmove!==node) {allmoves.push(node); lastmove=node;}
                return moveNodeToPage(node,page,dups,crumbs);}

            function moveChildren(into,children,start,end){
                var tomove=[];
                if (!(start)) start=0;
                if (!(end)) end=children.length;
                while (start<end) tomove.push(children[start++]);
                start=0; end=tomove.length; while (start<end)
                    moveNode(tomove[start++],into,false,crumbs);}
            
            //  addContent calls loop() exactly once to set up the
            //   actual loop to be timesliced with repeated calls
            //   setTimeout and a final call to doneFn.  The real
            //   inner function is step(), which relies on state
            //   stored in its closure.
            function addContent(root,timeslice,timeskip,
                                trace,progressfn,donefn) {
                
                var newpage=false, newpages=((page)?([page]):([]));
                var start=fdjtTime();
                if (!(page)) {newPage(); newpage=true;}

                if ((timeslice)&&(typeof timeslice !== "number")) 
                    timeslice=layout.timeslice;
                if ((timeskip)&&(typeof timeskip !== "number"))
                    timeskip=layout.timeskip;

                if (typeof trace === 'undefined') trace=layout.tracelevel;
                if (typeof progressfn === 'undefined')
                    progressfn=layout.progressfn||false;
                if (!(layout.started)) layout.started=start;
                // If it's already been added to a page, don't do it again.
                if (getParent(root,".codexpage")) {
                    pagesDone(newpages); newpages=[];
                    if (donefn) donefn(layout);
                    return false;}
                layout.roots.push(root);
                layout.root_count++;

                var fullpage=hasClass(root,"codexfullpage")||
                    ((fullpages)&&(testNode(root,fullpages)));
                var singlepage=
                    (fullpage)||
                    (hasClass(root,"codexsinglepage"))||
                    (checkSinglePage(root));
                if ((fullpage)||(singlepage)) {
                    if (!(avoidBreakInside(root)))
                        fullpage=singlepage=false;}
                    
                if (newpage) root=moveUp(root);
                else if (singlepage) newPage(root);
                else if ((mustBreakBefore(root))||
                         ((prev)&&(mustBreakAfter(prev)))) {
                    root=newPage(root);}
                else root=moveUp(root);
                var scale_elts=getChildren(root,"[data-pagescale],[pagescale]");
                scaleToPage(scale_elts,page_width,page_height);
                if ((root.tagName==="IMG")&&
                    ((fullpage)||(singlepage)))
                    tweakImage(root,page_width,page_height);
                else {}
                if (singlepage) {
                    var pw=page.scrollWidth, ph=page.scrollHeight;
                    if ((pw>page_width)||(ph>page_height))
                        addClass(page,"codexoversize");
                    else if ((fullpage)&&
                             ((pw<(0.9*page_width))&&(ph<(0.9*page_height))))
                        addClass(page,"codexundersize");
                    else {}
                    // Start a new page and update the loop state
                    newPage(); prev=layout.prev=root;
                    prevstyle=layout.prevstyle=getStyle(root);
                    pagesDone(newpages); newpages=[];
                    drag=[];
                    if (donefn) donefn(layout);
                    return;}
                else {
                    var geom=getGeom(root,page); var done=false;
                    if (mustBreakInside(root)) {}
                    else if (geom.bottom<=page_height) {
                        if (cantBreakBefore(root)) drag.push(root);
                        else if (cantBreakAfter(root)) drag=[root];
                        else drag=[];
                        done=true;}
                    else if (((atomic)&&(atomic.match(root)))||
                             (avoidBreakInside(root))) {
                        if (!(newpage)) {
                            newPage(root); geom=getGeom(root,page);}
                        if (geom.bottom<=page_height) {
                            if (cantBreakAfter(root)) drag=[root];
                            else drag=[];
                            done=true;}}
                    else {}
                    if (done) {
                        prev=layout.prev=root;
                        prevstyle=layout.prevstyle=getStyle(root);
                        pagesDone(newpages); newpages=[];
                        if (donefn) donefn(layout);
                        return;}}

                var blocks=[], terminals=[], styles=[];
                // gather all of the block-level elements
                // (recursively) in the node, noting which ones are
                // terminals.  This should be pretty fast, so we do it
                // synchronously
                gatherBlocks(root,root,blocks,terminals,styles);
                layout.block_count=layout.block_count+blocks.length;
                if (trace>1)
                    logfn("Laying out %d blocks from %o; page=%o",
                          blocks.length,root,page);

                // If there aren't any blocks, we try adding the
                //  content to the current page and, if it goes over,
                //  create a new page for it and call the donefn.  At
                //  the top level, we only split blocks.
                if (blocks.length===0) {
                    if (!(newpage)) newPage(root);
                    layout.root=cur_root=false;
                    pagesDone(newpages); newpages=[];
                    if (donefn) donefn(layout);
                    return;}
                
                layout.root=cur_root=root;

                var ni=0, nblocks=blocks.length; 
                
                function step(){
                    var block=blocks[ni]; var style=styles[ni];
                    var terminal=terminals[ni]||false;
                    var next=blocks[ni+1];
                    var tracing=false;
                    if (block.id) layout.lastid=block.id;

                    if ((trace)&&(block)&&
                        ((trace>3)||((track)&&(track.match(block))))) {
                        logfn("Considering block %o (#%d from %o); page=%o",
                              block,ni,root,page);
                        tracing=true;}
                    
                    // FIRST, HANDLE DRAGGING
                    handle_dragging(block,terminal,style);
                    
                    if (block) block=handle_standalone(block,style);
                    // If a block is false, continue
                    if (!(block)) {ni++; return;}
                    
                    // Finally, we check if everything fits.  We're
                    // walking through the blocks[] but only advance
                    // when an element fits or can't be split or
                    // tweaked Note that we may process an element [i]
                    // more than once if we split the node and part of
                    // the split landed back in [i].
                    var geom=getGeom(block,page), lh=parsePX(style.lineHeight);
                    var padding_bottom=parsePX(style.paddingBottom);
                    if ((trace)&&((trace>3)||((track)&&(track.match(block)))))
                        logfn("Layout/geom %o %j",block,geom);
                    if (((geom.bottom-padding_bottom)>page_height)||
                        // Even if we're above the bottom of the page,
                        // check if the next block goes over the edge
                        // and whether that would be a bad thing.  If
                        // it's big enough and far down enough, we
                        // split the current block, making a slightly
                        // short page.
                        ((next)&&(geom.height>3*lh)&&
                         (((page_height-geom.bottom)/page_height)>0.9)&&
                         ((geom.bottom+(getGeom(next).height))>page_height)&&
                         (!(avoidBreakInside(block,style)))&&
                         (avoidBreakInside(next))&&
                         (avoidBreakBefore(next)))) {
                        var use_height=page_height;
                        if ((geom.bottom-padding_bottom)<=page_height)
                            // This is the case where the block fits
                            // but the next block is really the
                            // problem.  We force a split on the
                            // current block by tweaking the height
                            // used for splitting to be 2 lines above
                            // the block's bottom.
                            use_height=geom.bottom-padding_bottom-2*lh;
                        if (!(terminal)) {
                            if (tracing)
                                logfn("Oversize non-terminal %o, continuing",
                                      block);
                            ni++;}
                        // If we get here, we're a terminal node
                        // which extends below the bottom of the page
                        else if (((short_page_height)?
                                  (geom.top>short_page_height):
                                  (geom.top>(use_height-lh*1.2)))&&
                                 (drag.length===0)&&
                                 (!(avoidBreakBefore(block,style))))
                            // Our top is also over the bottom of the page,
                            // and we can break here, so we just push off 
                           block=newPage(block);
                        else if ((hasClass(block,"codexfloat"))||
                                 ((floatblocks)&&(floatblocks.match(block)))) {
                            // If the block can float, let it
                            floating.push(block); ni++;}
                        else if (((!(break_blocks))||
                                  ((atomic)&&(atomic.match(block)))||
                                  (avoidBreakInside(block,style))||
                                  (hasClass(block,"codexcantsplit")))) {
                            var broken=handle_unbreakable(
                                block,style,geom,tracing);
                            if (!(broken)) ni++;
                            else block=broken;}
                        else {
                            // Now we try to split the block, we store
                            // the 'split block' back in the blocks
                            // variable because we might need to split
                            // it again.
                            if (tracing)
                                logfn("Splitting block %o @ %o",block,page);
                            var split=splitBlock(block,style,use_height);
                            if ((split)&&(split!==block)) {
                                blocks[ni]=split;}
                            else {
                                geom=getGeom(block,page);
                                if (geom.bottom>page_height) {
                                    addClass(page,"codexoversize");
                                    layout.drag=drag=[];
                                    newPage();}
                                ni++;}
                            layout.drag=drag=[];}}
                    // We fit on the page, so we check if we might
                    // need to be dragged to the next page by the next
                    // block
                    else if ((avoidBreakAfter(block,style))&&
                             (!(atPageTop(block,page)))) {
                        if ((drag.length===0)||(drag.indexOf(block)<0)) {
                            if (tracing) logfn("Possibly dragging %o",block);
                            drag.push(block);}
                        ni++;}
                    else {
                        layout.drag=drag=[]; ni++;}
                        
                    // Update the prev pointer for terminals
                    if (terminal) {
                        layout.prev=prev=block;
                        layout.prevstyle=prevstyle=style;}}

                // Gather all the block-level elements inside a node,
                // recording which ones are terminals (don't have any
                // blocks within them)
                function gatherBlocks(root,node,blocks,terminals,styles,style){
                    if (node.nodeType!==1) return;
                    if (node.codexui) return;
                    if (!(style)) style=getStyle(node); 
                    if ((!((style.position==='static')||(style.position==='')))||
                        ((style.float)&&(style.float!=='none')))
                        return;
                    if (((atomic)&&(atomic.match(node)))||
                        (style.display==='table-row')||
                        (avoidBreakInside(node,style))) {
                        if (node.offsetWidth>page_width) {
                            var w=node.offsetWidth, sw=w/page_width;
                            scaleToPage(node,page_width,sw*node.offsetHeight,true);}
                        if ((node.offsetHeight===0)||
                            ((node.offsetHeight)&&
                             (node.offsetHeight<(page_height*2)))) {
                            addClass(node,"codexblock");
                            blocks.push(node); styles.push(style);
                            terminals.push(node);
                            moveUp(node);
                            checkTerminal(node,root);
                            return;}
                        else {
                            // If the node is really tall, ignore the
                            // avoid page break constraint
                            if ((node.childNodes)&&(node.childNodes.length)) {
                                fdjtLog.warn(
                                    "Allowing split of huge (%d) block %o",
                                    node.offsetHeight,node);
                                node.style.pageBreakInside="auto";
                                style=getStyle(node);}}}
                    var disp=style.display;
                    if ((node.tagName!=="BR")&&
                        (disp!=='inline')&&
                        (disp!=='table-row')&&
                        (disp!=='table-cell')) {
                        var loc=blocks.length;
                        addClass(node,"codexblock");
                        blocks.push(node);
                        styles.push(style);
                        terminals.push(false);
                        if ((disp==='block')||(disp==='table')||
                            (disp==='table-row-group')) {
                            var children=node.childNodes;
                            var total_blocks=blocks.length;
                            var i=0; var len=children.length;
                            while (i<len) {
                                var ch=children[i++];
                                if (ch.nodeType===1)
                                    gatherBlocks(
                                        root,ch,blocks,terminals,styles);}
                            if (blocks.length===total_blocks)
                                terminals[loc]=node;}
                        else terminals[loc]=node;
                        if (terminals[loc]) checkTerminal(node,root);
                        moveUp(node);}
                    else if ((style.position==='static')&&
                             (node.tagName==='A')) {
                        var anchor_elts=node.childNodes;
                        var j=0; var n_elts=anchor_elts.length;
                        while (j<n_elts) {
                            var child=anchor_elts[j++];
                            if (child.nodeType!==1) continue;
                            var cstyle=getStyle(child);
                            if (cstyle.display!=='inline')
                                gatherBlocks(root,child,blocks,terminals,
                                             styles,cstyle);}
                        moveUp(node);}
                    else {}}

                function handle_dragging(block,terminal,style,tracing){
                    // If this block is terminal and we don't want to
                    // break before this block or after the preceding
                    // block, drag along the previous block to the new
                    // page.
                    
                    // NOTE that dragged blocks have already been
                    // placed, so the previous page will end up short.
                    // Them's the breaks (so to speak).
                    if (!(block)) {}
                    else if ((prev)&&(drag.indexOf(prev)<0)) {}
                    else if ((prev)&&(atPageTop(prev))) {
                        if (drag.length) layout.drag=drag=[];}
                    else if ((prev)&&(terminal)&&
                             (avoidBreakBefore(block,style))) {
                        if (tracing) logfn("Possibly dragging %o",prev);
                        if (drag.indexOf(prev)<0) 
                            drag.push(prev);}
                    else if ((prev)&&(avoidBreakAfter(prev,prevstyle))) {
                        if (tracing) logfn("Possibly dragging %o",prev);
                        if (drag.indexOf(prev)<0) 
                            drag.push(prev);}
                    else if (drag.length) layout.drag=drag=[];
                    else {}}

                function handle_standalone(block,style,tracing){
                    if ((hasClass(block,/\bcodexfloatpage\b/))||
                        ((floatblocks)&&(testNode(block,floatblocks)))||
                        ((floatpages)&&(testNode(block,floatpages)))) {
                        // Float pages just get pushed (until newPage below)
                        if (tracing) logfn("Pushing float page %o",block);
                        floating.push(block);
                        return false;}
                    else if (checkSinglePage(block,style)) {
                        // Single pages automatically get their own page
                        if (tracing) logfn("Full single page for %o",block);
                        block=newPage(block); newPage();
                        return false;}
                    else if ((page.childNodes.length)&&
                             ((forcedBreakBefore(block,style))||
                              ((prev)&&(forcedBreakAfter(prev,prevstyle)))||
                              ((prev)&&
                               ((hasClass(prev,/\b(codexfullpage|codexsinglepage)\b/))||
                                ((fullpages)&&(testNode(prev,fullpages)))||
                                ((singlepages)&&(testNode(prev,singlepages))))))) {
                        // This is the easy case.  Note that we don't
                        // force a page break if the current page is
                        // empty.
                        if (tracing) logfn("Forced new page for %o",block);
                        // We clear the drags because we're following a force rule
                        layout.drag=drag=[];
                        return newPage(block)||block;}
                    else return moveUp(block);}

                function handle_unbreakable(block,style,geom,tracing) {
                    // We can't break this block (for various reasons)
                    var curpage=page; tracing=false; // ignored
                    var newblock=false;
                    if ((drag.length)&&(atPageTop(drag[0],page))) {
                        // A new page won't make a difference
                        //  because we're dragging the rest of
                        //  the current page anyway, so we
                        //  need to make some choices (we're
                        //  in an impossible situation)
                        var oversize_limit=0.2;
                        if ((!(avoidBreakAfter(block,style)))&&
                            (((geom.bottom-page_height)/page_height)>1.0)&&
                            (((geom.bottom-page_height)/page_height)<oversize_limit)) {
                            // We leave the block where it is and create an oversize page
                            // We do this if:
                            //   a break after the block is okay AND
                            //    the page would be less than 20% oversize
                            addClass(page,"codexoversize"); // probably redundant
                            layout.drag=drag=[]; newPage();
                            return false;}
                        else {
                            // We need to leave the dragged elements behind
                            layout.drag=drag=[];
                            newblock=newPage(block);
                            if (page===curpage)
                                return false; // probably "codexoversize"
                            else if (((!(break_blocks))||
                                      ((atomic)&&(atomic.match(newblock)))||
                                      (avoidBreakInside(newblock))||
                                      (hasClass(newblock,"codexcantsplit")))) {
                                // layout.drag=drag=[];
                                return false;}
                            else return newblock;}}
                    else {
                        // We just make a new page for the block
                        newblock=newPage(block);
                        if (page===curpage)
                            return false; // probably "codexoversize"
                        else if (((!(break_blocks))||
                                  ((atomic)&&(atomic.match(newblock)))||
                                  (avoidBreakInside(newblock))||
                                  (hasClass(newblock,"codexcantsplit")))) {
                            // layout.drag=drag=[];
                            return false;}
                        else return newblock;}}

                function isLastChild(node){
                    var scan=node.nextSibling;
                    while (scan) {
                        if ((scan.nodeType===3)&&(!(isEmpty(scan.nodeValue)))) return false;
                        else if ((scan.nodeType===1)&&(inFlow(scan))) return false;
                        else scan=scan.nextSibling;}
                    return true;}
                function isFirstChild(node){
                    var scan=node.previousSibling;
                    while (scan) {
                        if ((scan.nodeType===3)||(!(isEmpty(scan.nodeValue)))) return false;
                        else if ((scan.nodeType===1)&&(inFlow(scan))) return false;
                        else scan=scan.previousSibling;}
                    return true;}

                function getFrontEdge(node,root){
                    var body=document.body;
                    var edge=[node], parent=node.parentNode;
                    while ((parent)&&(parent!==body)&&
                           (node!==root)&&(isLastChild(node))) {
                        edge.push(parent);
                        node=parent;
                        parent=node.parentNode;}
                    return edge;}
                function getBackEdge(node,root){
                    var body=document.body;
                    var edge=[node], parent=node.parentNode;
                    while ((parent)&&(parent!==body)&&
                           (node!==root)&&(isFirstChild(node))) {
                        edge.push(parent);
                        node=parent;
                        parent=node.parentNode;}
                    return edge;}

                function checkTerminal(node,root){
                    if (hasClass(node,"codexterminal")) return;
                    var front_edge=getFrontEdge(node,root);
                    var back_edge=getBackEdge(node,root);
                    var avoid_before=false, force_before=false;
                    var avoid_after=false, force_after=false;
                    var i=0, lim=front_edge.length; if (lim>1) {
                        while (i<lim) {
                            if (avoidBreakAfter(front_edge[i]))
                                avoid_after=true;
                            if (forcedBreakAfter(front_edge[i]))
                                force_after=true;
                            i++;}}
                    i=0; lim=back_edge.length; if (lim>1) {
                        while (i<lim) {
                            if (avoidBreakBefore(back_edge[i]))
                                avoid_before=true;
                            if (forcedBreakBefore(back_edge[i]))
                                force_before=true;
                            i++;}}
                    if ((avoid_after)&&(force_after)) {
                        /* Avoid brain exploding */}
                    else if (avoid_after) 
                        addClass(front_edge,"AVOIDBREAKAFTER");
                    else if (force_after)
                        addClass(front_edge,"FORCEBREAKAFTER");
                    else {}
                    if ((avoid_before)&&(force_before)) {
                        /* Avoid brain exploding */}
                    else if (avoid_before) 
                        addClass(back_edge,"AVOIDBREAKBEFORE");
                    else if (force_before)
                        addClass(back_edge,"FORCEBREAKBEFORE");
                    else {}
                    addClass(node,"codexterminal");}
                
                function emptyNode(node){
                    if (node.nodeType===3)
                        return (node.nodeValue.search(/\S/)<0);
                    else if (node.nodeType===1) {
                        if ((!(node.childNodes))||
                            (node.childNodes.length===0)) {
                            if (node.offsetHeight) return false;
                            else return true;}
                        else {
                            var children=node.childNodes;
                            var i=0, lim=children.length;
                            while (i<lim) {
                                if (!(emptyNode(children[i++])))
                                    return false;}
                            return true;}}
                    else return false;}

                function firstGChild(ancestor,descendant){
                    var scan=descendant;
                    while (scan) {
                        if (scan===ancestor) return true;
                        else if (!(scan.previousSibling))
                            scan=scan.parentNode;
                        else {
                            var prev=scan.previousSibling;
                            while (prev) {
                                if ((emptyNode(prev))||
                                    ((prev.nodeType===1)&&(!(inFlow(prev))))) {
                                    scan=prev;
                                    prev=scan.previousSibling;}
                                else return false;}
                            scan=scan.parentNode;}}
                    return false;}

                // Whether we need to create a new page to have 'node'
                //  at the page top We don't need a new page if the
                //  current page has no content or no content up until
                //  the node in question
                function needNewPage(node){
                    if (!(page)) return true;
                    else if ((!(node))||(!(hasParent(node,page))))
                        return hasContent(page,true);
                    else if ((page.firstChild===node)||(firstGChild(page,node)))
                        return false;
                    else if ((node.nodeType===1)&&
                             (getGeom(node,page).top===0)&&
                             (node.tagName!=="BR"))
                        return false;
                    else return true;}

                /*** Create a new page. ***/
                // If node is passed, it is intended to be the first
                // element on the new page.
                function newPage(node,forcepage){
                    var i, lim;
                    if ((drag)&&(drag.length)&&(drag.length)&&
                        (atPageTop(drag[0]))) {
                        logfn("Ignored call for new page @%d due to excessive drag",
                              pagenum);
                        if (node) node=moveUp(node);
                        return false;}
                    if ((!(node))&&(!(forcepage))&&(page)&&
                        (page.childNodes.length===0)) {
                        if (node)
                            logfn("Ignored call for new page for %o on empty page %d",
                                  node,pagenum);
                        else logfn("Ignored call for new page on empty page %d",
                                   node,pagenum);
                        return false;}

                    if ((node)&&(node.nodeType===3)) {
                        var parent=node.parentNode;
                        if ((parent)&&(parent.childNodes.length===1)&&
                            (parent!==document.body)&&
                            (parent!==root)&&
                            (!(hasClass(parent,"codexpage"))))
                            node=parent;}

                    if ((node)&&(!(forcepage))&&(!(needNewPage(node)))) {
                        return moveUp(node);}

                    if ((floating)&&(floating.length)) {
                        // First add any floating pages that may have
                        // accumulated
                        var floaters=floating; floating=[];
                        var closed_page=page;
                        i=0; lim=floaters.length;
                        while (i<lim) {
                            var floater=floaters[i++], fg=false;
                            if (checkSinglePage(floater)) {
                                newPage(floater);
                                closed_page=page;
                                forcepage=true;}
                            else if (closed_page===page) {
                                newPage(floater); fg=getGeom(floater,page);
                                if (fg.bottom>page_height) {
                                    addClass(page,"codexoversize");
                                    closed_page=page;}}
                            else {                                
                                moveNodeToPage(floater,page);
                                fg=getGeom(floater,newpage);
                                if (fg.bottom>=page_height) newPage(floater);}}}

                    if ((!(node))||(forcepage)||(needNewPage(node))) {
                        // If we really need to create a new page, do so,
                        if (page) {
                            if (pagefn) pagefn.call(layout,page,layout);
                            page.style.height="";
                            dropClass(page,"codexworkpage");}
                        layout.page=page=fdjtDOM("div.codexpage.codexworkpage");
                        newpages.push(page);
                        if (!(pagerule)) {
                            page.style.height=page_height+'px';
                            page.style.width=page_width+'px';}
                        page.style.height="inherit";
                        pagenum++; layout.pagenum=pagenum;
                        page.id=pageprefix+(pagenum);
                        page.setAttribute("data-pagenum",pagenum);
                        fdjtDOM(container,page);
                        layout.prev=prev=false;
                        pages.push(page);}
                    
                    if (trace) {
                        if ((trace>2)||
                            ((track)&&(node)&&(track.match(node)))) {
                            if (node) logfn("Layout/%s %o at %o",
                                            newpage,page,node);
                            else logfn("Layout/%s %o",newpage,page);}}
                    
                    // If there are things we are dragging along, move
                    // them to the new page
                    if ((drag)&&(drag.length)) {
                        i=0; lim=drag.length;
                        while (i<lim) moveUp(drag[i++]);
                        if (node) { /* node */
                            var block=node;
                            var terminal=((terminals)&&(terminals[ni]));
                            if ((block)&&(drag.length)&&(terminal)) {
                                if ((drag.length===1)||
                                    (avoidBreakBefore(block))||
                                    (avoidBreakAfter(drag[drag.length-1]))) {
                                    if (drag.indexOf(block)<0)
                                        drag.push(block);}
                                else layout.drag=drag=[];}}
                        else {
                            layout.prev=prev=drag[drag.length-1];
                            layout.drag=drag=[];}}
                    if (node) return moveUp(node);
                    else return false;}

                // This gets a little complicated
                function splitBlock(node,style,use_height){
                    if (!(use_height)) use_height=page_height;
                    if (!(style)) style=getStyle(node);
                    if ((!(break_blocks))||(avoidBreakInside(node,style))||
                        (!(node.childNodes))||(node.childNodes.length===0)) {
                        // Simplest case, if we can't split, we just
                        // make a new page starting with the node.
                        addClass(node,"codexcantsplit");
                        newPage(node);
                        return node;}
                    if ((node.id)&&(node.id.search("CODEXTMP")!==0)) {
                        if (!(splits[node.id]))
                            splits[node.id]=node.cloneNode(true);}
                    // Otherwise, we remove all of the node's children
                    // and then add back just enough to reach the
                    // edge, potentially splitting some children to
                    // make this work.
                    var init_geom=getGeom(node,page,true);
                    var line_height=init_geom.line_height||12;
                    if ((use_height===page_height)&&
                        ((init_geom.top+init_geom.top_margin+
                          (line_height*1.2))>page_height)) {
                        // If the top is too close to the bottom of
                        // the page, try to just push onto a new page.
                        // This might fail if we're dragging too many
                        // nodes or if we're already the top of the page;
                        var cpage=page, newblock=newPage(node);
                        // If the page break succeeded, return the new block,
                        //  otherwise, keep trying to split
                        if (cpage!==page) return newblock;
                        // If we're near the bottom and the page break
                        // failed, we're in a tight place, so we bump
                        // up the height to let us go a little over
                        // (we'll adjust afterwards).
                        else use_height=page_height+floor(line_height*1.2);}
                    // Copy all the children into an array
                    var children=toArray(node.childNodes);
                    // and remove all of them at once
                    node.innerHTML="";
                    var geom=getGeom(node,page);
                    if (geom.bottom>use_height) {
                        // If the version without any children is
                        // already over the edge, just start a new
                        // page on the node (after restoring all the
                        // children to the node).
                        appendChildren(node,children);
                        addClass(node,"codexcantsplit");
                        newPage(node);
                        return node;}
                    // If the block is just a little bit over the
                    // bottom, tweak the page height to avoid leaving
                    // a single line on the other side, except if the
                    // overall height is small.
                    if ((use_height===page_height)&&
                        ((init_geom.bottom-page_height)<(line_height*1.2))&&
                        (init_geom.height>(line_height*3)))
                        use_height=page_height-floor(line_height*1.2);
                    // When splitChildren called, <node> is already
                    // empty and it's children are all in <children>
                    var push=splitChildren(node,children,init_geom,use_height);
                    if (!(push)) {
                        /* Doesn't need to be split after all.
                           Not sure when this will happen, if ever. */
                        fdjtLog("Tried to break %o which didn't need breaking",
                                node);
                        appendChildren(node,children);
                        return node;}
                    else if (push===node) {
                        // This is the case where we can't split at
                        //  all, so we add the class 'codexcantsplit'
                        //  to avoid trying again and we make a new
                        //  page
                        appendChildren(node,children);
                        addClass(node,"codexcantsplit");
                        newPage(node);
                        return node;}
                    else { 
                        var page_break=push[0];
                        // Since we left something behind on this page, we
                        //  can clear anything we're dragging
                        layout.drag=drag=[];
                        // Finally, we create a new page
                        page_break=newPage(page_break);
                        var dup=page_break.parentNode;
                        // This (dup) is the copied parent of the page
                        // break.  We append all the remaining children
                        // to this duplicated parent on the new page.
                        if ((hasClass(node,"codexdup"))||(hasClass(node,"codexdupend")))
                            appendChildren(dup,push,1);
                        else moveChildren(dup,push,1);
                        if (trace>1)
                            logfn("Layout/splitBlock %o @ %o into %o on %o",
                                  node,page_break,dup,page);
                        return dup;}}

                function splitChildren(node,children,init_geom,use_page_height){
                    /* node is an emptied node and children are its
                       lost children.  We return an array of children
                       which should go onto the next page, possibly
                       synthesizing a new child by splitting some
                       text.  Returning false means that the node
                       should be left on its page; returning the node
                       itself indicates that it should be forced onto
                       a new page. */
                    var page_break=false, breaktype=false, breakpos=-1; 
                    var textsplit=false, text_parent=false;
                    if (!(use_page_height)) use_page_height=page_height;
                    // This is always called from splitBlock or the
                    //  break point in splitChildren, so we know that
                    //  node by itself is on the page while node with
                    //  it's children is over the page.
                    var geom=init_geom||getGeom(node,page);
                    if (children.length===1) {
                        page_break=children[0]; breakpos=0;
                        breaktype=page_break.nodeType;
                        node.appendChild(page_break);}
                    else {
                        // We add children back until we go over the edge
                        // and then figure out if there's a way to split
                        // the child that broke the page.
                        var i=0, n=children.length;
                        while (i<n) {
                            var child=children[i++];
                            node.innerHTML="";
                            appendChildren(node,children,0,i);
                            // Add the child back and get the geometry
                            geom=getGeom(node,page);
                            if (geom.bottom>use_page_height) {
                                page_break=child; breaktype=child.nodeType;
                                breakpos=i-1;
                                break;}
                            else continue;}}
                    if (!(page_break))  // Never went over the edge
                        return false;
                    // If we get here, this child pushed the node over the edge
                    else if (breaktype===3) {
                        textsplit=page_break; text_parent=node;}
                    else if (breaktype!==1) {
                        //  It's a weird node, so we punt on handling it.
                        //  If it's the first child, push the whole node,
                        //  otherwise, just split it at the break
                        if (breakpos===0) return node;
                        else return children.slice(breakpos);}
                    // If the page break has a single textual child,
                    // we just split it's text.
                    else if ((page_break.childNodes.length===1)&&
                             (page_break.childNodes[0].nodeType===3)) {
                        textsplit=page_break.childNodes[0];
                        text_parent=page_break;}
                    // If we're breaking on the first node or there
                    // isn't any real content before the break, we
                    // admit defeat
                    else if ((breakpos===0)||
                             (!(hasContent(node,true,false,page_break)))) {
                        appendChildren(node,children,breakpos+1);
                        return node;}
                    // If the break is childless, we just split on it
                    else if ((!(page_break.childNodes))||
                             (page_break.childNodes.length===0))
                        return children.slice(breakpos);
                    else if (true)
                        return children.slice(breakpos);
                    // We could call splitChildren recursively, but
                    // we're not currently doing so
                    else {
                        /*
                        var grandchildren=toArray(page_break.childNodes);
                        var push=splitChildren();
                        if ((!(push))||(push===page_break))
                            return children.slice(i-1);
                        else {
                            // This should reproduce the logic below
                            var clone_break=page_break.cloneNode(true);}
                        */}
                    // If it's text, split it into words, then try to
                    // find the length at which one more word pushes
                    // it over the edge.
                    var probenode=textsplit, text=textsplit.nodeValue;
                    var original=textsplit;
                    // Now, break the text up at possible page breaks
                    // (we are not treating soft-hyphens as page
                    // breaks, though we might)
                    var words=attachWhitespace(text.split(/(\s+)/mg));
                    // If there aren't many words, don't bother splitting
                    if (words.length<2) {
                        // If the break is at the head, push the whole
                        // node to the next page, otherwise, 
                        if (breakpos===0) return node;
                        else return children.slice(breakpos);}
                    else {
                        // Check if just the first word pushes us over
                        // the edge, a relatively common case
                        var wprobe=document.createTextNode(words[0]);
                        text_parent.replaceChild(wprobe,probenode);
                        probenode=wprobe; geom=getGeom(node,page);
                        if (geom.bottom>use_page_height) {
                            text_parent.replaceChild(original,probenode);
                            return children.slice(breakpos);}
                        else {
                            text_parent.replaceChild(textsplit,wprobe);
                            probenode=textsplit;}}
                    var foundbreak=splitWords(
                        text_parent,probenode,words,node,use_page_height);
                    // We're done searching for the word break
                    if ((foundbreak===0)||(foundbreak===(words.length-1))) {
                        // Revert (don't actually do any text splitting)
                        text_parent.replaceChild(textsplit,probenode);
                        if (breakpos===0) return node;
                        else return children.slice(breakpos);}
                    else { // Split the text at foundbreak
                        var keeptext=words.slice(0,foundbreak).join("");
                        var pushtext=words.slice(foundbreak).join("");
                        // We record the ID so that we can restore the
                        // original text node
                        var keepnode, pushnode, id=false;
                        if (breaktype===3) {
                            // We replace the text with an element so
                            //  that we can look it up by ID to replace
                            //  when reverting the layout.
                            keepnode=fdjtDOM(
                                "span.codexsplitstart.codexraggedsplit");
                            id=keepnode.id="CODEXTMPID"+(tmpid_count++);
                            pushnode=fdjtDOM("span.codextextsplit");}
                        else if (hasClass(page_break,"codextextsplit")) {
                            // This is the case where we are splitting
                            // a text node again.  There's no need to
                            // save anything and we don't want nested
                            // codextextsplits, so we'll treat the
                            // page_break as a probenode (to be
                            // replaced).
                            probenode=keepnode=page_break;
                            keepnode.innerHTML="";
                            text_parent=node; probenode=keepnode;
                            pushnode=page_break.cloneNode(true);
                            addClass(page_break,"codexraggedsplit");
                            pushnode.id="";}
                        else {
                            keepnode=fdjtDOM("span.codexsplitstart");
                            pushnode=page_break.cloneNode(true);
                            if (!(keepnode.id))
                                id=keepnode.id="CODEXTMPID"+(tmpid_count++);
                            else pushnode.id="";}
                        keepnode.appendChild(document.createTextNode(keeptext));
                        pushnode.innerHTML="";
                        pushnode.appendChild(document.createTextNode(pushtext));
                        if (keepnode!==probenode)
                            text_parent.replaceChild(keepnode,probenode);
                        // Gather the children to be pushed, replacing
                        // the first one with the duplicated page_break
                        var push_children=children.slice(breakpos);
                        push_children[0]=pushnode;
                        // Put the children back into context for copying
                        appendChildren(node,push_children);
                        // Save the textsplit for reverting the layout
                        if (id) textsplits[id]=original;
                        // Return the children to be pushed to the new page
                        return push_children;}}

                function splitWords(
                    text_parent,probestart,words,node,use_page_height){
                    // Now we do a binary search to find the word
                    //  which pushes the node below the page bottom.
                    //  That's where we'll break.
                    var wlen=words.length, wtop=wlen, wbot=0, foundbreak=false;
                    var probenode=probestart, geom=false;
                    while (wbot<wtop) {
                        var wmid=wbot+floor((wtop-wbot)/2);
                        var newprobe=document.createTextNode(
                            words.slice(0,wmid).join(""));
                        // Add all the words up to foundbreak
                        text_parent.replaceChild(newprobe,probenode);
                        probenode=newprobe; geom=getGeom(node,page);
                        if (geom.bottom>use_page_height)
                            wtop=wmid-1;
                        else {
                            /* This is the actual test condition: add
                               the word at foundbreak to see if we
                               break the page.*/
                            var nextw=document.createTextNode(words[wmid]);
                            text_parent.appendChild(nextw);
                            var ngeom=getGeom(node,page);
                            text_parent.removeChild(nextw);
                            if (ngeom.bottom>use_page_height) {
                                foundbreak=wmid; break;}
                            else wbot=wmid+1;}}
                    if (foundbreak===false) foundbreak=wbot;
                    if (probestart!==probenode)
                        text_parent.replaceChild(probestart,probenode);
                    return foundbreak;}

                // This attaches trailing whitespace to words as
                // returned by .split()
                function attachWhitespace(breaks){
                    var words=[], word=false;
                    var bi=0, blen=breaks.length;
                    while (bi<blen) {
                        var s=breaks[bi++]; var ws;
                        if ((ws=s.search(/\s/))>=0) { /* Includes whitespace */
                            if (ws===0) { /* Starts with whitespace */
                                if (word) words.push(word);
                                if (bi<blen) word=s+breaks[bi++];
                                else word=s;}
                            else {
                                if (word) words.push(word+s);
                                else words.push(s);
                                word=false;}}
                        else if (word) word=word+s;
                        else word=s;}
                    if (word) words.push(word);
                    return words;}

                function loop(){
                    var loop_start=fdjtTime();
                    while ((ni<nblocks)&&
                           ((!(timeslice))||(serialize)||
                            ((fdjtTime()-loop_start)<timeslice)))
                        step();
                    if (progressfn) progressfn(layout);
                    if (ni<nblocks) {
                        if (timeslice)
                            layout.timer=setTimeout(loop,timeskip||timeslice);
                        else loop();}
                    else {
                        var last_block=blocks[nblocks-1];
                        if ((forcedBreakAfter(last_block))||
                            (hasClass(last_block,/\bcodexfullpage\b/))||
                            ((fullpages)&&(testNode(last_block,fullpages))))
                            newPage();
                        if (layout.timer) clearTimeout(layout.timer);
                        layout.timer=false;
                        layout.root=cur_root=false;
                        pagesDone(newpages); newpages=[];
                        if (donefn) {
                            if (timeslice) 
                                setTimeout(function(){donefn(layout);},10);
                            else donefn(layout);}}}

                // This is the inner loop
                if (!(timeslice)) {
                    while (ni<nblocks) step();
                    pagesDone(newpages);
                    if (donefn) donefn(layout);}
                else loop();
                
                return layout;}
            this.addContent=addContent;

            function pagesDone(pages){
                var i=0, lim=pages.length; while (i<lim) {
                    var page=pages[i++], ph=page.style.height;
                    if ((ph)&&(ph!=="")&&(ph!=="inherit")&&
                        (ph!=="initial")&&(ph!=="auto"))
                        continue;
                    if (hasClass(page,"codexoversize")) continue;
                    page.style.height="auto"; page.style.display="block";
                    var content_height=page.scrollHeight;
                    if (content_height<page_height) {}
                    else {
                        var pagestyle=getStyle(page);
                        var use_height=page_height+
                            parsePX(pagestyle.paddingTop)+
                            parsePX(pagestyle.paddingBottom);
                        if (content_height>use_height)
                            addClass(page,"codexoversize");}
                    page.style.height=""; page.style.display="";
                    var ragged=getChild(page,".codexraggedsplit");
                    if (ragged) 
                        ragged.appendChild(fdjtDOM(
                            "span.codexdupleading.fdjtskiptext","leading"));
                    var blocks=getChildren(page,".codexblock");
                    var j=0, nblocks=blocks.length; while (j<nblocks) {
                        var block=blocks[j++];
                        dropClass(block,"codexblock");
                        dropClass(block,"codexterminal");}}}

            function gatherLayoutInfo(
                node,ids,dups,dupids,dupstarts,restoremap){
                if (node.nodeType!==1) return;
                var classname=node.className;
                if (typeof classname === "string") {
                    if (classname.search(/\bcodexdupstart\b/)>=0) {
                        if (!(dupstarts[node.id])) {
                            dupstarts[node.id]=node;
                            dupids.push(node.id);
                            ids.push(node.id);}}
                    else if (classname.search(/\b(codexdup|codexdupend)\b/)>=0) {
                        var baseid=node.getAttribute("data-baseid");
                        if (baseid) {
                            node.codexbaseid=baseid;
                            if (dups[baseid]) dups[baseid].push(node);
                            else dups[baseid]=[node];}}
                    else if ((node.id)&&
                             (classname.search(/\bcodexrestore\b/)>=0)) {
                        if (!(restoremap[node.id])) {
                            ids.push(node.id);
                            restoremap[node.id]=node;}}}
                // Weird node
                else return;
                if ((node.childNodes)&&(node.childNodes.length)) {
                    var children=node.childNodes;
                    var i=0, lim=children.length;
                    while (i<lim) {
                        var child=children[i++];
                        if (child.nodeType===1) gatherLayoutInfo(
                            child,ids,dups,dupids,dupstarts,restoremap);}}}

            var replaceNode=fdjtDOM.replace;

            /* Setting content (when there's a saved version) Mostly
               this sets up the external data and functions which would
               have been generated if we'd gone through the layout,
               especially the dups for split nodes and the saved_ids
               for restoring unique IDs.
            */
            function setSimpleLayout(content){
                function setting_layout(resolve,reject){
                    try {
                        var frag=document.createElement("div");
                        var all_ids=[], saved_ids={};
                        var dupids=[], dupstarts={}, restoremap={};
                        var curnodes=[], newdups={}, pagescales=[];
                        if (trace)
                            fdjtLog("Setting layout to %d characters of HTML",
                                    content.length);
                        frag.innerHTML=content;
                        var newpages=frag.childNodes, addpages=[];
                        if (trace) fdjtLog("Gathering layout info");
                        var i=0, lim=newpages.length; while (i<lim) {
                            var page=newpages[i++];
                            addpages.push(page);
                            if (page.nodeType===1) {
                                if ((page.className)&&(page.className.search)&&
                                    (page.className.search(/\bcurpage\b/)>=0))
                                    dropClass(page,"curpage");
                                gatherLayoutInfo(page,all_ids,newdups,
                                                 dupids,dupstarts,restoremap);}}
                        var idmap={};
                        if (trace) fdjtLog("Getting originals by ID");
                        i=0; lim=all_ids.length; while (i<lim) {
                            var idkey=all_ids[i++];
                            idmap[idkey]=document.getElementById(idkey);}
                        var bcrumb=false, ccrumb=false;
                        if (trace)
                            fdjtLog("Moving body and container out of document");
                        if ((origin)&&(origin.parentNode)) {
                            bcrumb=document.createTextNode("");
                            origin.parentNode.replaceChild(bcrumb,origin);}
                        if (container.parentNode) {
                            ccrumb=document.createTextNode("");
                            container.parentNode.replaceChild(ccrumb,container);}
                        if (trace) fdjtLog("Moving originals into layout");
                        i=0; lim=all_ids.length; while (i<lim) {
                            var id=all_ids[i++];
                            var original=idmap[id];
                            var restore=restoremap[id];
                            // The restoremap contains content references
                            //  which are unmodified from the original
                            //  content, making them a lot smaller and easier
                            //  to keep around.
                            if ((restore)&&(original)) {
                                var classname=restore.className;
                                var style=restore.getAttribute("style");
                                var ostyle=original.getAttribute("style");
                                var oclass=original.className;
                                var crumb=document.createTextNode("");
                                classname=classname.replace(/\bcodexrestore\b/,"");
                                replaceNode(original,crumb);
                                crumbs[id]=crumb;
                                replaceNode(restore,original);
                                if ((classname)&&(classname!==oclass)) {
                                    if ((oclass)&&(typeof oclass === "string"))
                                        original.setAttribute("data-savedclass",oclass);
                                    original.className=classname;}
                                if (style!==ostyle) {
                                    if (ostyle) original.setAttribute(
                                        "data-savedstyle",ostyle);
                                    original.setAttribute("style",style);}
                                if (classname.search(/\bcodexpagetop\b/)>=0) {
                                    markPageTop(original,true);}}
                            else if (original) {
                                saved_ids[id]=original;
                                if (original.id) original.removeAttribute("id");}}
                        if (trace) fdjtLog("Gathering lostids");
                        var lostids=layout.lostids={};
                        var really_lost=lostids._all_ids=[];
                        i=0; lim=dupids.length; while (i<lim) {
                            var dupid=dupids[i++];
                            var orig=idmap[dupid];
                            if (orig) {
                                lostids[dupid]=orig;
                                really_lost.push(dupid);
                                if (orig.id) orig.removeAttribute("id");}}
                        if (trace) fdjtLog("Moving nodes around");
                        var cur=container.childNodes;
                        i=0; lim=cur.length; while (i<lim) curnodes.push(cur[i++]);
                        i=0; while (i<lim) container.removeChild(curnodes[i++]);
                        i=0; lim=addpages.length;
                        while (i<lim) {
                            var addpage=addpages[i++];
                            var scale_elts=
                                getChildren(addpage,"[pagescale],[data-pagescale]");
                            if (scale_elts.length) 
                                pagescales.push({page: addpage, toscale: scale_elts});
                            container.appendChild(addpage);}
                        layout.pages=addpages;
                        dups=layout.dups=newdups;
                        saved_ids._all_ids=all_ids;
                        layout.saved_ids=saved_ids;
                        layout.page=addpages[0];
                        layout.pagenum=parseInt(
                            layout.page.getAttribute("data-pagenum"),10);
                        if (trace)
                            fdjtLog("Moving origin/container back to document");
                        if (ccrumb)
                            ccrumb.parentNode.replaceChild(container,ccrumb);
                        if (bcrumb)
                            bcrumb.parentNode.replaceChild(origin,bcrumb);
                        var splits=getChildren(container,".codexsplitstart");
                        var s=0, n_splits=splits.length; while (s<n_splits) {
                            var split=splits[s++], splitid=split.id;
                            var text=split.getAttribute("data-textsplit");
                            if ((splitid)&&(text)) {
                                textsplits[splitid]=document.createTextNode(text);
                                split.removeAttribute("data-textsplit");}}
                        i=0; lim=pagescales.length; while (i<lim) {
                            var ps=pagescales[i++]; var pg=ps.page;
                            pg.style.opacity=0; pg.style.display='block';
                            scaleToPage(ps.toscale,page_width,page_height);
                            pg.style.display=''; pg.style.opacity='';}}
                    catch (ex) {
                        if (reject) reject(ex); return;}
                    if (trace) fdjtLog("Done restoring layout");
                    if (resolve) return resolve(layout);
                    else return layout;}
                return new Promise(setting_layout);}

            function setLayout(content){
                if (typeof content === "string") 
                    return setSimpleLayout(content);
                else if (!(content.hasOwnProperty('npages'))) 
                    return setSimpleLayout(content.layout);
                else {
                    // Page-by-page layout
                    // !!! This hasn't been tested
                    container.innerHTML=content.layout;
                    var pagenodes=container.childNodes;
                    return fdjtAsync.slowmap(
                        function(pagenode){
                            restorePage(pagenode,content);},
                        pagenodes,
                        {slice: layout.timeslice,
                         space: layout.timeskip});}}
            layout.setLayout=setLayout;

            function restorePage(pagenode,content){
                fetchLayout(content.layout_id,pagenode.id).
                    then(function(pagedata){
                        pagenode.innerHTML=pagedata.content;},
                         pagenode.id);}

            function dropSelected(node,dropsel){
                if (!(dropsel)) return;
                else if (node.nodeType!==1) return;
                else {
                    var children=node.childNodes; var todrop=[];
                    if (!(children)) return;
                    var i=0, lim=children.length;
                    while (i<lim) {
                        var child=children[i++];
                        if (child.nodeType!==1) continue;
                        if (dropsel.match(child)) todrop.push(child);}
                    i=0; lim=todrop.length; while (i<lim) {
                        node.removeChild(todrop[i++]);}}}

            function prepForRestore(node,dropsel){
                if (node.nodeType!==1) return;
                if (node.id) {
                    var classname=node.className;
                    if ((!((classname)&&
                           (typeof classname === "string")&&
                           (classname.search(/\bcodexdup/g)>=0)))&&
                        (node.id)&&(node.id.search("CODEXTMP")!==0)) {
                        var justref=document.createElement(node.tagName);
                        if (node.id) justref.id=node.id;
                        if (typeof node.className === "string")
                            justref.className=node.className+" codexrestore";
                        else justref.className="codexrestore";
                        if (node.getAttribute("style"))
                            justref.setAttribute(
                                "style",node.getAttribute("style"));
                        node.parentNode.replaceChild(justref,node);
                        if (dropsel) return dropSelected(node,dropsel);
                        else return;}}
                var children=node.childNodes; var todrop=[];
                var i=0, n=children.length;
                while (i<n) {
                    var child=children[i++];
                    if (child.nodeType!==1) continue;
                    else if ((dropsel)&&(dropsel.match(child)))
                        todrop.push(child);
                    else prepForRestore(child,dropsel);}
                i=0; n=todrop.length; while (i<n) {
                    node.removeChild(todrop[i++]);}}
            
            function saveLayout(callback,layout_id){
                var href=window.location.href;
                var qpos=href.indexOf("?"), hashpos=href.indexOf("#");
                var endpos=((qpos>=hashpos)?(qpos):(hashpos));
                if (endpos>0) href=href.slice(0,endpos);
                if (!(layout_id)) layout_id=layout.layout_id||
                    (layout.layout_id=
                     layout.width+"x"+layout.height+"("+href+")");
                if (!(CodexLayout.cache)) return;
                // These will be used for per-page saved layouts
                var copy=container.cloneNode(true);
                var pages=copy.childNodes, i=0, npages=pages.length;
                while (i<npages) {
                    var page=pages[i++];
                    if (page.nodeType===1) {
                        var content=page.childNodes;
                        var j=0, n=content.length;
                        while (j<n) {
                            var node=content[j++];
                            if (node.nodeType===1) {
                                prepForRestore(node,layout.dontsave||false);}}}}
                var splits=getChildren(copy,".codexsplitstart");
                var s=0, n_splits=splits.length; while (s<n_splits) {
                    var split=splits[s++], splitid=split.id;
                    var text=(splitid)&&(textsplits[splitid]);
                    if (text)
                        split.setAttribute("data-textsplit",text.nodeValue);}
                var html=copy.innerHTML;
                try {
                    cacheLayout(layout_id,html,false,false,
                                function(){cachedLayout(layout_id);});
                    callback(layout);}
                catch (ex) {
                    fdjtLog.warn("Couldn't save layout %s: %s",layout_id,ex);
                    return false;}
                return layout_id;}
            this.saveLayout=saveLayout;
            function restoreLayout(arg,donefn,failfn){
                function whendone(){
                    layout.done=fdjtTime();
                    if (donefn) donefn(layout);
                    if ((layout.thenfns)&&(layout.thenfns.length)) {
                        var thenfns=layout.thenfns;
                        var f=0, nfns=thenfns.length; while (f<nfns) {
                            thenfns[f++](layout);}}
                    return layout;}
                var setting=false;
                if (!(arg)) {
                    fdjtLog.warn("Falsy arg %s to restoreLayout",arg);
                    failfn(new Error("Falsy arg to restoreLayout"));
                    return layout;}
                else if (arg.hasOwnProperty('npages')) 
                    setting=layout.setLayout(arg);
                else if (arg.hasOwnProperty('layout'))
                    setting=layout.setLayout(arg.layout);
                else if (arg.indexOf("<")>=0) 
                    setting=layout.setLayout(arg);
                else {
                    var saved_layout=fdjtState.getLocal(arg);
                    if (layout) {
                        return layout.setLayout(saved_layout,whendone);}
                    else return false;}
                return setting.then(whendone).catch(failfn);}
            this.restoreLayout=function(arg){
                function restoring_layout(resolve,reject){
                    restoreLayout(arg,resolve,reject);}
                return new Promise(restoring_layout);};

            /*
              layout.savePages=function(){
              // This is a version which could be used if restore
              // the entire layout takes too long, which doesn't
              // seem to be the case.
              var pages=this.pages; var i=0, npages=pages.length;
              while (i<npages) {
              var page=pages[i++].cloneNode(true);
              var content=page.childNodes;
              var j=0, lim=content.length;
              while (j<lim) {
              var node=content[j++];
              if (node.nodeType===1) prepForRestore(node);}
              fdjtState.setLocal(layout_key+"#"+page.id,page.outerHTML);}};
            */


            // This is for setting individual page content, assuming
            // the page node already exists
            /*
              function setPageContent(content){
              var frag=document.createElement("div");
              frag.innerHTML=content;
              var newpage=frag.firstChild;
              var saved_ids=this.saved_ids||(this.saved_ids={});
              var all_ids=(saved_ids._all_ids)||(saved_ids._all_ids=[]);
              gatherLayoutInfo(newpage,all_ids,dups);
              var i=0, lim=all_ids.length; while (i<lim) {
              var id=all_ids[i++];
              var original=document.getElementById(id);
              if (original) {
              saved_ids[id]=original;
              original.id=null;}}
              var pagenum=parseInt(newpage.getAttribute("data-pagenum"),10);
              var curpage=document.getElementById(newpage.id);
              fdjtDOM.replace(curpage,newpage);
              if (this.page===curpage) this.page=newpage;
              pages[pagenum-1]=newpage;}
            */

            /* Finishing the page */

            var adjust_node=fdjtDOM.scaleToFit.adjust;
            function finishPage(completed) {
                completed.style.display="block";
                var undersize=hasClass(completed,"codexundersize");
                var oversize=hasClass(completed,"codexoversize");
                if (((oversize)||(undersize))) {
                    adjustFonts(completed);
                    if (scale_pages) {
                        var iw=completed.scrollWidth, ih=completed.scrollHeight;
                        var ow=completed.offsetWidth, oh=completed.offsetHeight;
                        var noscale=((oversize)?
                                     ((ih<=oh)&&(iw<=ow)):
                                     ((oh<=ih)&&(ow<=iw)&&
                                      (oh>(0.9*ih))||(ow>(0.9*iw))));
                        if (!(noscale)) {
                            completed.style.height="";
                            adjust_node(completed);}}}
                if (layout.pagedone) layout.pagedone(completed);
                dropClass(completed,"codexworkpage");
                completed.style.display=""; 
                completed.style.height="";}
            this.finishPage=finishPage;

            /* Finishing the overall layout */

            function Finish(){
                for (var dupid in dups)
                    if (dups.hasOwnProperty(dupid)) {
                        var alldups=dups[dupid];
                        var lastdup=alldups[alldups.length-1];
                        var dupstart=document.getElementById(dupid);
                        if (dupstart.tagName==="OL")
                            fixOrderedList([dupstart].concat(alldups));
                        if (dupstart.tagName==="LI") {
                            var dupi=0, ndups=alldups.length;
                            while (dupi<ndups) {
                                var dup=alldups[dupi++];
                                if (!(dup.hasAttribute(dup,"data-savedstyle"))) 
                                    dup.setAttribute(
                                        "data-savedstyle",
                                        dup.getAttribute("style")||"");
                                dup.style.listStyleType="none";}}
                        lastdup.className=lastdup.className.replace(
                                /\bcodexdup\b/,"codexdupend");}
                var middle_dups=getChildren(page,".codexdup");
                if ((middle_dups)&&(middle_dups.length)) {
                    var j=0, dl=middle_dups.length; while (j<dl) {
                        var mdup=middle_dups[j++];
                        stripBottomStyles(mdup);}}
                if (page) {
                    if (pagefn) pagefn.call(layout,page,layout);
                    page.style.height="";
                    dropClass(page,"codexworkpage");}
                var i=0; var lim= pages.length;
                while (i<lim) {
                    var p=pages[i++];
                    this.finishPage(p);}
                layout.done=fdjtTime();
                if ((layout.thenfns)&&(layout.thenfns.length)) {
                    var thenfns=layout.thenfns;
                    var f=0, nfns=thenfns.length; while (f<nfns) {
                        thenfns[f++](layout);}}}
            this.Finish=Finish;

            function fixOrderedList(ol){
                if (ol.length<2) return;
                var olpage=[]; var i=0, lim=ol.length, ntotal=0;
                while (i<lim) {
                    var dup=ol[i++];
                    var page=getParent(dup,".codexpage");
                    var pageno=(page)&&(
                        parseInt(page.getAttribute("data-pagenum"),10));
                    olpage.push({list: dup,pageno:pageno});}
                olpage.sort(function(x,y){
                    if (x.pageno>y.pageno) return 1;
                    else if (x.pageno<y.pageno) return -1;
                    else return 0;});
                i=0; lim=olpage.length; while (i<lim) {
                    var olist=olpage[i++].list;
                    var new_items=countListItems(olist);
                    if (ntotal) addEmptyItems(olist,ntotal);
                    ntotal=ntotal+new_items;}}

            function addEmptyItems(root,count){
                var frag=document.createDocumentFragment();
                while (count>0) {
                    var item=fdjtDOM("LI","empty");
                    item.setAttribute(
                        "style",
                        "visibility: hidden !important; width: 0px !important; height: 0px !important; pointer-events: none;");
                    frag.appendChild(item);
                    count--;}
                if (root.firstChild) root.insertBefore(frag,root.firstChild);
                else root.appendChild(frag);}
            function countListItems(root,count){
                if (!(count)) count=0;
                var children=root.childNodes;
                var i=0, lim=children.length;
                while (i<lim) {
                    var child=children[i++];
                    if (child.nodeType===1) {
                        if ((child.tagName==="OL")||
                            (child.tagName==="UL")) return count;
                        else if (child.tagName==="LI") count++;
                        else count=countListItems(child,count);}}
                return count;}

            /* page break predicates */
            
            function forcedBreakBefore(elt,style){
                if ((!(elt))||(elt.nodeType!==1)) return false;
                if (!(style)) style=getStyle(elt);
                return (style.pageBreakBefore==='always');}
            this.forcedBreakBefore=forcedBreakBefore;
            function mustBreakBefore(elt){
                if (forcedBreakBefore(elt)) return true;
                else if ((elt.childNodes)&&(elt.childNodes.length)) {
                    var children=elt.childNodes;
                    var i=0, lim=children.length; while (i<lim) {
                        var child=children[i];
                        if (child.nodeType===3) {
                            if (!(isEmpty(child.nodeValue))) return false;
                            else i++;}
                        else if (child.nodeType===1) 
                            return mustBreakBefore(child);
                        else i++;}
                    return false;}}
            this.mustBreakBefore=mustBreakBefore;
            
            function forcedBreakAfter(elt,style){ 
                if ((!(elt))||(elt.nodeType!==1)) return false;
                if (!(style)) style=getStyle(elt);
                return (style.pageBreakAfter==='always');}
            this.forcedBreakAfter=forcedBreakAfter;
            function mustBreakAfter(elt){
                if (forcedBreakAfter(elt)) return true;
                else if ((elt.childNodes)&&(elt.childNodes.length)) {
                    var children=elt.childNodes;
                    var i=children.length-1; while (i>=0) {
                        var child=children[i];
                        if (child.nodeType===3) {
                            if (!(isEmpty(child.nodeValue))) return false;
                            else i--;}
                        else if (child.nodeType===1) 
                            return mustBreakAfter(child);
                        else i--;}
                    return false;}}
            this.mustBreakAfter=mustBreakAfter;

            function avoidBreakInside(elt,style){
                var lh;
                if ((!(elt))||(elt.nodeType!==1)) return false;
                if (elt.tagName==='IMG') return true;
                if (!(style)) style=getStyle(elt);
                return (style.pageBreakInside==='avoid')||
                    (style.display==='table-row')||
                    /*
                    ((elt.className)&&(elt.className.search)&&
                     (elt.className.search(page_block_classes)>=0))||
                    ((avoidbreakinside)&&(testNode(elt,avoidbreakinside)))||
                    */
                    ((style.display==="block")&&
                     ((lh=parsePX(style.lineHeight))&&
                      ((lh*2.5)>elt.offsetHeight)));}
            this.avoidBreakInside=avoidBreakInside;
            function mustBreakInside(elt){
                if (avoidBreakInside(elt)) return false;
                else if ((elt.childNodes)&&(elt.childNodes.length)) {
                    var children=elt.childNodes;
                    var i=0, lim=children.length; while (i<lim) {
                        var child=children[i];
                        if (child.nodeType!==1) i++;
                        else if (forcedBreakBefore(child)) return true;
                        else if (forcedBreakAfter(child)) return true;
                        else if (mustBreakInside(child)) return true;
                        else i++;}
                    return false;}
                else return false;}
            this.mustBreakInside=mustBreakInside;
            
            function avoidBreakBefore(elt,style){
                if ((!(elt))||(elt.nodeType!==1)) return false;
                if (!(style)) style=getStyle(elt);
                return (style.pageBreakBefore==='avoid');}
            this.avoidBreakBefore=avoidBreakBefore;
            function cantBreakBefore(elt){
                if (avoidBreakBefore(elt)) return true;
                else if ((elt.childNodes)&&(elt.childNodes.length)) {
                    var children=elt.childNodes;
                    var i=0, lim=children.length; while (i<lim) {
                        var child=children[i];
                        if (child.nodeType===3) {
                            if (!(isEmpty(child.nodeValue))) return false;
                            else i++;}
                        else if (child.nodeType===1) 
                            return cantBreakBefore(child);
                        else i++;}
                    return false;}}
            this.cantBreakBefore=cantBreakBefore;

            function avoidBreakAfter(elt,style){
                if ((!(elt))||(elt.nodeType!==1)) return false;
                // Avoid breaks after headings
                if (/H\d/.exec(elt.tagName)) return true;
                if (!(style)) style=getStyle(elt);
                // Use the style information
                if (style.pageBreakAfter==='avoid') return true;
                else if ((style.pageBreakAfter)&&
                         (style.pageBreakAfter!=="auto"))
                    return false;
                else return false;}
            this.avoidBreakAfter=avoidBreakAfter;
            function cantBreakAfter(elt){
                if (avoidBreakAfter(elt)) return true;
                else if ((elt.childNodes)&&(elt.childNodes.length)) {
                    var children=elt.childNodes;
                    var i=children.length-1; while (i>=0) {
                        var child=children[i];
                        if (child.nodeType===3) {
                            if (!(isEmpty(child.nodeValue))) return false;
                            else i--;}
                        else if (child.nodeType===1) 
                            return cantBreakAfter(child);
                        else i--;}
                    return false;}}
            this.cantBreakAfter=cantBreakAfter;
            
            function checkSinglePage(elt,style){
                if ((!(elt))||(elt.nodeType!==1)) return false;
                if ((hasClass("codexsinglepage"))||(hasClass("codexfullpage")))
                    return true;
                else {
                    if (!(style)) style=getStyle(elt);
                    return ((style.pageBreakBefore==='always')&&
                            (style.pageBreakAfter==='always')&&
                            (style.pageBreakInside==='avoid'));}}
            this.checkSinglePage=checkSinglePage;

            function getPage(spec) {
                if (!(spec)) return false;
                else if (typeof spec === 'number')
                    return fdjtID(pageprefix+spec);
                else if (spec.nodeType) {
                    if (hasClass(spec,"codexpage")) return spec;
                    else return getParent(spec,".codexpage");}
                else if (typeof spec === "string")
                    return getPage(fdjtID(spec));
                else {
                    logfn("Can't determine page from %o",spec);
                    return false;}}
            this.getPage=getPage;

            function getDup(node,page){
                if (typeof node === 'string')
                    node=document.getElementById(node);
                if (!(node)) return false;
                if (hasParent(node,page)) return node;
                var nodeid=node.id;
                var duptable=layout.dups;
                var dups=duptable[nodeid];
                var i=0; var lim=dups.length;
                while (i<lim) {
                    if (hasParent(dups[i],page)) return dups[i];
                    else i++;}
                return false;}
            this.getDup=getDup;

            function gotoPage(spec) {
                var newpage=false;
                if (!(spec)) return false;
                else if (typeof spec === 'number')
                    newpage=document.getElementById(pageprefix+spec);
                else if (spec.nodeType) {
                    if (hasClass(spec,"codexpage")) newpage=spec;
                    else newpage=getParent(spec,".codexpage");}
                else if (typeof spec === "string")
                    newpage=getPage(document.getElementById(spec));
                else {
                    logfn("Can't determine page from %o",spec);
                    return false;}
                if (!(newpage)) return;
                var curpages=container.getElementsByClassName('curpage');
                if (curpages.length) dropClass(toArray(curpages),"curpage");
                addClass(newpage,"curpage");}
            this.gotoPage=gotoPage;

            this.Revert=function(){
                var i, lim;
                if (this.saved_ids) {
                    // This means that the content was explicitly set,
                    //  so we just need to restore the saved ids and clear
                    //  out the container to revert.
                    var saved=this.saved_ids, allids=saved._all_ids;
                    var crumbs=this.crumbs;
                    i=0; lim=allids.length; while (i<lim) {
                        var id=allids[i++], original;
                        if (crumbs[id]) {
                            original=document.getElementById(id);
                            var oclass=original.getAttribute("data-savedclass");
                            var ostyle=original.getAttribute("data-savedstyle");
                            var crumb=crumbs[id];
                            if (oclass) {
                                original.className=oclass;
                                original.removeAttribute("data-savedclass");}
                            if (ostyle) {
                                original.setAttribute("style",ostyle);
                                original.removeAttribute("data-savedstyle");}
                            crumb.parentNode.replaceChild(original,crumb);}
                        else if (saved[id]) {
                            original=saved[id]; if (id) original.id=id;}
                        else {}}
                    var lost=this.lostids, lostids=lost._all_ids;
                    i=0; lim=lostids.length; while (i<lim) {
                        var lostid=lostids[i++];
                        if (lostid) lost[lostid].id=lostid;}
                    this.saved_ids={}; this.dups={}; this.lostids={};
                    return;}
                // Remove any scaleboxes (save the children)
                fdjtDOM.scaleToFit.revertAll();
                revertLayout(this);};

            /* Finally return the layout */
            return this;}

        CodexLayout.timeslice=50;
        CodexLayout.timeskip=10;

        CodexLayout.tracelevel=0;
        CodexLayout.prototype.getDups=function getDups4ID(id){
            if (!(id)) return [];
            else if (id.nodeType) id=id.id;
            var base=fdjtID(id);
            var dups=this.dups[id];
            if (dups) return [base].concat(dups);
            else return false;};
        
        CodexLayout.prototype.getLayoutInfo=function getLayoutInfo(){
            var allblocks=this.allmoves;
            var npages=this.pages.length;
            var pages=new Array(npages+1);
            var pn=0; while (pn<=npages) pages[pn++]=[];
            var bn=0, blim=allblocks.length; while (bn<blim) {
                var block=allblocks[bn++];
                var page=getParent(block,".codexpage");
                if (page) {
                    var num=parseInt(page.getAttribute("data-pagenum"),10);
                    if (!(pages[num]))
                        fdjtLog.warn("weird page number: %o",num);
                    else {
                        var info={block: block};
                        if (block.id) info.id=block.id;
                        if (block.className) info.className=block.className;
                        if (block.getAttribute("data-baseid"))
                            info.baseid=block.getAttribute("data-baseid");
                        pages[num].push(info);}}
                else fdjtLog.warn("Can't find page for %o",block);}
            return pages;};

        CodexLayout.prototype.getLayoutBlocks=function getLayoutBlocks(){
            var allblocks=this.allblocks;
            var blockinfo=[];
            var i=0, lim=allblocks.length;
            while (i<lim) {
                var block=allblocks[i++];
                var page=getParent(block,".codexpage");
                var num=parseInt(page.getAttribute("data-pagenum"),10);
                var info={pagenum: num};
                var classname=block.className;
                if (block.id) info.id=block.id;
                if ((classname)&&(classname.search(/\bcodexdup/g)>=0)) 
                    info.html=block.outerHTML;
                else {
                    if (block.id) info.id=block.id;
                    if (classname.search(/\bcodexpagetop\b/)>=0)
                        info.pagetop=true;
                    if (classname.search(/\bcodexcantsplit\b/)>=0)
                        info.cantsplit=true;}
                blockinfo.push(info);}
            return {blocks: blockinfo, npages: this.pages.length,
                    height: this.height, width: this.width,
                    break_blocks: this.break_blocks};};

        /*
        CodexLayout.prototype.then=function(callback){
            if (this.done) return callback(this);
            else this.thenfns.push(callback);}; */

        CodexLayout.cache=2;

        var ondbinit=false;
        var dbinit_timeout=false;

        function indexedDB_timeout(){
            fdjtLog("Error initializing indexedDB");
            if (!(layoutDB)) {
                CodexLayout.layoutDB=layoutDB=window.localStorage;
                dbinit_timeout=false;
                if (ondbinit) ondbinit();}}

        var doinit=false;

        function useIndexedDB(dbname){
            var req=window.indexedDB.open(dbname,1);
            CodexLayout.dbname=dbname;
            dbinit_timeout=setTimeout(indexedDB_timeout,15000);
            req.onerror=function(event){
                fdjtLog("Error initializing indexedDB layout cache: %o",
                        event.errorCode);
                if (dbinit_timeout) clearTimeout(dbinit_timeout);
                CodexLayout.layoutDB=layoutDB=window.localStorage;
                doinit=ondbinit; ondbinit=false;
                if (doinit) doinit();};
            req.onsuccess=function(evt) {
                var db=evt.target.result;
                if (CodexLayout.trace)
                    fdjtLog("Using existing indexedDB layout cache");
                if (dbinit_timeout) clearTimeout(dbinit_timeout);
                CodexLayout.layoutDB=layoutDB=db;
                CodexLayout.cache=7;
                doinit=ondbinit; ondbinit=false;
                if (doinit) doinit();};
            req.onupgradeneeded=function(evt) {
                var db=evt.target.result;
                if (dbinit_timeout) clearTimeout(dbinit_timeout);
                db.onerror=function(event){
                    fdjtLog("Unexpected error caching layouts: %d",
                            event.target.errorCode);
                    event=false; // ignored
                    CodexLayout.layoutDB=layoutDB=window.localStorage;
                    if (ondbinit) ondbinit();};
                db.onsuccess=function(event){
                    if (CodexLayout.trace)
                        fdjtLog("Initialized indexedDB layout cache");
                    event=false; // ignored
                    if (ondbinit) ondbinit();};
                db.createObjectStore("layouts",{keyPath: "layout_id"});
                CodexLayout.layoutDB=layoutDB=window.localStorage;
                doinit=ondbinit; ondbinit=false;
                if (doinit) doinit();};}
        CodexLayout.useIndexedDB=useIndexedDB;
        
        if (window.indexedDB) {
            fdjt.addInit(function(){
                if (!(CodexLayout.dbname)) {
                    CodexLayout.dbname="codexlayout";
                    useIndexedDB("codexlayout");}},
                         "CodexLayoutCache");}
        
        if (window.localStorage) {
            doinit=ondbinit; ondbinit=false;
            CodexLayout.layoutDB=layoutDB=window.localStorage;
            if (doinit) doinit();}
        else {
            CodexLayout.layoutDB=layoutDB=false;
            doinit=ondbinit; ondbinit=false;
            if (doinit) doinit();}
     
        function cacheLayout(layout_id,content,pages,ondone){
            if (typeof layoutDB === "undefined") 
                ondbinit=function(){cacheLayout(layout_id,content);};
            else if (!(layoutDB)) return;
            else if ((window.Storage)&&(layoutDB instanceof window.Storage)) {
                setLocal(layout_id,content);
                if (ondone) ondone();}
            else if (window.indexedDB) {
                var txn=layoutDB.transaction(["layouts"],"readwrite");
                var storage=txn.objectStore("layouts"), req;
                req=storage.put({layout_id: layout_id,layout: content});
                req.onerror=function(event){
                    fdjtLog("Error saving layout %s: %o",
                            layout_id,event.target.errorCode);};
                req.onsuccess=function(event){
                    event=false; // ignored
                    if (ondone) ondone();
                    fdjtLog("Layout %s cached",layout_id);};}
            else CodexLayout.layoutDB=layoutDB=window.localStorage||false;}
        CodexLayout.cacheLayout=cacheLayout;
        function dropLayout(layout_id){
            var layout=false;
            if (!(layoutDB)) {}
            else if ((window.Storage)&&
                     (layoutDB instanceof window.Storage)) {
                var dropLocal=fdjtState.dropLocal;
                dropLocal(layout_id);
                droppedLayout(layout_id);}
            else {
                var txn=layoutDB.transaction(["layouts"],"readwrite");
                var storage=txn.objectStore("layouts");
                var req=storage.get(layout_id);
                var allDone=function allDone(event){
                    event=false; // ignored
                    droppedLayout(layout_id);};
                var whoops=function whoops(event) {
                    event=false; // ignored
                    fdjtLog("Error removing laytout %s",layout_id);};
                var dropRoot=function dropRoot(){
                    req=storage['delete'](layout_id);
                    req.onerror=whoops; req.onsuccess=allDone;};
                req.onerror=whoops;
                req.onsuccess=function(evt){
                    layout=((evt.target)&&(evt.target.result));
                    dropRoot();};}}
        CodexLayout.dropLayout=dropLayout;
        function fetchLayout(layout_id,callback,onerr){
            var getLocal=fdjtState.getLocal;
            var content=false, layout_key=layout_id;
            if (typeof layoutDB === "undefined") 
                ondbinit=function(){fetchLayout(layout_id,callback,onerr);};
            else if (!(layoutDB)) { 
                if (onerr) return onerr(false);
                else if (callback) return callback(false);
                else return false;}
            else if ((window.Storage)&&(layoutDB instanceof window.Storage)) {
                content=getLocal(layout_id)||false;
                if (content) cachedLayout(layout_id);
                setTimeout(function(){callback(content);},1);}
            else if (layoutDB) {
                var txn=layoutDB.transaction(["layouts"]);
                var storage=txn.objectStore("layouts");
                var req=storage.get(layout_key);
                req.onsuccess=function(evt){
                    var target=evt.target;
                    var result=((target)&&(target.result));
                    if (result) cachedLayout(layout_id);
                    if (!(result)) onerr(false);
                    else callback(result.layout);};
                req.onerror=function(event){onerr(event);};}
            else if (window.localStorage) {
                content=fdjtState.getLocal(layout_key)||false;
                if (content) cachedLayout(layout_id);
                setTimeout(function(){callback(content);},0);}
            else if (onerr)
                return onerr(false);
            else if (callback)
                return callback(false);
            else return false;}
        CodexLayout.fetchLayout=function(layout_id){
            function fetching_layout(resolve,reject){
                return fetchLayout(layout_id,resolve,reject);}
            return new Promise(fetching_layout);};
        
        CodexLayout.clearLayouts=function(){
            var layouts=fdjtState.getLocal("fdjtCodex.layouts",true);
            var i=0, lim=((layouts)&&(layouts.length)); 
            if (layouts) {
                while (i<lim) dropLayout(layouts[i++]);
                fdjtState.dropLocal("fdjtCodex.layouts");}};

        function fetchAll(callback){
            if (!(layoutDB)) return false;
            else {
                var txn=layoutDB.transaction(["layouts"],"read");
                var storage=txn.objectStore("layouts");
                var layout_ids=[];
                storage.openCursor().onsuccess=function(evt){
                    var cursor = evt.target.result;
                    if (cursor) {
                        layout_ids.push(cursor.key);
                        cursor['continue']();}
                    else callback(layout_ids);};}}
        CodexLayout.fetchAll=fetchAll;
        CodexLayout.clearAll=function(spec){
            fetchAll(function(layout_ids){
                var todrop=[]; var i=0, lim=layout_ids.length;
                if (!(lim)) {fdjtLog.warn("No layouts"); return;}
                else if (!(spec)) todrop=layout_ids;
                else while (i<lim) {
                    var id=layout_ids[i++];
                    if (id.search(spec)>=0) todrop.push(id);}
                if (todrop.length===0) {
                    fdjtLog.warn("No layouts match %s",spec);
                    return;}
                else if (spec)
                    fdjtLog.warn("Dropping %d layouts matching %s",
                                 todrop.length,spec);
                else fdjtLog.warn("Dropping %d layouts",todrop.length);
                i=0; lim=todrop.length; while (i<lim) {
                    fdjtLog.warn("Dropping layout %s",todrop[i]);
                    dropLayout(todrop[i++]);}});};
        function cachedLayout(layout_id){
            setLocal("fdjtCodex.layout("+layout_id+")",layout_id);
            pushLocal("fdjtCodex.layouts",layout_id);}
        function droppedLayout(layout_id){
            dropLocal("fdjtCodex.layout("+layout_id+")",layout_id);
            removeLocal("fdjtCodex.layouts",layout_id);
            if (CodexLayout.trace) fdjtLog("Layout %s removed",layout_id);}
        
        CodexLayout.dbname="codexlayout";

        return CodexLayout;})();


/* Mini Manual */
/*
  var layout=new CodexLayout();
  layout.addContent(node);
  layout.Finish();
  layout.Revert();

  var layout=new CodexLayout({
  page_width: 500, page_height: 500, // Dimensions
  // Where to add new pages; by default this creates a
  //  new div#CODEXPAGES.codexpages at the bottom of the BODY
  container: document.getElementByID("MYPAGES"),
  // Prefix for page element IDs, e.g. page 42 would have id MYCODEXPAGE42
  pageprefix: "MYCODEXPAGE",
  logfn: console.log, // how to log notable events
  // Layout rules:
  // Always put H1 elements on a new page
  forcebreakbefore: "H1",
  // Always follow div.signature with a page break
  forcebreakafter: "div.signature",
  // Avoid breaking inside
  avoidbreakinside: "div.code",
  // Avoid breaking before these elements
  avoidbreakbefore: "div.signature,div.attribution",
  // Avoid breaking after these elements
  avoidbreakafter: "h1,h2,h3,h4,h5,h6,h7",
  // Put this element on a page by itself
  codexfullpage: "div.titlepage",
  // Put this element on a page by itself, but don't interrupt the
  // narrative flow
  codexfloatpage: "div.illustration"});
*/

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "cd ..; make" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
