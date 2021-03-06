/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/string.js ###################### */

/* Copyright (C) 2009-2015 beingmeta, inc.
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

// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));

fdjt.String=
    (function(){
        "use strict";
        function fdjtString(string){
            if ((typeof string !== 'string')&&
                (!(string instanceof String)))
                return stringify(string);
            var output="", arg;
            var cmd=string.indexOf('%'); var i=1;
            while (cmd>=0) {
                if (cmd>0) output=output+string.slice(0,cmd);
                if (string[cmd+1]==='%') output=output+'%';
                else if (string[cmd+1]==='o') {
                    arg=arguments[i++];
                    if (typeof arg === 'string')
                        output=output+"'"+arg+"'";
                    else if (typeof arg === 'number')
                        output=output+arg;
                    else if (Array.isArray(arg)) {
                        var j=0, len=arg.length;
                        output=output+"[";
                        while (j<len) {
                            output=output+((j>0)?(","):(""))+
                                stringify(arg[j++]);}
                        output=output+"]";}
                    else output=output+stringify(arg);}
                else if (string[cmd+1]==='j') {
                    arg=arguments[i++];
                    if (Array.isArray(arg)) {
                        var k=0, lim=arg.length;
                        output=output+"[";
                        while (k<lim) {
                            output=output+((k>0)?(","):(""))+JSON.stringify(arg[k++]);}}
                    else if (typeof arg === "object") {
                        var objstr=false;
                        try {objstr=JSON.stringify(arg);}
                        catch (ex1) {
                            var norm={}; for (var p in arg) {
                                if (arg.hasOwnProperty(p)) {
                                    var pv=arg[p], nv;
                                    if (Array.isArray(pv)) {
                                        nv=[]; var ei=0, elim=pv.length;
                                        while (ei<elim) {
                                            var e=pv[ei++], sv;
                                            try {sv=fdjtString(e);}
                                            catch (ex2) {sv=e.toString();}
                                            nv.push(sv);}}
                                    else {
                                        try {nv=fdjtString(pv);}
                                        catch (ex) {nv=pv.toString();}}
                                    norm[p]=nv;}}
                            objstr=JSON.stringify(norm);}
                        output=output+objstr;}
                    else output=output+JSON.stringify(arg);}
                else if ((string[cmd+1]==='x')&&
                         (typeof arguments[i] === 'number')&&
                         (arguments[i]>=0)&&
                         ((arguments[i]%1)>=0)) {
                    arg=arguments[i++];
                    output=output+arg.toString(16);}
                else if (arguments[i])
                    output=output+arguments[i++];
                else if (typeof arguments[i] === 'undefined') {
                    output=output+'?undef?'; i++;}
                else output=output+arguments[i++];
                string=string.slice(cmd+2);
                cmd=string.indexOf('%');}
            output=output+string;
            return output;}

        var notspace=/[^ \n\r\t\f\x0b\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u202f\u205f\u3000\uf3ff]/g;

        fdjtString.nbsp="\u00A0";
        fdjtString.middot="\u00B7";
        fdjtString.emdash="\u2013";
        fdjtString.endash="\u2014";
        fdjtString.lsq="\u2018";
        fdjtString.rsq="\u2019";
        fdjtString.ldq="\u201C";
        fdjtString.rdq="\u201D";

        function stringify(arg){
            if (typeof arg === 'undefined') return '?undef?';
            else if (!(arg)) return arg;
            else if (typeof arg === 'number') return ""+arg;
            else if (arg.tagName) {
                var output="["+arg.tagName;
                if (arg.className)
                    output=output+"."+arg.className.replace(/\s+/g,'.');
                if (arg.id) output=output+"#"+arg.id;
                if (arg.name) output=output+"[name="+arg.name+"]";
                var txt=((arg.innerText)?(arg.innerText.trim()):
                         (stripMarkup(arg.innerHTML).trim()));
                if ((!(txt))||(txt.length===0)) {}
                else if (txt.length<32)
                    output=output+'\''+txt.replace(/\n/g,'\\n')+'\'';
                else output=output+'\''+txt.slice(0,16).replace(/\n/g,'\\n')+'\'...';
                return output+"]";}
            else if (arg.nodeType) {
                if (arg.nodeType===3)
                    return '["'+arg.nodeValue+'"]';
                else return '<'+arg.nodeType+'>';}
            else if (arg.oid) return arg.oid;
            else if (arg._fdjtid) return '#@'+arg._fdjtid;
            else if ((arg.type)&&((arg.target)||(arg.srcElement))) {
                var target=arg.target||arg.srcElement;
                return "["+arg.type+"@"+stringify(target)+
                    ((((arg.target)||(arg.srcElement)).nodeType)?
                     (getDOMEventInfo(arg)):(""))+"]";}
            else return ""+arg;}

        function getDOMEventInfo(arg){
            var info="(m="+
                ((arg.shiftKey===true)?"s":"")+
                ((arg.ctrlKey===true)?"c":"")+
                ((arg.metaKey===true)?"m":"")+
                ((arg.altKey===true)?"a":"")+
                ((typeof arg.button !== "undefined")?
                 (",b="+(arg.button)):(""))+
                ((typeof arg.which !== "undefined")?
                 (",w="+(arg.which)):(""));
            var ox=arg.clientX, oy=arg.clientY;
            if ((typeof ox === "number")||(typeof oy === "number"))
                info=info+",cx="+ox+",cy="+oy;
            if (arg.touches)
                info=info+",touches="+arg.touches.length;
            if (arg.keyCode) info=info+",kc="+arg.keyCode;
            if (arg.charCode) info=info+",cc="+arg.charCode;
            return info+")";}

        var spacechars=" \n\r\t\f\x0b\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u202f\u205f\u3000\uf3ff";

        fdjtString.truncate=function(string,lim){
            if (!(lim)) lim=42;
            if (string.length<lim) return string;
            else return string.slice(0,lim);};

        var floor=Math.floor;

        function ellipsize(string,lim,fudge){
            var before, after;
            var chopped, broke;
            if (typeof fudge !== 'number') fudge=0.1;
            if (!(lim)) return string;
            else if (typeof lim === "number") {}
            else if (lim.constructor === Array) {
                before=lim[0]||0; after=lim[1]||0; lim=after+before;}
            else return string;
            if (!(lim)) return string;
            else if (string.length<(lim+floor(fudge*lim)))
                return string;
            else if ((before)&&(after)) {
                var len=string.length;
                var start, end; // of the elided text
                if (/\s/.test(string[before])===0) 
                    start=before;
                else {
                    chopped=string.slice(0,before);
                    broke=chopped.search(/\s+\w+$/);
                    if (broke>0) start=broke; else start=before;}
                if (/\s/.test(string[len-after])===0) end=len-after;
                else {
                    chopped=string.slice(len-after);
                    broke=chopped.search(/\s+/);
                    if (broke>0) end=(len-after)+broke;
                    else end=after;}
                return [string.slice(0,start),string.slice(end)];}
            else {
                var edge=string[lim];
                if (/\s/.test(edge)===0) 
                    return string.slice(0,lim);
                else {
                    chopped=string.slice(0,lim);
                    broke=chopped.search(/\s+\w+$/);
                    if (broke>0) return chopped.slice(0,broke);
                    else return chopped;}}}
        fdjtString.ellipsize=ellipsize;
                
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
        fdjtString.isEmpty=isEmpty;

        fdjtString.findSplit=function(string,split,escape){
            var start=0;
            var next;
            while ((next=string.indexOf(split,start))>=0) 
                if ((escape) && (next>0) && (string[next-1]===escape))
                    start=next+1;
            else return next;
            return -1;};

        fdjtString.split=function(string,split,escape,mapfn){
            if ((mapfn) || (escape)) {
                var results=[];
                var start=0; var next;
                while ((next=string.indexOf(split,start))>=0) 
                    if ((escape) && (next>0) && (string[next-1]===escape))
                        start=next+1;
                else if ((mapfn) && (next>start)) {
                    results.push(mapfn(string.slice(start,next))); start=next+1;}
                else if (next>start) {
                    results.push(string.slice(start,next)); start=next+1;}
                else start=next+1;
                if (string.length>start)
                    if (mapfn) results.push(mapfn(string.slice(start)));
                else results.push(string.slice(start));
                return results;}
            else return string.split(split);};

        fdjtString.semiSplit=function(string,escape,mapfn){
            if ((mapfn) || (escape)) {
                var results=[];
                var start=0; var next;
                while ((next=string.indexOf(';',start))>=0) 
                    if ((escape) && (next>0) && (string[next-1]===escape))
                        start=next+1;
                else if ((mapfn) && (next>start)) {
                    results.push(mapfn(string.slice(start,next))); start=next+1;}
                else if (next>start) {
                    results.push(string.slice(start,next)); start=next+1;}
                else start=next+1;
                if (string.length>start)
                    if (mapfn) results.push(mapfn(string.slice(start)));
                else results.push(string.slice(start));
                return results;}
            else return string.split(';');};

        fdjtString.lineSplit=function(string,escape,mapfn){
            if ((mapfn) || (escape)) {
                var results=[];
                var start=0; var next;
                while ((next=string.indexOf('\n',start))>=0) 
                    if ((escape) && (next>0) && (string[next-1]===escape))
                        start=next+1;
                else if ((mapfn) && (next>start)) {
                    results.push(mapfn(string.slice(start,next))); start=next+1;}
                else if (next>start) {
                    results.push(string.slice(start,next)); start=next+1;}
                else start=next+1;
                if (string.length>start)
                    if (mapfn) results.push(mapfn(string.slice(start)));
                else results.push(string.slice(start));
                return results;}
            else return string.split('\n');};

        function trim(string){
            var start=0; var len=string.length; 
            if (len<=0) return string;
            while ((start<len)&&
                   (spacechars.indexOf(string.charAt(start))>-1))
                start++;
            if (start===len) return "";
            var end=len-1;
            while ((end>start)&&(spacechars.indexOf(string.charAt(end))>-1))
                end--;
            if ((start>0)||(end<len)) return string.slice(start,end+1);
            else return string;}
        fdjtString.trim=trim;

        function stdspace(string){
            string=string.replace(/\s+/g," ");
            var start=0; var len=string.length; 
            if (len<=0) return string;
            while ((start<len)&&
                   (spacechars.indexOf(string.charAt(start))>-1))
                start++;
            if (start===len) return "";
            var end=len-1;
            while ((end>start)&&(spacechars.indexOf(string.charAt(end))>-1))
                end--;
            if ((start>0)||(end<len)) return string.slice(start,end+1);
            else return string;}
        fdjtString.stdspace=stdspace;

        function stdcap(string){
            var somecaps=
                string.search(/(^|\s)[ABCDEFGHIJKLMNOPQRSTUVWXYZ]/g)>=0;
            if (!(somecaps))
                return string.replace(/\s+/g," ").replace(/(^ | $)/g,"");
            var words=string.split(/\s+/g);
            var i=0, lim=words.length; while (i<lim) {
                var word=words[i];
                var weird=word.slice(1).search(/[ABCDEFGHIJKLMNOPQRSTUVWXYZ]/)>=0;
                if (!(weird)) 
                    words[i]=word[0].toUpperCase()+word.slice(1);
                i++;}
            return words.join(" ");}
        fdjtString.stdcap=stdcap;

        function flatten(string){
            return string.replace(/\s+/g," ");}
        fdjtString.flatten=flatten;

        function oneline(string){
            string=trim(string);
            var flat=string.replace(/\s*[\f\n\r]+\s+/gm," //\u00B7 ").
                replace(/\s*[\f\n\r]+\s*/gm," // ");
            var tight=flat.replace(/\s\s+/g,"");
            return tight;}
        fdjtString.oneline=oneline;

        function stripMarkup(string){
            return string.replace(/<[^>]*>/g,"");}
        fdjtString.stripMarkup=stripMarkup;

        function unEscape(string){
            if (string.indexOf('\\')>=0)
                return string.replace(/\\(.)/g,"$1");
            else return string;}
        fdjtString.unEscape=unEscape;

        function normstring(string){
            return string.replace(/\W*\s\W*/g," ").toLowerCase();}
        fdjtString.normString=normstring;

        var entities={};
        fdjtString.entities=entities;
        function dCharCode(whole,paren){
            return String.fromCharCode(parseInt(paren,10));}
        function xCharCode(whole,paren){
            return String.fromCharCode(parseInt(paren,16));}
        function nCharCode(whole,paren){
            return fdjt.charnames[paren]||"&"+paren+";";}
        function expandEntity(whole,paren){
            if (entities.hasOwnProperty(paren))
                return entities[paren];
            else return "&"+paren+";";}
        function decodeEntities(string) {
            return string.replace(/&#(\d+);/g,dCharCode).
                replace(/&#x([0123456789ABCDEFabcdef]+);/g,xCharCode).
                replace(/&([abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.]+)/g,
                        nCharCode).
                replace(/&([A-Za-z][A-Za-z0-9-_.]+;)/g,
                        expandEntity);}
        fdjtString.decodeEntities=decodeEntities;
        function expandEntities(string) {
            return string.replace(/&([A-Za-z][A-Za-z0-9-_.]+);/g,
                                  expandEntity);}
        fdjtString.expandEntities=expandEntities;

        var numpat=/^\d+(\.\d+)$/;
        function getMatch(string,rx,i,literal){
            var match=rx.exec(string);
            if (typeof i === "undefined") i=0;
            if ((match)&&(match.length>i)) {
                if (literal) return match[i];
                else if (numpat.test(match[i]))
                    return parseFloat(match[i]);
                else return match[i];}
            else return false;}
        fdjtString.getMatch=getMatch;

        function segment(string,brk,start,keepspace) {
            if (start) string=string.slice(start);
            var brk_source=((typeof brk === "string")?(brk):(brk.source));
            var brk_flags=((typeof brk === "string")?(""):
                           ((brk.ignoreCase)?("i"):("")));
            var brkpat=new RegExp("("+brk_source+")",brk_flags);
            var results=[], segs=string.split(brkpat);
            var i=0, lim=segs.length, merged=false; while (i<lim) {
                var seg=segs[i++], sep=segs[i++];
                if ((!(seg))||(seg.search(/\S/)<0)) continue;
                if ((seg.length)&&(seg.slice(-1)==="\\")&&
                    ((seg.length<2)||(seg.slice(-2,-1)!=="\\"))) {
                    var unescaped=seg.slice(0,-1)+sep;
                    if (merged) merged=merged+unescaped;
                    else merged=unescaped;}
                else if (merged) {
                    if (keepspace)
                        results.push(merged+seg);
                    else results.push(stdspace(merged+seg));
                    merged=false;}
                else if (keepspace)
                    results.push(seg);
                else results.push(stdspace(seg));}
            return results;}
        fdjtString.segment=segment;
        
        function padNum(num,digits,prec){
            var ndigits=
                ((num<10)?(1):(num<100)?(2):(num<1000)?(3):(num<10000)?(4):
                 (num<100000)?(5):(num<1000000)?(6):(num<1000000)?(7):
                 (num<100000000)?(8):(num<1000000000)?(9):(num<10000000000)?(10):(11));
            if ((!(prec))&&(digits<0)) {prec=-digits; digits=0;}
            var nzeroes=digits-ndigits; var numstring=num.toString();
            var point=numstring.indexOf('.');
            var prefix=""; var suffix=""; var j;
            if (prec) {
                if ((point>=0)&&((point+prec)<numstring.length))
                    numstring=numstring.slice(0,point+prec+1);
                else if ((point<0)||(numstring.length<(point+prec+1))) {
                    j=0; var pad=(point+prec+1)-numstring.length;
                    if (point<0) suffix=suffix+".";
                    while (j<pad) {suffix=suffix+"0"; j++;}}}
            switch (nzeroes) {
            case 0: prefix=""; break;
            case 1: prefix="0"; break;
            case 2: prefix="00"; break;
            case 3: prefix="000"; break;
            case 4: prefix="0000"; break;
            case 5: prefix="00000"; break;
            case 6: prefix="000000"; break;
            case 7: prefix="0000000"; break;
            case 8: prefix="00000000"; break;
            case 9: prefix="000000000"; break;
            case 10: prefix="0000000000"; break;
            default: {
                j=0; while (j<nzeroes) {prefix=prefix+"0"; j++;}}}
            return prefix+numstring+suffix;}
        fdjtString.padNum=padNum;

        function precString(num,prec){
            var numstring=num.toString();
            var suffix="";
            if ((typeof prec === 'number')&&
                (prec>=0)&&(prec<100)) {
                var point=numstring.indexOf('.');
                if ((point>=0)&&((point+prec)<numstring.length))
                    numstring=numstring.slice(0,point+prec+1);
                else if ((point<0)||(numstring.length<(point+prec+1))) {
                    var j=0; var pad=(point+prec+1)-numstring.length;
                    if (point<0) suffix=".";
                    while (j<=pad) {suffix=suffix+"0"; j++;}}}
            return numstring+suffix;}
        fdjtString.precString=precString;

        /* Getting initials */

        function getInitials(string,n){
            var words=string.split(/\W/); var initials="";
            var i=0; var lim=((n)&&(n<words.length))?(n):(words.length);
            while (i<lim) {
                var word=words[i++];
                if (word.length)
                    initials=initials+word.slice(0,1);}
            return initials;}
        fdjtString.getInitials=getInitials;

        /* More string functions */

        function hasPrefix(string,prefix){
            return ((string.indexOf(prefix))===0);}
        fdjtString.hasPrefix=hasPrefix;

        function hasSuffix(string,suffix){
            return ((string.lastIndexOf(suffix))===(string.length-suffix.length));}
        fdjtString.hasSuffix=hasSuffix;

        function commonPrefix(string1,string2,brk,foldcase){
            var i=0; var last=-1;
            while ((i<string1.length) && (i<string2.length)) {
                if ((string1[i]===string2[i])||
                    ((foldcase)&&
                     (string1[i].toLowerCase()===string2[i].toLowerCase()))) {
                    if (brk) {
                        if (brk===string1[i]) {last=i-1; i++;}
                        else i++;}
                    else last=i++;}
                else break;}
            if (last>=0) return string1.slice(0,last+1);
            else return false;}
        fdjtString.commonPrefix=commonPrefix;

        function commonSuffix(string1,string2,brk,foldcase){
            var i=string1.length, j=string2.length; var last=0;
            while ((i>=0) && (j>=0)) {
                if ((string1[i]===string2[j])||
                    ((foldcase)&&
                     (string1[i].toLowerCase()===string2[i].toLowerCase()))) {
                    if (brk) {
                        if (brk===string1[i]) {last=i+1; i--; j--;}
                        else {i--; j--;}}
                    else {last=i; i--; j--;}}
                else break;}
            if (last>0) return string1.slice(last);
            else return false;}
        fdjtString.commonSuffix=commonSuffix;

        function stripSuffix(string){
            var start=string.search(/\.\w+$/);
            if (start>0) return string.slice(0,start);
            else return string;}
        fdjtString.stripSuffix=stripSuffix;

        function arrayContains(array,element){
            if (array.indexOf)
                return (array.indexOf(element)>=0);
            else {
                var i=0; var len=array.length;
                while (i<len)
                    if (array[i]===element) return true;
                else i++;
                return false;}}

        function add_prefix(ptree,string,i) {
            var strings=ptree.strings;
            if (i===string.length) 
                if ((strings.indexOf) ?
                    (strings.indexOf(string)>=0) :
                    (arrayContains(strings,string)))
                    return false;
            else {
                strings.push(string);
                return true;}
            else if (ptree.splits) {
                var splitchar=string[i];
                var split=ptree[splitchar];
                if (!(split)) {
                    // Create a new split
                    split={};
                    split.strings=[];
                    // We don't really use this, but it might be handy for debugging
                    split.splitchar=splitchar;
                    ptree[splitchar]=split;
                    ptree.splits.push(split);}
                if (add_prefix(split,string,i+1)) {
                    strings.push(string);
                    return true;}
                else return false;}
            else if (ptree.strings.length<5)
                if ((strings.indexOf) ?
                    (strings.indexOf(string)>=0) :
                    (arrayContains(strings,string)))
                    return false;
            else {
                strings.push(string);
                return true;}
            else {
                // Subdivide
                ptree.splits=[];
                var pstrings=ptree.strings;
                var j=0; while (j<pstrings.length)
                    add_prefix(ptree,pstrings[j++],i);
                return add_prefix(ptree,string,i);}}
        function prefixAdd(ptree,string,i) {
            if ((typeof i !== "number")||(i<0)) i=0;
            return add_prefix(ptree,string,i);}
        fdjtString.prefixAdd=prefixAdd;

        function find_prefix(ptree,prefix,i,plen){
            if (!(plen)) plen=prefix.length;
            if (i===plen)
                return ptree.strings;
            else if (ptree.strings.length<=5) {
                var strings=ptree.strings;
                var results=[];
                var j=0; while (j<strings.length) {
                    var string=strings[j++];
                    if (hasPrefix(string,prefix)) results.push(string);}
                if (results.length) return results;
                else return false;}
            else {
                var split=ptree[prefix[i]];
                if (split) return find_prefix(split,prefix,i+1,plen);
                else return false;}}
        function prefixFind(ptree,prefix,i,plen){
            if ((typeof i !== "number")||(i<0)) i=0;
            if (!(plen)) plen=prefix.length;
            return find_prefix(ptree,prefix,i,plen);}
        fdjtString.prefixFind=prefixFind;

        function paraHash(node){
            var text=((typeof node.innerText === "string")?
                      (node.innerText):(stripMarkup(node.innerHTML)));
            var words=text.split(/\W*\S+\W*/g);
            var len=words.length;
            return "_H"+
                ((len>0)?(words[0][0]):".")+
                ((len>1)?(words[1][0]):".")+
                ((len>2)?(words[2][0]):".")+
                ((len>3)?(words[3][0]):".")+
                ((len>0)?(words[len-1][0]):".")+
                ((len>1)?(words[len-2][0]):".")+
                ((len>2)?(words[len-3][0]):".")+
                ((len>3)?(words[len-4][0]):".");}
        fdjtString.paraHash=paraHash;

        function escapeRegExp(str) {
            return (str+"").replace(
                    /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,"\\$&");}
        fdjtString.escapeRegExp=escapeRegExp;
        fdjtString.escapeRX=escapeRegExp;

        fdjtString.templates={};

        function fillIn(text,data){
            /* Filling in templates */
            var dom=false;
            if (typeof data === "string") {
                var tmp=data; data=text; text=tmp;}
            if ((!(text))&&(data)&&(data.template)) text=data.template;
            else if ((!(data))&&(text.template)) {
                data=text; text=data.template;}
            // Maybe a warning?
            if (typeof text === "string") {}
            else if (text.nodeType===3) {
                dom=text; text=dom.nodeValue;}
            else if (text.nodeType===1) {
                dom=text; text=dom.innerHTML;}
            else {
                fdjt.Log.warn("Bad argument %o to Template",text);
                return;}
            var substs=text.match(/\{\{\w+(\|([^\}])*)?\}\}/gm), done={};
            if ((substs)&&(substs.length)) {
                var i=0, n=substs.length; while (i<n) {
                    var match=substs[i++];
                    var prop=match.slice(2,-2);
                    var bar=prop.search(/\|/);
                    var propname=((bar>=0)?(prop.slice(0,bar)):(prop));
                    if ((done[prop])||(done[propname])) continue;
                    else if (data.hasOwnProperty(propname)) {
                        var val=data[propname];
                        done[propname]=prop;
                        if (val) {
                            var pat=new RegExp(
                                "\\{\\{"+propname+"(\\|[^\\}]*)?\\}\\}","gm");
                            var stringval=val.toString();
                            text=text.replace(pat,stringval);}}
                    else if (bar>0) {
                        var replace=prop.slice(bar+1);
                        text=text.replace("{{"+prop+"}}",replace);
                        done[prop]=prop;}
                    else fdjt.Log.warn(
                        "No data for %s in %j to substitute for %s",
                        propname,data,"{{"+prop+"}}");}}
            if (dom) {
                if (dom.nodeType===3) dom.nodeValue=text;
                else dom.innerHTML=text;
                return dom;}
            else return text;}
        fdjtString.fillIn=fillIn;
        
        return fdjtString;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
