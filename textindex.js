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
    
    var default_stopwords_init=[
        "a","i","--","am","an","as","at","be","by","d'",
        "de","di","do","ex","he","if","in","is","it",
        "me","my","no","o'","of","on","or","so","t'",
        "to","up","us","we","ya","ye","any","are","but","can",
        "cum","des","did","ere","fer","few","for","had",
        "has","her","him","his","hoo","how","i'd","i'm",
        "its","lot","may","nor","not","off","our",
        "qua","s/p","she","ten","the",
        "via","was","who","why","yet","you","'tis",
        "amid","atop","been","both","does","doth",
        "down","d’","each","even","from","haec","hast",
        "hath","have","he'd","he's","here","hers","i'll",
        "i're","i've","into","it'd","it's","last","less",
        "like","many","mine","miss","more","most","must",
        "near","nigh","none","o'er","once","only",
        "onto","ours","over","o’","past","port","reg.",
        "sans","says","some","such","thae","than","that",
        "thee","them","then","they","thir","this","thou",
        "thro","thru","thus","till","unto","upon","upto",
        "we'd","were","what","when","whom","will","wilt",
        "with","your","yous","zero","abaft","aboon",
        "about","above","adown","afore","after","ain't","along",
        "among","anear","anent","aught","baith","being","below",
        "can't","circa","could","didst","doest","doeth","don't",
        "every","fewer","fifty","forty","gonna",
        "he'll","he're","he've","her'n","his'n","isn't","it'll",
        "maybe","might","neath","never","noone","one's","other",
        "our'n","round","shall","shalt","she'd","she's","since",
        "their","there","these","those","thro'","today",
        "under","until","we'll","we're","we've","where","which",
        "while","who'd","who's","whose","whoso","won't","would",
        "you'd","yours","youse","aboard","across",
        "allyou","amidst","anyone","aren't","around","before",
        "behind","beside","beyond","cannot","contra","couple",
        "didn't","during","either","eleven","except",
        "google","hadn't","hasn't","having","inside","itself",
        "myriad","myself","no-one","nobody","o’er",
        "quibus","she'll","she're","she've","should","sundry",
        "that'd","that's","theirs","they'd","thirty","this'd",
        "thwart","tother","toward","twelve","twenty","unless",
        "unlike","versus","wasn't","what's","whence","whilst",
        "withal","within","you'll","you're","you've","your'n",
        "against","ain’t","amongst","another","anybody",
        "astride","athwart","because","beneath","besides","between",
        "betwixt","can’t","despite","doesn't","don’t",
        "haven't","herself","himself","hisself",
        "however","hundred","isn’t","neither","nothing",
        "oneself","ourself","outside","outwith","pending","perhaps",
        "several","someone","that'll","there's",
        "they'll","they're","they've","this'll","through","thro’",
        "thyself","towards","weren't","whereby","wherein","whereof",
        "whereon","whereto","whether","whoever","without","won’t",
        "you-all","aren’t","didn’t","hadn’t","hasn’t","wasn’t",
        "doesn’t","haven’t","weren’t"];
    var default_stopwords={}; 
    var is=0, islim=default_stopwords_init.length;
    while (is<islim) {
        var stop_word=default_stopwords_init[is++];
        default_stopwords[stop_word]=stop_word;}

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
        
        function finishIndex(index){
            var newterms=[], newindex={};
            var i=0, lim=allterms.length, moved=[];
            var capwords=index.capwords;
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
            index.termindex=termindex=newindex;
            index.allterms=allterms=newterms;}
        
        if (!(this instanceof TextIndex))
            return new TextIndex(opts);
        else {
            this._indexer=_indexer;

            if (opts.stopwords) {
                var istops=opts.stopwords;
                i=0; lim=istops.length; while (i<lim) {
                    var stop=istops[i++];
                    stopwords[stop]=stop;}}
            
            if (opts.stdstops) {
                var is=0, islim=default_stopwords_init.length;
                while (is<islim) {
                    var stop_word=default_stopwords_init[is++];
                    stopwords[stop_word]=stop_word;}}

            this.capwords=opts.capwords||{};
            this.termindex=termindex;
            this.idterms=idterms;
            this.allterms=allterms;
            this.allids=allids;
            this.opts=opts;
            this.stopWord=stopWord;
            this.getRoots=getRoots;
            this.mergeTerms=mergeTerms;
            this.finishIndex=function(){finishIndex(this);};

            return this;}}

    TextIndex.default_stops=default_stopwords;
            
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

    TextIndex.prototype.prefixTree=function(){
        if (this.prefixtree) return this.prefixtree;
        else {
            var ptree=this.prefixtree={strings: []};
            var prefixAdd=fdjtString.prefixAdd;
            var allterms=this.allterms;
            var i=0, lim=allterms.length;
            while (i<lim) prefixAdd(ptree,allterms[i++]);
            return ptree;}};

    return TextIndex;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
