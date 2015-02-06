/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/textindex.js ###################### */

/* Copyright (C) 2009-2014 beingmeta, inc.
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
/* jshint browser: true */

// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));

fdjt.TextIndex=(function(){
    "use strict";
    var fdjtString=fdjt.String;
    var fdjtDOM=fdjt.DOM;
    var stdspace=fdjtString.stdspace;
    var textify=fdjtDOM.textify;
    
    function TextIndex(opts){
        if (!(opts)) opts={};
	var stopfns=opts.stopfns||false, stopwords={};
	var rootfns=opts.rootfns||false, rootmap={};
	var termindex={}, idterms={}, allterms=[], allids=[];
        var i, lim;
	
	function _indexer(string,id){
	    var stdtext=stdspace(string).replace(/­/g,"");
	    var words=stdtext.split(/\b/g), termlist=[];
	    var i=0, lim=words.length;
	    while (i<lim) {
                var term=words[i++];
                if (term.length<2) continue;
                else if (term.search(/\w/)<0) continue;
                else if (stopwords.hasOwnProperty(term)) continue;
		else if (stopfns) {
		    var fn=0, fns=stopfns.length;
		    while (fn<fns) {
                        if ((stopfns[fn++])(term)) continue;}}
		else {
		    termlist.push(term);
		    if (rootmap.hasOwnProperty(term)) {
			var roots=rootmap[term];
			if (typeof roots === "string")
			    termlist.push(roots);
			else termlist=termlist.concat(roots);}
		    if (rootfns) {
			var rootfn=0, nrootfns=rootfns.length;
			while (rootfn<nrootfns) {
			    var r=rootfns[rootfn++](term);
			    if (typeof r === "string")
				termlist.push(r);
			    else termlist=termlist.concat(r);}}}}
	    var ti=0, tlim=termlist.length;
	    if (idterms.hasOwnProperty(id)) {
		idterms[id]=idterms[id].concat(termlist);}
	    else {
                idterms[id]=termlist;
                allids.push(id);}
	    while (ti<tlim) {
		var t=termlist[ti++];
		if (termindex.hasOwnProperty(t))
		    termindex[t].push(id);
		else {
		    allterms.push(t);
		    termindex[t]=[id];}}}

	function stopWord(s){
	    if (stopwords.hasOwnProperty(s)) return true;
	    if (stopfns) {
		var i=0, lim=stopfns.length;
		while (i<lim) {
		    if ((stopfns[i++])(s)) return true;}
		return false;}
	    else return false;}
	
	function getRoots(s){
	    var roots=rootmap[s]||[];
	    var i=0, lim=rootfns.length; while (i<lim) {
		var r=rootfns[i++](s);
		if (!(r)) {}
		else if (typeof r === "string")
		    roots.push(r);
		else roots=roots.concat(r);}
	    return roots;}
	
        function mergeTerms(){
            var i=0, lim=allterms.length;
            while (i<lim) {
                var term=allterms[i++];
                if (term.search(/[A-Z][a-z]/)===0) {
                    var lterm=term.toLowerCase();
                    if (termindex.hasOwnProperty(lterm))
                        termindex[lterm]=(
                            termindex[lterm].concat(termindex[term]));}}}
        
        function finishIndex(){
            var newterms=[], newindex={}; 
            var i=0, lim=allterms.length, moved=[];
            var capwords=this.capwords;
            while (i<lim) {
                var term=allterms[i++];
                if (term.search(/[A-Z][a-z]/)===0) {
                    var lterm=term.toLowerCase();
                    if (!(termindex.hasOwnProperty(lterm)))
                        newindex[term]=termindex[term];
                    else if (capwords.hasOwnProperty(term)) 
                        newindex[term]=termindex[term];
                    else moved.push(term);}
                else newindex[term]=termindex[term];}
            i=0; lim=moved.length; while (i<lim) {
                var move=moved[i++], l=move.toLowerCase();
                newindex[l]=newindex[l].concat(termindex[move]);}
            this.termindex=termindex=newindex;
            this.allterms=allterms=newterms;}
        
	if (!(this instanceof TextIndex))
	    return new TextIndex(opts);
	else {
	    this._indexer=_indexer;

	    if (opts.stopwords) {
		var istops=opts.stopwords;
		i=0; lim=istops.length; while (i<lim) {
		    var stop=istops[i++];
		    stopwords[stop]=stop;}}
            
            this.capwords=opts.capwords||{};
	    this.termindex=termindex;
	    this.idterms=idterms;
	    this.allterms=allterms;
	    this.allids=allids;
            this.opts=opts;
	    this.stopWord=stopWord;
	    this.getRoots=getRoots;
            this.mergeTerms=mergeTerms;
	    this.finishIndex=finishIndex;

	    return this;}}
	    
    TextIndex.prototype.indexText=function(arg,id){
        var indexer=this._indexer;
	if (typeof arg === "string") {
	    if (id) indexer(arg,id);}
	else if (arg.nodeType) {
	    if (!(id)) id=arg.id;
	    if (id) indexer(textify(arg),id);}
	else if (arg.length) {
	    var i=0, lim=arg.length; while (i<lim) {
		var node=arg[i++]; 
                if ((node.nodeType===1)&&(node.id))
		    indexer(textify(node),node.id);}}
	else {}};

    return TextIndex;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
