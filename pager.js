/* -*- Mode: Javascript; Character-encoding: utf-8; -*- */

/* ######################### fdjt/pager.js ###################### */

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

fdjt.Pager=
    (function(){
        "use strict";

        var fdjtDOM=fdjt.DOM;
        var addClass=fdjtDOM.addClass;
        var dropClass=fdjtDOM.dropClass;
        var getChildren=fdjtDOM.getChildren;
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
            else this.container=root.parentNode;
            this.doLayout();
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
        
        function splitChildren(root,children,h){
            var page=fdjtDOM("div.pagerblock"), pages=[page];
            var i=0, n=children.length;
            root.appendChild(page); page.setAttribute("data-pageno",pages.length);
            while (i<n) {
                var child=children[i++]; page.appendChild(child);
                if (child.nodeType===1) {
                    if (page.offsetHeight>h) {
                        var newpage=fdjtDOM("div.pagerblock",child);
                        pages.push(newpage);
                        root.appendChild(newpage);
                        newpage.setAttribute("data-pageno",pages.length);
                        page=newpage;}}
                else {page.push(child); continue;}}
            return pages;}
        
        Pager.prototype.clearLayout=function(){
            var root=this.root, children=this.children;
            var frag=document.createDocumentFragment();
            var i=0, n=children.length;
            while (i<n) {frag.appendChild(children[i++]);}
            root.innerHTML=""; root.appendChild(frag);
            this.children=false; this.pages=false;
            this.root.removeAttribute("data-npages");
            if (this.pagernav) {
                fdjtDOM.remove(this.pagernav);
                this.pagernav=false;}};

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
            if (this.layout_timer) clearTimeout(this.layout_timer);
            this.layout_timer=setTimeout(function(){
                this.layout_timer=false;
                this.refreshLayout(true);},
                                         50);};

        Pager.prototype.doLayout=function doLayout(){
            var root=this.root, container=this.container;
            var resets=makeSolid(root);
            var h=container.offsetHeight, w=container.offsetWidth;
            var cstyle=getStyle(container);
            if (cstyle.paddingTop) h=h-parsePX(cstyle.paddingTop);
            if (cstyle.borderTopWidth) h=h-parsePX(cstyle.borderTopWidth);
            if (cstyle.paddingBottom) h=h-parsePX(cstyle.paddingBottom);
            var rstyle=getStyle(root);
            if (rstyle.paddingTop) h=h-parsePX(rstyle.paddingTop);
            if (rstyle.paddingBottom) h=h-parsePX(rstyle.paddingBottom);
            if (rstyle.borderBottomWidth) h=h-parsePX(rstyle.borderBottomWidth);
            if (h<=0) {resetStyles(resets); return;}
            if (this.pages) this.clearLayout();
            addClass(root,"pagerlayout");
            var children=this.children=toArray(root.childNodes);
            var pagernav=fdjtDOM("div.pagernav");
            fdjtDOM.prepend(root,pagernav); this.pagernav=pagernav;
            h=h-pagernav.offsetHeight;
            var pages=splitChildren(root,children,h);
            if (this.focus) dropClass(this.focus,"pagerfocus");
            // if (resets.length) resetStyles(resets);
            if (pages.length) {
                dropClass(root,"pagerlayout");
                this.pages=pages; this.npages=pages.length;
                this.root.setAttribute("data-npages",this.npages);
                var focus=this.focus||pages[0].firstElementChild;
                var newpage=getParent(focus,".pagerblock");
                addClass(newpage,"pagevisible");
                addClass(focus,"pagerfocus");
                this.height=h; this.width=w;
                this.page=newpage;
                this.pageoff=pages.indexOf(newpage);}
            if (pages.length) this.setupPagernav();
            resetStyles(resets);
            return pages;};

        Pager.prototype.setupPagernav=function setPage(){
            var pagernav=this.pagernav, pages=this.pages;
            var nav_elts=[];
            var pct_width=(100/pages.length);
            var i=0, lim=pages.length;
            while (i<lim) {
                var nav_elt=fdjtDOM("span",i+1);
                nav_elt.style.width=pct_width+"%";
                pagernav.appendChild(nav_elt);
                nav_elts.push(nav_elt);
                i++;}
            var off=pages.indexOf(this.page);
            addClass(nav_elts[off],"pagevisible");
            this.showpage=nav_elts[off];
            if (this.pagernav)
                fdjtDOM.replace(this.pagernav,pagernav);
            else fdjtDOM.prepend(this.root,pagernav);
            this.nav_elts=nav_elts;};

        Pager.prototype.setPage=function setPage(arg){
            if (arg.nodeType) {
                var page=getParent(arg,".pagerblock");
                if (!(page)) return;
                if (this.page!==page) {
                    if (this.page) dropClass(this.page,"pagevisible");
                    addClass(page,"pagevisible");
                    this.page=page;
                    if (this.pagernav) {
                        if (this.showpage)
                            dropClass(this.showpage,"pagevisible");
                        var off=this.pages.indexOf(page);
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

        return Pager;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "cd ..; make" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
