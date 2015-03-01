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
        /*
        function makeVisible(node){
            var style=getStyle(node), resets=[];
            while (style.display==="none") {
                var nodestyle=node.style;
                resets.push({node: node,style: node.getAttribute("style")});
                nodestyle.opacity=0; nodestyle.zIndex=-500;
                nodestyle.display='block'; nodestyle.pointerEvents='none';
                node=node.parentNode;
                style=getStyle(node);}
            return resets;}
        function resetStyles(resets) {
            var i=0, n=resets.length;
            while (i<n) {
                var reset=resets[i++];
                if (reset.style) reset.node.setAttribute("style",reset.style);
                else reset.node.removeAttribute("style");}}
        */

        Pager.prototype.clear=function(){
            var shown=getChildren(this.root,".pagervisible");
            dropClass(toArray(shown),"pagervisible");};
        
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
            this.root.removeAttribute("data-npages");};

        Pager.prototype.refreshLayout=function refreshLayout(force){
            var container=this.container;
            var h=container.offsetHeight, w=container.offsetWidth;
            if ((this.pages)&&(!(force))&&
                (this.height===h)&&(this.width===w))
                return this.pageinfo;
            else this.doLayout();};

        Pager.prototype.doLayout=function doLayout(){
            var root=this.root, container=this.container;
            var h=container.offsetHeight, w=container.offsetWidth;
            var cstyle=getStyle(container);
            if (cstyle.paddingTop) h=h-parsePX(cstyle.paddingTop);
            if (cstyle.borderTopWidth) h=h-parsePX(cstyle.borderTopWidth);
            if (cstyle.paddingBottom) h=h-parsePX(cstyle.paddingBottom);
            var rstyle=getStyle(root);
            if (rstyle.paddingBottom) h=h-parsePX(rstyle.paddingBottom);
            if (rstyle.borderBottomWidth) h=h-parsePX(rstyle.borderBottomWidth);
            if (h<=0) return;
            if (this.pages) this.clearLayout();
            // var resets=makeVisible(root);
            addClass(root,"pagerlayout");
            var children=this.children=toArray(root.childNodes);
            var pages=splitChildren(root,children,h);
            if (this.focus) dropClass(this.focus,"pagerfocus");
            // if (resets.length) resetStyles(resets);
            if (pages.length) {
                dropClass(root,"pagerlayout");
                this.pages=pages; this.npages=pages.length;
                this.root.setAttribute("data-npages",this.npages);
                var focus=this.focus||pages[0].firstElementChild;
                var newpage=getParent(focus,".pagerblock");
                addClass(newpage,"pagervisible");
                addClass(focus,"pagerfocus");
                this.height=h; this.width=w;
                this.page=newpage;
                this.pageoff=pages.indexOf(newpage);}
            return pages;};

        Pager.prototype.setPage=function setPage(arg){
            if (arg.nodeType) {
                var page=getParent(arg,".pagerblock");
                if (!(page)) return;
                if (this.page!==page) {
                    if (this.page) dropClass(this.page,"pagervisible");
                    addClass(page,"pagervisible");
                    this.page=page;}
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

        Pager.prototype.pageForward=function(){
            if (!(this.page)) return;
            else if (this.page.nextElementSibling)
                this.setPage(this.page.nextElementSibling);
            else return;};

        Pager.prototype.pageBackward=function(){
            if (!(this.page)) return;
            else if (this.page.previousElementSibling)
                this.setPage(this.page.previousElementSibling);
            else return;};

        return Pager;})();

