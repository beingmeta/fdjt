/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009-2010 beingmeta, inc.
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

/*
  _fdjtid: unique integer assigned to objects
  fdjtDB.register (assigns unique ID)
  fdjtDB.Pool (creates a pool of unique numeric IDs starting at some base)
  fdjtDB.OID (objects created within a pool)
 */

var fdjtDB=
  (function(){
    // This is the top level object/module 
    fdjtDB={};
    fdjtDB.revid="$Id$";
    fdjtDB.version=parseInt("$Revision$".slice(10,-1));


    // We allocate 16 million IDs for miscellaneous objects
    //  and use counter to track them.
    var counter=0;
    function register(x){
      return (x._fdjtid)||(x._fdjtid=(++counter));}
    fdjtDB.register=register;

    // Pools are ranges of numeric IDs which may track values
    var pools=[];
    var oid_origin=8192*8192;
    var oid_base=oid_base;
    var quanta=1024*1024;
    function Pool(name,cap,base,max) {
      if (!(cap)) cap=1024*1024;
      else if ((cap%quanta)!==0) 
	cap=((Math.floor(cap/quanta))+1)*quanta;
      else {}
      if (pools[name])
	if ((arguments.length==1)||
	    ((arguments.length==2)&&(pool.cap===cap))||
	    ((arguments.length==3)&&(pool.cap===cap)&&
	     (pool.base===base)))
	  return pools[name];
	else throw {error: "pool conflict"};
      this.name=name; this.load=0; this.cap=cap;
      this.locked=false; this.oids=[];
      if (!(base)) this.base=oid_base;
      else if ((base%quanta)!==0)
	throw { error: "bad pool base"};
      else {
	this.base=oid_base; oid_base=oid_base+cap;}
      var scan=base/quanta; var lim=scan+(cap/quanta);
      pools[name]=this;
      while (scan<lim) {
	pools[scan-oid_origin]=this;
	scan++;}
      return this;}
    fdjtDB.Pool=Pool;

    Pool.prototype.probe=function(off) {
      if (this.oids[off]) return (this.oids[off]);
      else return false;};

    Pool.prototype.ref=function(off,init) {
      if (this.oids[off]) return this.oids[off];
      if ((this.load>=0)&&(off>=this.load))
	throw { error: "OID reference out of range"};
      var consed=(init)||{};
      consed.prototype=(this.OID||OID).prototype;
      consed._fdjtid=this.base+off;
      this.oids[off]=consed;
      consed.pool=this;
      return consed;};
      
    Pool.prototype.fetch=function(oid) {
      if (typeof oid === 'number') oid=this.ref(oid);
      if (oid._fdjtstamp) return oid;
      else if (this.load) 
	return this.load(oid);
      else return oid;}

    Pool.prototype.cons=function(oid,init) {
      if (this.locked) throw { error: "locked pool"};
      var off=(this.load)++;
      oid._fdjtid=this.base+off;
      oid._fdjtstamp=new Date().getTime();
      this.oids[off]=oid;
      oid.pool=this;
      return oid;};
    
    /* Fast sets */
    function set_sortfn(a,b) {
      if (a===b) return 0;
      else if (typeof a === typeof b) {
	if (typeof a === "number")
	  return a-b;
	else if (typeof a === "string")
	  if (a<b) return -1;
	  else return 1;
	else if (a._fdjtid)
	  if (b._fdjtid) return a._fdjtid-b._fdjtid;
	  else {
	    b._fdjtid=++counter;
	    return -1;}
	else if (b._fdjtid) {
	  a._fdjtid=++counter;
	  return 1;}
	else {
	  a._fdjtid=++counter;
	  b._fdjtid=++counter;
	  return -1;}}
      else if (typeof a < typeof b) return -1;
      else return 1;
    }

    function length_sortfn(a,b) {
      if (a.length===b.length) return 0;
      else if (a.length<b.length) return -1;
      else return 1;}

    function Set(arg,destructive){
      if (!(arg)) return new Array();
      else if (arg instanceof Array)
	if (arg.length<2) return arg;
	else if ((arg._sortlen) && ((arg._sortlen) === (arg.length)))
	  return arg;
	else {
	  if (!(destructive)) arg=arg.slice(0);
	  arg.sort(_fdjt_set_sortfn);
	  var read=1; var write=1; var len=arg.length;
	  var cur=arg[0];
	  while (read<len) 
	    if (arg[read]===cur) read++;
	    else cur=arg[write++]=arg[read++];
	  arg._sortlen=write;
	  arg.length=write;
	  return arg;}
      else {
	var array=new Array(arg);
	if (typeof arg !== 'number') array._sortlen=1;
	return array;}}
    fdjtDB.Set=Set;
	
    /* These could be faster by doing a binary search
       given sortlen */
    function set_contains(set,val){
      var i=0; var len=set.length;
      while (i<len)
	if (set[i]===val) return true;
	else i++;
      return false;}
    function set_position(set,val){
      var i=0; var len=set.length;
      while (i<len)
	if (set[i]===val) return i;
	else i++;
      return -1;}

    function set_intersection(set1,set2){
      var results=new Array();
      var i=0; var j=0; var len1=set1.length; var len2=set2.length;
      while ((i<len1) && (j<len2))
	if (set1[i]===set2[j]) {
	  results.push(set1[i]); i++; j++;}
	else if (_fdjt_set_sortfn(set1[i],set2[j])<0) i++;
	else j++;
      results._sortlen=results.length;
      return results;}
    
    function set_union(set1,set2){
      var results=new Array();
      var i=0; var j=0; var len1=set1.length; var len2=set2.length;
      while ((i<len1) && (j<len2))
	if (set1[i]===set2[j]) {
	  results.push(set1[i]); i++; j++;}
	else if (set_sortfn(set1[i],set2[j])<0)
	  results.push(set1[i++]);
	else results.push(set2[j++]);
      while (i<len1) results.push(set1[i++]);
      while (j<len2) results.push(set2[j++]);
      results._sortlen=results.length;
      return results;}

    Set.intersect=function(){
      if (arguments.length===0) return new Array();
      else if (arguments.length===1)
	return fdjtSet(arguments[0],true);
      else if (arguments.length===2)
	return fdjt_intersect(fdjtSet(arguments[0],true),
			      fdjtSet(arguments[1],true));
      else {
	var i=0; while (i<arguments.length)
		   if (!(arguments[i])) return new Array();
		   else if ((typeof arguments[i] === "object") &&
			    (arguments[i] instanceof Array) &&
			    (arguments[i].length===0))
		     return new Array();
		   else i++;
	var copied=arguments.slice(0);
	copied.sort(len_sortfn);
	var results=fdjtSet(copied[0],true);
	i=1; while (i<copied.length) {
	  results=fdjt_intersect(results,fdjtSet(copied[i++],true));
	  if (results.length===0) return results;}
	return results;}};

    Set.union=function(){
      if (arguments.length===0) return new Array();
      else if (arguments.length===1) return fdjtSet(arguments[0]);
      else if (arguments.length===2)
	return fdjt_union(fdjtSet(arguments[0],true),
			  fdjtSet(arguments[1],true));
      else {
	var result=fdjtSet(arguments[0],true);
	var i=1; while (i<arguments.length) {
	  result=fdjt_union(result,fdjtSet(arguments[i++],true));}
	return result;}};

    Set.difference=function(set1,set2){
      var results=new Array();
      var i=0; var j=0;
      set1=fdjtSet(set1); set2=fdjtSet(set2);
      var len1=set1.length; var len2=set2.length;
      while ((i<len1) && (j<len2))
	if (set1[i]===set2[j]) {
	  i++; j++;}
	else if (set_sortfn(set1[i],set2[j])<0)
	  results.push(set1[i++]);
	else j++;
      while (i<len1) results.push(set1[i++]);
      results._sortlen=results.length;
      return results;};

    /* Indices */

    function Index() {
      var scalar_indices={};
      var object_indices={};
      return function(item,prop,val,add){
	var valkey; var indices=scalar_indices;
	if ((typeof val === 'string')||(typeof val === 'number'))
	  valkey=val;
	else {
	  valkey=val._fdjtid||register(val);
	  indices=object_indices;}
	if (!(item))
	  return Set(indices[prop][valkey],true);
	var index=indices[prop];
	if (!(index)) indices[prop]=index={};
	var curvals=index[valkey];
	if (curvals) {
	  var pos=set_position(curvals,val);
	  if (pos<0)
	    if (add) curvals.push(item);
	    else {}
	  else if (add) {}
	  else {
	    var sortlen=curvals._sortlen;
	    curvals.splice(pos,1);
	    if (pos<sortlen) curvals._sortlen--;}}
	else if (add)
	  index[valkey]=Set(item);
	else {}};}
    fdjtDB.Index=Index;

    /* OIDs */

    function OID(pool,arg,arg2) {
      if (this instanceof OID)
	return pool.cons(this,arg);
      else return pool.ref(arg,arg2);}
    var oid_prototype=OID.prototype;

    OID.prototype.get=function(prop){
      if (this.hasOwnProperty(prop)) return this[prop];
      else return undefined;};
    OID.prototype.getArray=function(prop){
      if (this.hasOwnProperty(prop)) {
	var val=this[prop];
	if (val instanceof Array) return val;
	else return Set(val);}
      else return [];};
    OID.prototype.add=function(prop,val){
      if (this.hasOwnProperty(prop)) {
	var cur=this[prop];
	if (cur===val) return;
	else if (cur._sortlen)
	  if (set_contains(cur,val)) return;
	  else cur.push(val);
	else this[probe]=Set([cur,val]);
	if (this.pool.index) this.pool.index(this,prop,val,true);}
      else this[prop]=val;};
    OID.prototype.drop=function(prop,val){
      var vals=false;
      if (this.hasOwnProperty(prop)) {
	if (typeof val === 'undefined') {
	  if (this.pool.index)
	    this.pool.index(this,prop,this[prop],false);
	  delete this[prop];
	  return;}
	var cur=this[prop];
	if (cur===val)
	  delete this[prop];
	else if (cur._sortlen) {
	  var sortlen=cur._sortlen;
	  var pos=set_position(cur,val);
	  if (pos>=0) {
	    cur.splice(pos,1);
	    if (pos<sortlen) cur._sortlen--;}}
	else this[probe]=Set([cur,val]);}
      else return;
      if (this.pool.index)
	this.pool.index(this,prop,val,false);};
    OID.prototype.test=function(prop,val){
      if (this.hasOwnProperty(prop)) {
	if (typeof val === 'undefined') return true;
	var cur=this[prop];
	if (cur===val) return true;
	else if (cur._sortlen)
	  if (set_contains(cur,val)) return true;
	  else return false;
	else return false;}
      else return false;};

    /* Miscellaneous array and table functions */

    function array_contains(arr,val,start){
      if (arr.indexOf)
	return (arr.indexOf(val,start)>=0);
      var i=start||0; var len=arr.length;
      while (i<len)
	if (arr[i]===val) return true;
	else i++;
      return false;}
    function array_position(arr,val,start){
      if (arr.indexOf)
	return arr.indexOf(val,start);
      var i=start||0; var len=arr.length;
      while (i<len)
	if (arr[i]===val) return i;
	else i++;
      return -1;}

    fdjtDB.add=function(obj,field,val,nodup){
      if (nodup) 
	if (obj.hasOwnProperty(field)) {
	  var vals=obj[field];
	  if (array_contains(vals,val))  
	    obj[field].push(val);
	  else {}}
	else obj[field]=new Array(val);
      else if (obj.hasOwnProperty(field))
	obj[field].push(val);
      else obj[field]=new Array(val);
      if ((obj._all) && (!(array_contains(obj._all,field))))
	obj._all.push(field);};

    fdjtDB.drop=function(obj,field,val){
      if (!(val))
	/* Drop all vals */
	obj[field]=new Array();
      else if (obj.hasOwnProperty(field)) {
	var vals=obj[field];
	var pos=array_position(vals,val);
	if (pos<0) return;
	else vals.splice(pos,1);}
      else {}};

    fdjtDB.test=function(obj,field,val){
      if (typeof val === "undefined")
	return (((obj.hasOwnProperty) ?
		 (obj.hasOwnProperty(field)) : (obj[field])) &&
		((obj[field].length)>0));
      else if (obj.hasOwnProperty(field)) 
	if (array_position(obj[field],val)<0)
	  return false;
	else return true;
      else return false;};

    fdjtDB.insert=function(array,value){
      if (array_position(array,value)<0) array.push(value);};

    fdjtDB.remove=function(array,value,count){
      var pos=fdjtIndexOf(array,value);
      if (pos<0) return array;
      array.splice(pos,1);
      if (count) {
	count--;
	while ((count>0) &&
	       ((pos=array_position(array,value,pos))>=0)) {
	  array.splice(pos,1); count--;}}
      return array;};

    fdjtDB.indexof=function(array,elt,pos){
      if (array.indexOf)
	if (pos)
	  return array.indexOf(elt,pos);
	else return array.indexOf(elt);
      else {
	var i=pos||0;
	while (i<array.length)
	  if (array[i]===elt) return i;
	  else i++;
	return -1;}};

    fdjtDB.contains=function(array,elt){
      if (array.indexOf)
	return (array.indexOf(elt)>=0);
      else {
	var i=0; var len=array.length;
	while (i<len)
	  if (array[i]===elt) return true;
	  else i++;
	return false;}};
    
    return fdjtDB;})();

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
