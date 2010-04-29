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

    // Pools are ranges of numeric IDs and may map those IDs to objects
    var pools=[];
    var oid_origin=8192*8192;
    var oid_base=oid_origin;
    var quanta=1024*1024;
    function Pool(name,cap,base,max) {
      if (!(name)) return this;
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
      this.name=name; this.load=0; this.cap=cap; this.locked=false;
      // This is the array mapping offsets to OIDs
      this.oids=[];
      if (!(base)) {
	this.base=oid_base;
	oid_base=oid_base+cap;}
      else if ((base%quanta)!==0)
	throw { error: "bad pool base"};
      else {
	this.base=base;}
      var scan=base/quanta; var lim=scan+(cap/quanta);
      pools[name]=this;
      while (scan<lim) {
	pools[scan-oid_origin]=this;
	scan++;}
      return this;}
    fdjtDB.Pool=Pool;

    Pool.probe=function(id) {return pools[id]||false;};

    Pool.prototype.probe=function(off) {
      if (this.oids[off]) return (this.oids[off]);
      else return false;};

    Pool.prototype.ref=function(off,cons) {
      if (this.oids[off]) return this.oids[off];
      if ((this.load>=0)&&(off>=this.load))
	throw { error: "OID reference out of range"};
      var consed=((cons)?(new cons()):(new OID()));
      consed._fdjtid=this.base+off;
      this.oids[off]=consed;
      consed.pool=this;
      return consed;};
      
    Pool.prototype.cons=function(val) {
      if (this.locked) throw { error: "locked pool"};
      if (val._fdjtid) return init;
      var off=(this.load)++;
      var oid=(((val)&&(val instanceof OID))?(val):(new OID()));
      oid._fdjtid=this.base+off;
      oid._fdjtstamp=new Date().getTime();
      this.oids[off]=oid;
      oid.pool=this;
      // Copy fields if neccessary
      if (oid!==val) for (key in val) oid[key]=val[key];
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

    // Array utility functions
    function contains(arr,val,start){
      if (arr.indexOf)
	return (arr.indexOf(val,start)>=0);
      var i=start||0; var len=arr.length;
      while (i<len)
	if (arr[i]===val) return true;
	else i++;
      return false;}
    function position(arr,val,start){
      if (arr.indexOf)
	return arr.indexOf(val,start);
      var i=start||0; var len=arr.length;
      while (i<len)
	if (arr[i]===val) return i;
	else i++;
      return -1;}
    function intersection(set1,set2){
      var results=new Array();
      var i=0; var j=0; var len1=set1.length; var len2=set2.length;
      while ((i<len1) && (j<len2))
	if (set1[i]===set2[j]) {
	  results.push(set1[i]); i++; j++;}
	else if (_fdjt_set_sortfn(set1[i],set2[j])<0) i++;
	else j++;
      results._sortlen=results.length;
      return results;}
    function union(set1,set2){
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

    /* Sets */
    function Set(arg,sorted){
      this.members={}; this.objects={};
      if (!(arg)) this.elements=new Array();
      else if (arg instanceof Array) {
	var unique=[];
	var i=0; var len=arg.length;
	while (i<len) {
	  var elt=arg[i++];
	  if (((typeof elt === 'string')||(typeof elt === 'number'))?
	      (this.members.hasOwnProperty(elt)):
	      (elt._fdjtid)?(this.objects.hasOwnProperty(elt._fdjtid)):
	      (this.objects.hasOwnProperty(fdjtDB.register(elt)))) {}
	  else {
	    unique.push(elt);
	    if ((typeof elt === 'string')||(typeof elt === 'number'))
	      this.members[elt]=elt;
	    else this.objects[elt._fdjtid]=true;}}
	this.elements=unique;}
      else this.elements=new Array(arg);
      if (sorted) this.sortlen=this.elements.length;
      else this.sortlen=0;
      return this;}
    fdjtDB.Set=Set;
    
    Set.prototype.get=function(){return this.elements;};
    Set.prototype.contains=function(arg){
      if (!(arg)) return false;
      else if (arg instanceof Set) return false;
      else if ((typeof arg === 'string')||(typeof arg === 'number'))
	return (this.members.hasOwnProperty(arg));
      else if (!(arg._fdjtid)) return false;
      else return (this.objects.hasOwnProperty(arg._fdjtid));};
    Set.prototype.add=function(arg){
      if (!(arg)) return false;
      else if (arg instanceof Set) {
	var add=arg.sort(set_sortfn);
	this.elements=union(this.sorted(),add);
	if (this.elements.length===this.sortlen) return false;
	else {
	  var members=this.members; var objects=this.objects;
	  var i=0; var len=add.length;
	  while (i<len) {
	    if ((typeof arg === 'string')||(typeof arg === 'number'))
	      members[add[i++]]=true;
	    else if (add[i]._fdjtid)
	      members[add[i++]._fdjtid]=true;
	    else objects[fdjtDB.register(add[i++])]=true;}
	  return true;}}
      else if (arg instanceof Array) {
	var i=0; var len=arg.length;
	while (i<len) this.add(arg[i++]);}
      else if ((typeof arg === 'string')||(typeof arg === 'number'))
	if (this.members.hasOwnProperty(arg)) return false;
	else {
	  this.members[arg]=true; this.elements.push(arg);
	  return true;}
      else {
	var id=fdjtDB.register(arg);
	if (this.objects.hasOwnProperty(id)) return false;
	else {
	  this.objects[id]=true;
	  this.elements.push(arg);}}};
    Set.prototype.drop=function(arg){
      if (!(arg)) return false;
      else if (arg instanceof Set) {
	var curlen=this.elements.length;
	var elts=arg.elements; var i=0; var len=elts.length;
	while (i<len) this.drop(elts[i++]);
	if (this.elements.length===curlen) return false;
	else return true;}
      else if (arg instanceof Array) {
	var curlen=this.elements.length;
	var elts=arg; var i=0; var len=elts.length;
	while (i<len) this.drop(elts[i++]);
	if (this.elements.length===curlen) return false;
	else return true;}
      else if ((typeof arg === 'string')||(typeof arg === 'number'))
	if (!(this.members.hasOwnProperty(arg))) return false;
	else {}
      else if (!(arg._fdjtid)) return false;
      else if (this.objects.hasOwnProperty(arg._fdjtid)) return false;
      var pos=position(arg,this.elements);
      if (pos<0) return false;
      else {
	this.elements=this.elements.splice(pos,1);
	if (pos<this.sortlen) this.sortlen--;
	return true;}};
    Set.prototype.sorted=function(arg){
      if (this.sortlen===this.elements.length) return this.elements;
      else if (this.sortlen===0) {
	this.elements.sort(set_sortfn);
	this.sortlen=this.elements.length;
	return this.elements;}
      else {
	var added=this.elements.slice(sortlen);
	added.sort(set_sortfn);
	this.elements=union(this.elements,added);
	this.sortlen=this.elements.length;
	return this.elements;}};
    
    Set.prototype.union=function(){
      var result=Set(this);
      var i=0; var len=arguments.length;
      while (i<len) result.add(arguments[i++]);
      return result;}
    Set.prototype.intersection=function(){
      var arrays=[];
      var i=0; var len=arguments.length;
      while (i<len) {
	var arg=arguments[i++];
	if (arg instanceof Set)
	  if (arg.elements.length===0) return Set();
	  else arrays.push(arg.sorted());
	else if (arg instanceof Array)
	  if (arg.length===0) return Set();
	  else {
	    var copy=[].concat(arg);
	    copy.sort(set_sortfn);
	    arrays.push(copy);}
	else arrays.push(new Array(arg));}
      arrays.sort(length_sortfn);
      var cur=arrays[0];
      i=1; while ((i<arrays.length)&&(cur.length>0)) 
	     cur=intersection(cur,arrays[i++]);
      return Set(cur,true);};
	
    /* These could be faster by doing a binary search
       given sortlen */
    function set_contains(set,val){
      var i=0; var len=set.elements.length;
      while (i<len)
	if (set[i]===val) return true;
	else i++;
      return false;}
    function set_position(set,val){
      var i=0; var len=set.elements.length;
      while (i<len)
	if (set[i]===val) return i;
	else i++;
      return -1;}

    
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
      if (!(pool)) return this;
      else if (this instanceof OID)
	return pool.cons(this,arg);
      else return pool.ref(arg,arg2);}
    fdjtDB.OID=OID;

    OID.prototype.get=function(prop){
      if (this.hasOwnProperty(prop)) return this[prop];
      else return undefined;};
    OID.prototype.getSet=function(prop){
      if (this.hasOwnProperty(prop)) {
	var val=this[prop];
	if (val instanceof Set) return val;
	else return Set(val);}
      else return [];};
    OID.prototype.add=function(prop,val){
      if (this.hasOwnProperty(prop)) {
	var cur=this[prop];
	if (cur===val) return false;
	else if (cur instanceof Set)
	  if (!(cur.add(val))) return false;
	  else {}
	else this[probe]=Set([cur,val]);
	if (this.pool.index) this.pool.index(this,prop,val,true);}
      else this[prop]=val;
      return true;};
    OID.prototype.drop=function(prop,val){
      var vals=false;
      if (this.hasOwnProperty(prop)) {
	var cur=this[prop];
	if (cur===val) delete this[prop];
	else if (cur instanceof Set) {
	  if (!(cur.drop(val))) return false;
	  if (cur.elements.length===0) delete this[prop];}
	else return false;
	if (this.pool.index) this.pool.index(this,prop,val,false);
	return true;}
      else return false;};
    OID.prototype.test=function(prop,val){
      if (this.hasOwnProperty(prop)) {
	if (typeof val === 'undefined') return true;
	var cur=this[prop];
	if (cur===val) return true;
	else if (cur instanceof Set)
	  if (cur.contains(val)) return true;
	  else return false;
	else return false;}
      else return false;};

    /* Miscellaneous array and table functions */

    fdjtDB.add=function(obj,field,val,nodup){
      if (nodup) 
	if (obj.hasOwnProperty(field)) {
	  var vals=obj[field];
	  if (contains(vals,val))  
	    obj[field].push(val);
	  else {}}
	else obj[field]=new Array(val);
      else if (obj.hasOwnProperty(field))
	obj[field].push(val);
      else obj[field]=new Array(val);
      if ((obj._all) && (!(contains(obj._all,field))))
	obj._all.push(field);};

    fdjtDB.drop=function(obj,field,val){
      if (!(val))
	/* Drop all vals */
	obj[field]=new Array();
      else if (obj.hasOwnProperty(field)) {
	var vals=obj[field];
	var pos=position(vals,val);
	if (pos<0) return;
	else vals.splice(pos,1);}
      else {}};

    fdjtDB.test=function(obj,field,val){
      if (typeof val === "undefined")
	return (((obj.hasOwnProperty) ?
		 (obj.hasOwnProperty(field)) : (obj[field])) &&
		((obj[field].length)>0));
      else if (obj.hasOwnProperty(field)) 
	if (position(obj[field],val)<0)
	  return false;
	else return true;
      else return false;};

    fdjtDB.insert=function(array,value){
      if (position(array,value)<0) array.push(value);};

    fdjtDB.remove=function(array,value,count){
      var pos=fdjtIndexOf(array,value);
      if (pos<0) return array;
      array.splice(pos,1);
      if (count) {
	count--;
	while ((count>0) &&
	       ((pos=position(array,value,pos))>=0)) {
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
