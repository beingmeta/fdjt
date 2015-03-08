/* -*- Mode: Javascript; Character-encoding: utf-8; -*- */

/* ######################### fdjt/pager.js ###################### */

/* Copyright (C) 2009-2015 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)

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

fdjt.Pager=
    (function(){
        "use strict";

        var fdjtDOM=fdjt.DOM;
        var fdjtLog=fdjt.Log;
        var fdjtTime=fdjt.Time;
        var addClass=fdjtDOM.addClass;
        var hasClass=fdjtDOM.hasClass;
        var dropClass=fdjtDOM.dropClass;
        var getChildren=fdjtDOM.getChildren;
        var getChild=fdjtDOM.getChild;
        var getParent=fdjtDOM.getParent;
        var getStyle=fdjtDOM.getStyle;
        var toArray=fdjtDOM.toArray;
        var parsePX=fdjtDOM.parsePX;

        function Pager(root,opts){
            if (!(this instanceof Pager))
                return new Pager(root,opts);
            if (!(opts)) opts={};
            addClass(root,"pager");
            this.root=root;
            if (opts.container)
                this.container=opts.container;
            else this.container=root.parentNode||root;
            this.packthresh=opts.packthresh||30;
            if (opts.trace) this.trace=opts.trace;
            if (opts.hasOwnProperty("initlayout")) {
                if (opts.initlayout) this.doLayout();}
            else this.doLayout();
            return this;}
        function makeSolid(node){
            var style=getStyle(node), resets=[], body=document.body;
            while ((node)&&(node!==body)) {
                var nodestyle=node.style;
                if (style.display==="none") {
                    resets.push({node: node,style: node.getAttribute("style")});
                    nodestyle.opacity=0; nodestyle.zIndex=-500;
                    nodestyle.display='block'; nodestyle.pointerEvents='none';}
                node=node.parentNode;
                style=getStyle(node);}
            return resets;}
        function resetStyles(resets) {
            var i=0, n=resets.length;
            while (i<n) {
                var reset=resets[i++];
                if (reset.style) reset.node.setAttribute("style",reset.style);
                else reset.node.removeAttribute("style");}}

        Pager.prototype.clear=function(){
            var shown=getChildren(this.root,".pagevisible");
            dropClass(toArray(shown),"pagevisible");};
        
        function doingLayout(pager,root,children,h){
            var page=fdjtDOM("div.pagerblock.working"), pages=[page];
            root.appendChild(page);
            page.setAttribute("data-pageno",pages.length);
            if (pager.trace)
                fdjtLog("Pager: %d children -> %dpx pages for\n\t%o",
                        children.length,h,root);
            return fdjt.Async.slowmap(function(child){
                var trace=pager.trace||0, started=fdjtTime();
                page.appendChild(child);
                if (child.nodeType===1) {
                    if (trace>2)
                        fdjtLog("Pager: Child#%d %o, page %d h=%d/%d for\n\t%o",
                                children.indexOf(child),child,
                                pages.length,page.offsetHeight,h,
                                root);
                    if (page.offsetHeight>h) {
                        var pagetop=child;
                        if ((pager.badBreak)&&
                            (pager.badBreak(
                                child.previousElementSibling,child))) {
                            var a=child.previousElementSibling, b=child;
                            while ((a)&&(b)&&(pager.badBreak(a,b))) {
                                b=a; a=a.previousElementSibling;}
                            if ((a)&&(b)) {
                                var scan=b;
                                pagetop=document.createDocumentFragment();
                                while ((scan)&&(scan!==child)) {
                                    pagetop.appendChild(scan);
                                    scan=scan.nextSibling;}
                                pagetop.appendChild(child);}}
                        var newpage=fdjtDOM("div.pagerblock.working",pagetop);
                        pages.push(newpage);
                        root.appendChild(newpage);
                        if (trace>1)
                            fdjtLog(
                                "Pager: new p#%d for ch#%d (h=%d) %o for\n\t%o",
                                pages.length,children.indexOf(child),
                                child.offsetHeight,child,root);
                        newpage.setAttribute("data-pageno",pages.length);
                        dropClass(page,"working");
                        page=newpage;}}
                pager.layout_used=pager.layout_used+(fdjtTime()-started);},
                                      children)
                .then(function(){pager.layoutDone(pages);})
                .catch(function(){pager.layoutDone(pages);});}
            
        Pager.prototype.reset=function(){
            this.pages=false; this.children=false;
            this.showpage=false;};

        Pager.prototype.clearLayout=function(){
            var root=this.root, children=this.children;
            var frag=document.createDocumentFragment();
            var i=0, n=children.length;
            while (i<n) {frag.appendChild(children[i++]);}
            root.innerHTML=""; root.appendChild(frag);
            this.children=false; this.pages=false;
            this.root.removeAttribute("data-npages");
            if (this.trace)
                fdjtLog("Pager: Cleared layout, restored %d children for\n\t%o",
                        children.length,root);
            if (this.pagernav) {
                fdjtDOM.remove(this.pagernav);}};

        Pager.prototype.refreshLayout=function refreshLayout(force){
            var container=this.container;
            var h=container.offsetHeight, w=container.offsetWidth;
            if ((this.pages)&&(!(force))&&
                (this.height===h)&&(this.width===w))
                return this.pageinfo;
            else this.doLayout();};
        Pager.prototype.resized=function resized(){
            this.refreshLayout();};
        Pager.prototype.changed=function changed(){
            var pager=this;
            if (this.layout_timer) clearTimeout(this.layout_timer);
            this.layout_timer=setTimeout(function(){
                pager.layout_timer=false;
                pager.refreshLayout(true);},
                                         50);};

        Pager.prototype.layoutDone=function(pages){
            var resets=this.resets, root=this.root;
            if (this.focus) dropClass(this.focus,"pagerfocus");
            this.resets=false;
            if (pages.length) {
                dropClass(root,"pagerlayout");
                this.pages=pages; this.npages=pages.length;
                this.root.setAttribute("data-npages",this.npages);
                var focus=
                    ((getParent(this.focus,root))?
                     (this.focus):(pages[0].firstElementChild));
                var newpage=getParent(focus,".pagerblock");
                addClass(newpage,"pagevisible");
                addClass(focus,"pagerfocus");
                this.page=newpage;
                this.pageoff=pages.indexOf(newpage);}
            if (this.trace)
                fdjtLog("Pager: Finished %d %dpx pages in %o/%os",
                        pages.length,this.height,
                        (this.layout_used)/1000,
                        (fdjtTime()-this.layout_started)/1000);
            if (pages.length) this.setupPagerNav();
            addClass(root,"pagerdone");
            this.layout_started=false;
            resetStyles(resets);};

        Pager.prototype.doLayout=function doLayout(){
            var root=this.root, container=this.container;
            var trace=this.trace||0, started=fdjtTime();
            if (root.childNodes.length===0) return;
            if (this.layout_started) return;
            else {
                this.layout_started=fdjtTime();
                this.layout_used=0;}
            if (trace) fdjtLog("Pager: starting layout rh=%o, ch=%o for\n\t%o",
                               root.offsetHeight,container.offsetHeight,
                               root);
            var resets=makeSolid(root), h=container.offsetHeight;
            if (trace) 
                fdjtLog("Pager: Solidified (h=%d) with %d restyles for\n\t%o",
                        h,resets.length,root);
            var cstyle=getStyle(container);
            if (cstyle.paddingTop) h=h-parsePX(cstyle.paddingTop);
            if (cstyle.borderTopWidth) h=h-parsePX(cstyle.borderTopWidth);
            if (cstyle.paddingBottom) h=h-parsePX(cstyle.paddingBottom);
            var rstyle=getStyle(root);
            if (rstyle.paddingTop) h=h-parsePX(rstyle.paddingTop);
            if (rstyle.paddingBottom) h=h-parsePX(rstyle.paddingBottom);
            if (rstyle.borderBottomWidth) h=h-parsePX(rstyle.borderBottomWidth);
            if (h<=0) {
                fdjtLog("Pager: exit because h=%d for\n\t%o",h,root);
                resetStyles(resets); return;}
            else if (trace>1) 
                fdjtLog("Pager: adjust h=%d for\n\t%o",h,root);
            else {}
            this.height=h;
            if (this.pages) this.clearLayout();
            addClass(root,"pagerlayout");
            var children=this.children=toArray(root.childNodes);
            var pagenum=fdjtDOM("div.pagenum");
            var pagernav=fdjtDOM("div.pagernav");
            fdjtDOM.prepend(root,pagernav); 
            this.pagernav=pagernav; 
            this.pagenum=pagenum;
            this.resets=resets;
            this.layout_used=fdjtTime()-started;
            doingLayout(this,root,children,h-pagernav.offsetHeight);};

        Pager.prototype.setupPagerNav=function setupPagerNav(){
            var pagernav=this.pagernav, pages=this.pages;
            var nav_elts=[];
            var pct_width=(100/pages.length);
            var i=0, lim=pages.length;
            while (i<lim) {
                var nav_elt=fdjtDOM("span",fdjtDOM("span.num",i+1));
                nav_elt.style.width=pct_width+"%";
                pagernav.appendChild(nav_elt);
                nav_elts.push(nav_elt);
                i++;}
            var off=pages.indexOf(this.page);
            if ((pagernav.offsetWidth/pages.length)<this.packthresh)
                addClass(pagernav,"packed");
            addClass(nav_elts[off],"pagevisible");
            this.showpage=nav_elts[off];
            if (this.pagenum) {
                this.pagenum.innerHTML=(off+1)+"/"+pages.length;
                pagernav.appendChild(this.pagenum);}
            fdjtDOM.prepend(this.root,pagernav);
            this.nav_elts=nav_elts;};

        Pager.prototype.setPage=function setPage(arg){
            if (arg.nodeType) {
                var page=getParent(arg,".pagerblock");
                if (!(page)) return;
                if (this.page!==page) {
                    var off=this.pages.indexOf(page);
                    if (this.page) dropClass(this.page,"pagevisible");
                    addClass(page,"pagevisible");
                    this.page=page;
                    this.pagenum.innerHTML=(off+1)+"/"+this.pages.length;
                    if (this.pagernav) {
                        if (this.showpage)
                            dropClass(this.showpage,"pagevisible");
                        var elt=this.nav_elts[off];
                        if (elt) addClass(elt,"pagevisible");
                        this.showpage=elt;}}
                if (arg===page) arg=page.firstElementChild;
                if (this.focus!==arg) {
                    if (this.focus) dropClass(this.focus,"pagerfocus");
                    addClass(arg,"pagerfocus");
                    this.focus=arg;}}
            else if (typeof arg === "number") {
                var goto=this.pages[arg];
                if (!(goto)) return;
                this.setPage(goto);}
            else return;};

        Pager.prototype.forward=function(){
            if (!(this.pages)) this.changed();
            if (!(this.page)) return;
            else if (this.page.nextElementSibling)
                this.setPage(this.page.nextElementSibling);
            else return;};

        Pager.prototype.backward=function(){
            if (!(this.pages)) this.changed();
            if (!(this.page)) return;
            else if (this.page.previousElementSibling)
                this.setPage(this.page.previousElementSibling);
            else return;};

        Pager.prototype.getNum=function(target){
            var num=((hasClass(target,"num"))?(target):
                     ((getParent(target,".num"))||
                      (getChild(target,".num"))));
            if (!(num)) return false;
            else return parseInt(num.innerHTML);};

        Pager.prototype.trace=0;

        return Pager;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "cd ..; make" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
