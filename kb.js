/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009-2011 beingmeta, inc.
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
  fdjtKB.register (assigns unique ID)
  fdjtKB.Pool (creates a pool of named objects)
  fdjtKB.Set (creates a sorted array for set operations)
  fdjtKB.Ref (objects created within a pool)
*/

var fdjtKB=
    (function(){
	// This is the top level object/module 
	fdjtKB={};
	fdjtKB.revid="$Id$";
	fdjtKB.version=parseInt("$Revision$".slice(10,-1));
	fdjtKB.persist=((window.localStorage)?(true):(false));

	// This turns on debugging, which is further controlled
	//  by properties on pools
	var debug=false;
	fdjtKB.setDebug=function(flag){debug=flag;};

	// This checks if a reference is a 'real object'
	// I.E., something which shouldn't be used as a key
	//  or fast set member and not an array either
	var arrayobjs=(typeof new Array(1,2,3) === 'object');
	var stringobjs=(typeof new String() === 'object');
	function isobject(x){
	    return ((typeof x === 'object')&&
		    (!((arrayobjs)&&(x instanceof Array))));}
	function objectkey(x){
	    if (typeof x !== 'object') return x;
	    else if (x instanceof String) return x.toString();
	    else return x._id||x._fdjtid||register(x);}
	fdjtKB.objectkey=objectkey;
	fdjtKB.isobject=isobject;
	

	// We allocate 16 million IDs for miscellaneous objects
	//  and use counter to track them.
	var counter=0;
	function register(x){
	    return (x._id)||(x._fdjtid)||(x._fdjtid=(++counter));}
	fdjtKB.register=register;
	
	// This lets us figure out what inits were run in this session.
	var init_start=fdjtTime();
	
	// Pools are uniquely named id->object mappings
	// This table maps those unique names to the objects themselves
	// Pools can have aliases, so the name->pool mapping is many to one
	var pools={};
	
	function Pool(name) {
	    if (!(name)) return this;
	    if (pools[name]) return pools[name];
	    pools[name]=this; this.name=name; this.map={};
	    this.index=false; this.storage=false;
	    this.inits=false; this.effects=false; this.xforms={};
	    // Whether _id fields in this pool are 'absolute' (globally unique)
	    this.absref=false; 
	    return this;}
	fdjtKB.Pool=Pool;
	fdjtKB.PoolRef=function(name,create){
	    if (!(name)) return this;
	    if (pools[name]) return pools[name];
	    else if (!(create)) return false;
	    else return new Pool(name);};
	
	Pool.prototype.toJSON=function(){return "@@"+this.name;};
	
	// Check if a named pool exists
	Pool.probe=function(id) {return pools[id]||false;};

	Pool.prototype.addAlias=function(name) {
	    if (pools[name])
		if (pools[name]===this) return this;
	    else throw {error: "pool alias conflict"};
	    else pools[name]=this;};

	Pool.prototype.addEffect=function(prop,handler) {
	    if (!(this.effects)) this.effects={};
	    this.effects[prop]=handler;};
	Pool.prototype.addInit=function(handler) {
	    if (!(this.inits)) this.inits=[];
	    this.inits.push(handler);};

	Pool.prototype.probe=function(id) {
	    if (this.map[id]) return (this.map[id]);
	    else return false;};

	Pool.prototype.load=function(ref) {
	    if (typeof ref==='string')
		return this.ref(ref).load();
	    else return ref.load();};

	Pool.prototype.ref=function(qid,cons) {
	    if (qid instanceof Ref) return qid;
	    if (this.map[qid]) return this.map[qid];
	    if (!(cons)) cons=this.cons(qid);
	    else if (cons instanceof Ref) {}
	    else cons=this.cons(qid);
	    if (!(cons._id)) cons._id=qid;
	    this.map[qid]=cons; cons.pool=this;
	    return cons;};
	Pool.prototype.drop=function(qid) {
	    var val=this.map[qid];
	    if ((val)&&(val.ondrop)) val.ondrop();
	    if (this.storage) this.storage.drop(val);
	    if (!(val)) return;
	    delete this.map[qid];
	    if (val.uuid) delete this.map[val.uuid];
	    if (val.oid) delete this.map[val.oid];}
	
	Pool.prototype.Import=function(data) {
	    if (data instanceof Array) {
		var i=0; var lim=data.length;
		while (i<lim) this.Import(data[i++]);
		return;}
	    else {
		var qid=data._id||data.oid||data.uuid;
		if ((debug)&&(this.traceimport))
		    fdjtLog("[%fs] Import to %s %o <== %o",
			    fdjtET(),this.name,obj,data);
		if (this.storage) this.storage.Import(data);
		if (qid) {
		    var obj=(this.map[qid]);
		    if (obj) obj.update(data);
		    else {
			obj=this.ref(qid);
			obj.init(data);}
		    return obj;}
		else return data;}};
	
	Pool.prototype.find=function(prop,val){
	    if (!(this.index)) return [];
	    return this.index(false,prop,val);};

	var uuid_pattern=
	    /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/;
	var refmaps=[];
	fdjtKB.addRefMap=function(map){
	    var i=0; var lim=refmaps.length;
	    while (i<lim) if (refmaps[i++]===map) return false;
	    refmaps.push(map);
	    return refmaps.length;};

	function getPool(arg){
	    var atpos; 
	    if (arg instanceof Ref) return arg.pool;
	    else if (typeof arg === 'number') return false;
	    else if (typeof arg === 'string') {
		var ref=parseRef(arg);
		if (ref) return ref.pool;
		else return false;}
	    else return false;}
	fdjtKB.getPool=getPool;

	function parseRef(arg,pool){
	    if (((arg[0]===':')&&(arg[1]==='@'))&&
		(((slash=arg.indexOf('/',2))>=0)))  {
		var pool=fdjtKB.PoolRef(arg.slice(1,slash+1));
		return pool.ref(arg);}
	    else if (((arg[0]==='@'))&&
		     (((slash=arg.indexOf('/',2))>=0)))  {
		var pool=fdjtKB.PoolRef(arg.slice(0,slash+1));
		return pool.ref(arg);}
	    else if ((atpos=arg.indexOf('@'))>1)  {
		var pool=fdjtKB.PoolRef(arg.slice(atpos+1));
		return pool.ref(arg.slice(0,atpos));}
	    else if (pool)
		return pool.ref(arg);
	    else if (arg.search(uuid_pattern)===0) {
		var uuid_type=arg.slice(34);
		var pool=fdjtKB.PoolRef("-UUIDTYPE="+uuid_type);
		if (pool) return pool.ref(arg);
		else return false;}
	    else if ((arg[0]===':')&&(arg[1]==='#')&&(arg[2]==='U')&&
		     (arg.search(uuid_pattern)===3)) {
		var uuid_type=arg.slice(37); var uuid=arg.slice(3);
		if ((pool)&&(pool.ref(uuid))) return pool.ref(uuid);
		var pool=fdjtKB.PoolRef("-UUIDTYPE="+uuid_type);
		if (pool) return pool.ref(uuid);
		return false;}
	    else if (refmaps.length) {
		var i=0; var lim=refmaps.length;
		while (i<lim) {
		    var refmap=refmaps[i++];
		    var ref=((typeof refmap === 'function')?
			     (refmap(arg)):(refmap[arg]));
		    if (ref) return ref;}
		return false;}
	    else if (pool) return pool.ref(arg);
	    else return false;}
	
	function getRef(arg,pool){
	    if (!(arg)) return false;
	    else if (arg instanceof Ref) return arg;
	    else if (typeof arg === 'number') return false;
	    else if (typeof arg === 'string')
		return parseRef(arg,pool);
	    else return false;}
	fdjtKB.ref=fdjtKB.getRef=getRef;
	function loadRef(arg){
	    var obj=getRef(arg);
	    if (obj) return obj.load();
	    else return undefined;}
	fdjtKB.load=fdjtKB.loadRef=loadRef;
	
	function doimport(data){
	    if (data instanceof Array) {
		var i=0; var lim=data.length; var results=[];
		while (i<lim) results.push(doimport(data[i++]));
		return results;}
	    else {
		var qid=data._id||data.uuid||data.oid;
		if (qid) {
		    var pool=getPool(qid);
		    if (pool) return pool.Import(data);
		    else return data;}
		else return data;}}
	fdjtKB.Import=doimport;

	// Array utility functions
	function arr_contains(arr,val,start){
	    return (arr.indexOf(val,start||0)>=0);}
	function arr_position(arr,val,start){
	    return arr.indexOf(val,start||0);}

	/* Fast sets */
	function set_sortfn(a,b) {
	    if (a===b) return 0;
	    else if (typeof a === typeof b) {
		if (typeof a === "number")
		    return a-b;
		else if (typeof a === "string")
		    if (a<b) return -1;
		else return 1;
		else if (a._id)
		    if (b._id)
			if (a._id<b._id) return -1;
		else if (a._id===b._id) return 0;
		else return 1;
		else return 1;
		else if (b._id) return -1;
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

	function intersection(set1,set2){
	    if (typeof set1 === 'string') set1=[set1];
	    if (typeof set2 === 'string') set2=[set2];
	    if ((!(set1))||(set1.length===0)) return [];
	    if ((!(set2))||(set2.length===0)) return [];
	    if (set1._sortlen!==set1.length) set1=Set(set1);
	    if (set2._sortlen!==set2.length) set1=Set(set2);
	    var results=new Array();
	    var i=0; var j=0; var len1=set1.length; var len2=set2.length;
	    var allstrings=set1._allstrings&&set2._allstrings;
	    var new_allstrings=true;
	    while ((i<len1) && (j<len2))
		if (set1[i]===set2[j]) {
		    if ((new_allstrings)&&(typeof set1[i] !== 'string'))
			new_allstrings=false;
		    results.push(set1[i]);
		    i++; j++;}
	    else if ((allstrings)?
		     (set1[i]<set2[j]):
		     (set_sortfn(set1[i],set2[j])<0)) i++;
	    else j++;
	    results._allstrings=new_allstrings;
	    results._sortlen=results.length;
	    return results;}
	fdjtKB.intersection=intersection;

	function difference(set1,set2){
	    if (typeof set1 === 'string') set1=[set1];
	    if (typeof set2 === 'string') set2=[set2];
	    if ((!(set1))||(set1.length===0)) return [];
	    if ((!(set2))||(set2.length===0)) return set1;
	    if (set1._sortlen!==set1.length) set1=Set(set1);
	    if (set2._sortlen!==set2.length) set2=Set(set2);
	    var results=new Array();
	    var i=0; var j=0; var len1=set1.length; var len2=set2.length;
	    var allstrings=set1._allstrings&&set2._allstrings;
	    var new_allstrings=true;
	    while ((i<len1) && (j<len2)) {
		if (set1[i]===set2[j]) {
		    i++; j++;}
		else if ((allstrings)?
			 (set1[i]<set2[j]):
			 (set_sortfn(set1[i],set2[j])<0)) {
		    if ((new_allstrings)&&(typeof set1[i] !== 'string'))
			new_allstrings=false;
		    results.push(set1[i]);
		    i++;}
		else j++;}
	    results._allstrings=new_allstrings;
	    results._sortlen=results.length;
	    return results;}
	fdjtKB.difference=difference;
	
	function union(set1,set2){
	    if (typeof set1 === 'string') set1=[set1];
	    if (typeof set2 === 'string') set2=[set2];
	    if ((!(set1))||(set1.length===0)) return set2;
	    if ((!(set2))||(set2.length===0)) return set1;
	    if (set1._sortlen!==set1.length) set1=Set(set1);
	    if (set2._sortlen!==set2.length) set2=Set(set2);
	    var results=new Array();
	    var i=0; var j=0; var len1=set1.length; var len2=set2.length;
	    var allstrings=set1._allstrings&&set2._allstrings;
	    while ((i<len1) && (j<len2))
		if (set1[i]===set2[j]) {
		    results.push(set1[i]); i++; j++;}
	    else if ((allstrings)?
		     (set1[i]<set2[j]):
		     (set_sortfn(set1[i],set2[j])<0))
		results.push(set1[i++]);
	    else results.push(set2[j++]);
	    while (i<len1) results.push(set1[i++]);
	    while (j<len2) results.push(set2[j++]);
	    results._allstrings=allstrings;
	    results._sortlen=results.length;
	    return results;}
	fdjtKB.union=union;

	function merge(set1,set2){
	    if (typeof set1 === 'string') set1=[set1];
	    if (typeof set2 === 'string') set2=[set2];
	    if ((!(set1))||(set1.length===0)) {
		set1.concat(set2);
		set1._sortlen=set2._sortlen;
		set1._allstrings=set2._allstrings;
		return set1;}
	    if ((!(set2))||(set2.length===0)) return set1;
	    var results=set1;
	    set1=[].concat(results);
	    var i=0; var j=0; var len1=set1.length; var len2=set2.length;
	    var allstrings=set1._allstrings&&set2._allstrings;
	    while ((i<len1) && (j<len2))
		if (set1[i]===set2[j]) {
		    results.push(set1[i]); i++; j++;}
	    else if ((allstrings)?
		     (set1[i]<set2[j]):
		     (set_sortfn(set1[i],set2[j])<0))
		results.push(set1[i++]);
	    else results.push(set2[j++]);
	    while (i<len1) results.push(set1[i++]);
	    while (j<len2) results.push(set2[j++]);
	    results._allstrings=allstrings;
	    results._sortlen=results.length;
	    return results;}
	fdjtKB.merge=merge;

	function overlaps(set1,set2){
	    if (typeof set1 === 'string') set1=[set1];
	    if (typeof set2 === 'string') set2=[set2];
	    if ((!(set1))||(set1.length===0)) return false;
	    if ((!(set2))||(set2.length===0)) return false;
	    if (set1._sortlen!==set1.length) set1=Set(set1);
	    if (set2._sortlen!==set2.length) set2=Set(set2);
	    var i=0; var j=0; var len1=set1.length; var len2=set2.length;
	    var allstrings=set1._allstrings&&set2._allstrings;
	    var new_allstrings=true;
	    while ((i<len1) && (j<len2))
		if (set1[i]===set2[j]) return true;
	    else if ((allstrings)?
		     (set1[i]<set2[j]):
		     (set_sortfn(set1[i],set2[j])<0)) i++;
	    else j++;
	    return false;}
	fdjtKB.overlaps=overlaps;

	/* Sets */
	/* sets are really arrays that are sorted to simplify set operations.
	   the ._sortlen property tells how much of the array is sorted */
	function Set(arg){
	    if (arguments.length===0) return [];
	    else if (arguments.length===1) {
		if (!(arg)) return [];
		else if (arg instanceof Array) {
		    if ((!(arg.length))||(arg._sortlen===arg.length))
			return arg;
		    else if (arg._sortlen) return setify(arg);
		    else return setify([].concat(arg));}
		else {
		    var result=[arg]; 
		    if (typeof arg === 'string') result._allstrings=true;
		    result._sortlen=1;
		    return result;}}
	    else {
		var result=[];
		for (arg in arguments)
		    if (!(arg)) {}
		else if (arg instanceof Array) result.concat(arg);
		else result.push(arg);
		return setify(result);}}
	fdjtKB.Set=Set;

	function setify(array) {
	    if (array._sortlen===array.length) return array;
	    // else if ((array._sortlen)&&(array._sortlen>1))
	    else if (array.length===0) return array;
	    else {
		var allstrings=true;
		for (elt in array)
		    if (typeof elt !== 'string') {allstrings=false; break;}
		array._allstrings=allstrings;
		if (allstrings) array.sort();
		else array.sort(set_sortfn);
		var read=1; var write=1; var lim=array.length;
		var cur=array[0];
		while (read<lim)
		    if (array[read]!==cur) {
			cur=array[read++]; write++;}
		else read++;
		array._sortlen=array.length=write;
		return array;}}
	
	function set_add(set,val) {
	    if (val instanceof Array) {
		var changed=false;
		for (elt in val) 
		    if (set_add(set,elt)) changed=true;
		return changed;}
	    else if (set.indexOf) {
		var pos=set.indexOf(val);
		if (pos>=0) return false;
		else set.push(val);
		return true;}
	    else {
		var i=0; var lim=set.length;
		while (i<lim)
		    if (set[i]===val) return false; else i++;
		if (typeof val !== 'string') set._allstrings=false;
		set.push(val);
		return true;}}
	
	function set_drop(set,val) {
	    if (val instanceof Array) {
		var changed=false;
		for (elt in val)
		    if (set_drop(set,elt)) changed=true;
		return changed;}
	    else if (set.indexOf) {
		var pos=set.indexOf(val);
		if (pos<0) return false;
		else set.splice(pos,1);
		return true;}
	    else {
		var i=0; var lim=set.length;
		while (i<lim)
		    if (set[i]===val) {
			array.splice(i,1);
			return true;}
		else i++;
		return false;}}
	
	/* Maps */
	function Map() {
	    this.scalar_map={}; this.object_map={};
	    return this;}
	Map.prototype.get=function(key) {
	    if (isobject(key))
		return this.object_map
	    [key._id||key.oid||key.uuid||key._fdjtid||register(key)];
	    else return this.scalar_map[key];};
	Map.prototype.set=function(key,val) {
	    if (isobject(key))
		this.object_map
	    [key._id||key.oid||key.uuid||key._fdjtid||register(key)]=val;
	    else this.scalar_map[key]=val;};
	Map.prototype.add=function(key,val) {
	    if (isobject(key)) {
		var objkey=key._id||key.oid||key.uuid||key._fdjtid||
		    register(key);
		var cur=this.object_map[objkey];
		if (!(cur)) {
		    this.object_map[objkey]=[val];
		    return true;}
		else if (!(cur instanceof Array)) {
		    if (cur===val) return false;
		    else {
			this.object_map[objkey]=[cur,val];
			return true;}}
		else if (arr_contains(cur,val)) return false;
		else {
		    cur.push(val); return true;}}
	    else  {
		var cur=this.scalar_map[key];
		if (!(cur)) {
		    this.scalar_map[key]=[val];
		    return true;}
		else if (!(cur instanceof Array)) {
		    if (cur===val) return false;
		    else {
			this.scalar_map[key]=[cur,val];
			return true;}}
		else if (arr_contains(cur,val)) return false;
		else {
		    cur.push(val); return true;}}};
	Map.prototype.drop=function(key,val) {
	    if (!(val)) {
		if (isobject(key))
		    delete this.object_map
		[key._id||key.oid||key.uuid||key._fdjtid||register(key)];
		else delete this.scalar_map[key];}
	    else if (isobject(key)) {
		var objkey=key._id||key.oid||key.uuid||key._fdjtid||
		    register(key);
		var cur=this.object_map[key];
		if (!(cur)) return false;
		else if (!(cur instanceof Array)) {
		    if (cur===val) {
			delete this.object_map[objkey];
			return true;}
		    else return false;}
		else if ((pos=arr_position(val,cur))>=0) {
		    if (cur.length===1) delete this.object_map[objkey];
		    else cur.splice(pos);
		    return true;}
		else return false;}
	    else {
		var cur=this.scalar_map[key]; var pos=-1;
		if (!(cur)) return false;
		else if (!(cur instanceof Array)) {
		    if (cur===val) {
			delete this.scalar_map[key];
			return true;}
		    else return false;}
		else if ((pos=arr_position(val,cur))>=0) {
		    if (cur.length===1)
			delete this.scalar_map[key];
		    else cur.splice(pos);
		    return true;}
		else return false;}};
	fdjtKB.Map=Map;

	/* Indices */

	function Index() {
	    var scalar_indices={};
	    var object_indices={};
	    return function(item,prop,val,add){
		var valkey; var indices=scalar_indices;
		if (!(prop))
		    return {scalars: scalar_indices, objects: object_indices};
		else if (!(val))
		    return {scalars: scalar_indices[prop],objects: object_indices[prop]};
		else if (isobject(val)) {
		    valkey=val._id||val.uuid||val.oid||val._fdjtid||
			register(val);
		    indices=object_indices;}
		else valkey=val;
		var index=indices[prop];
		if (!(item))
		    if (!(index)) return [];
		else return Set(index[valkey]);
 		var itemkey=
		    ((isobject(item))?
		     (item._id||item.uuid||item.oid||
		      item._fdjtid||register(item)):
		     (item));
		if (!(index))
		    if (add) {
			indices[prop]=index={};
			index[valkey]=[itemkey];
			return true;}
		else return false;
		var curvals=index[valkey];
		if (curvals) {
		    var pos=arr_position(curvals,itemkey);
		    if (pos<0) {
			if (add) {
			    curvals.push(itemkey);
			    return true;}
			else return false;}
		    else if (add) return false;
		    else {
			var sortlen=curvals._sortlen;
			curvals.splice(pos,1);
			if (pos<sortlen) curvals._sortlen--;
			return true;}}
		else if (add) {
		    index[valkey]=Set(itemkey);
		    return true;}
		else return false;};}
	fdjtKB.Index=Index;

	/* Refs */

	function Ref(pool,qid) {
	    if (pool) this.pool=pool;
	    if (qid) this._id=qid;
	    return this;}
	fdjtKB.Ref=Ref;
	Pool.prototype.cons=function(qid){return new Ref(this,qid);};

	Ref.prototype.load=function(){
	    if (this._init) return this;
	    else if (this.pool.storage) 
		return this.pool.storage.load(this);
	    else return undefined;};
	Ref.prototype.get=function(prop){
	    if (this.hasOwnProperty(prop)) return this[prop];
	    else if (this.pool.storage) {
		var fetched=this.pool.storage.get(this,prop);
		if (typeof fetched !== 'undefined')
		    this[prop]=fetched;
		else if (this.hasOwnProperty(prop))
		    return this[prop];
		else return fetched;}
	    else return undefined;};
	Ref.prototype.getSet=function(prop){
	    if (this.hasOwnProperty(prop)) {
		var val=this[prop];
		if (val instanceof Array)
		    if (val._sortlen===val.length) return val;
		else return setify(val);
		else return [val];}
	    else if (this.pool.storage) {
		var fetched=this.pool.storage.get(this,prop);
		if (typeof fetched !== 'undefined')
		    this[prop]=fetched;
		return setify(fetched);}
	    else return [];};
	Ref.prototype.getArray=function(prop){
	    if (this.hasOwnProperty(prop)) {
		var val=this[prop];
		if (val instanceof Array) return val;
		else return [val];}
	    else if (this.pool.storage) {
		var fetched=this.pool.storage.get(this,prop);
		if (typeof fetched !== 'undefined')
		    this[prop]=fetched;
		return [fetched];}
	    else return [];};
	Ref.prototype.add=function(prop,val){
	    if (this.pool.xforms[prop])
		val=this.pool.xforms[prop](val)||val;
	    if (this.hasOwnProperty(prop)) {
		var cur=this[prop];
		if (cur===val) return false;
		else if (cur instanceof Array)
		    if (!(set_add(cur,val))) return false;
		else {}
		else this[prop]=Set([cur,val]);}
	    else this[prop]=val;
	    if (this.pool.storage)
		this.pool.storage.add(this,prop,val);
	    if ((this.pool.effects)&&(this.pool.effects[prop]))
		this.pool.effects[prop](this,prop,val);
	    if (this.pool.index)
		this.pool.index(this,prop,val,true);};
	Ref.prototype.drop=function(prop,val){
	    if (typeof val === 'undefined') val=this[prop];
	    if (this.pool.xforms[prop])
		val=this.pool.xforms[prop](val)||val;
	    var vals=false;
	    if (this.hasOwnProperty(prop)) {
		var cur=this[prop];
		if (cur===val) delete this[prop];
		else if (cur instanceof Array) {
		    if (!(set_drop(cur,val))) return false;
		    if (cur.length===0) delete this[prop];}
		else return false;
		if (this.pool.storage)
		    this.pool.storage.drop(this,prop,val);
		if (this.pool.index)
		    this.pool.index(this,prop,val,false);
		return true;}
	    else return false;};
	Ref.prototype.test=function(prop,val){
	    if (this.pool.xforms[prop])
		val=this.pool.xforms[prop](val)||val;
	    if (this.hasOwnProperty(prop)) {
		if (typeof val === 'undefined') return true;
		var cur=this[prop];
		if (cur===val) return true;
		else if (cur instanceof Array)
		    if (arr_contains(cur,val)) return true;
		else return false;
		else return false;}
	    else if (this.pool.storage) {
		var fetched=this.pool.storage.get(this,prop);
		if (typeof fetched !== 'undefined')
		    this[prop]=fetched;
		else return false;
		if (typeof val === 'undefined') return true;
		else return this.test(prop,val);}
	    else return false;};
	Ref.prototype.ondrop=function(){
	    for (var prop in this)
		if ((prop!=='pool')&&(prop!=='qid'))
		    this.drop(prop,this[prop]);};
	function init_ref(data){
	    var pool=this.pool; var map=pool.map;
	    if ((this._init)&&(this._init>init_start)) {
		this.update_ref(data);
		return;}
	    if ((debug)&&(pool.traceref))
		fdjtLog("Initial reference to %o <== %o",this,data);
	    for (key in data)
		if (!((key==='qid')||(key==='pool'))) {
		    var value=data[key];
		    // Add ref aliases when unique
		    if ((key==='uuid')||(key==='oid')) {
			if (!(map[value])) map[value]=this;
			else if (map[value]!==this)
			    fdjtLog.warn("identifier conflict %o=%o for %o and %o",
					 key,value,map[value],this);
			else {}}
		    if (value instanceof Array) {
			var i=0; var len=value.length;
			while (i<len) this.add(key,value[i++]);}
		    else this.add(key,value);}
	    var inits=pool.inits;
	    if ((inits)&&(debug)&&(pool.traceinit))
		fdjtLog("Running pool inits for %o: %o",this,inits);
	    var i=0; var lim;
	    this._init=fdjtTime();
	    if (inits) {
		var lim=inits.length;
		while (i<lim) inits[i++](this);}
	    var inits=this._inits; delete this._inits;
	    if ((inits)&&(debug)&&(pool.traceinit))
		fdjtLog("Running delayed inits for %o: %o",this,inits);
	    if (inits) {
		delete this._inits;
		i=0; lim=inits.length;
		while (i<lim) inits[i++](this);}
	    return this;}
	Ref.prototype.init=init_ref;
	// This isn't right
	function update_ref(data){
	    var pool=this.pool; var map=pool.map;
	    for (var key in data) {
		var val=data[key], cur=this[key];
		if (val===cur) continue;
		else if (!(cur)) {
		    if (val instanceof Array) {
			var i=0, lim=val.length;
			while (i<lim) this.add(key,val[i++]);}
		    else this.add(key,val);}
		else if ((val instanceof Array)||
			 (cur instanceof Array)) {
		    var toadd=difference(val,cur);
		    var todrop=difference(cur,val);
		    var i=0; var lim=todrop.length;
		    while (i<lim) this.drop(key,todrop[i++]);
		    var i=0; var lim=toadd.length;
		    while (i<lim) this.add(key,toadd[i++]);}
		else {
		    this.drop(key,cur);
		    this.add(key,val);}}
	    return this;}
	Ref.prototype.update=update_ref;
	Ref.prototype.oninit=function(fcn,name){
	    var debugging=((debug)&&(this.pool.traceinit));
	    if (this._init) {
		if (debugging) {
		    if (name)
			fdjtLog("Init (%s) %o on pre-existing %o",name,fcn,this);
		    else fdjtLog("Init %o on pre-existing %o",fcn,this);}
		fcn(this);
		return true;}
	    else if (this._inits) {
		// Save up the init functions
		if (!(name)) {
		    if (this._inits.indexOf(fcn)<0) {
			if (debugging) fdjtLog("Delaying init on %o: %o",this,fcn);
			this._inits.push(fcn);}}
		// Don't do anything if the named init has already been added
		else if (this._inits[name]) {
		    /* Note that name can't be anything that an array object
		       might inherit (like 'length'). */ }
		else {
		    if (debugging)
			fdjtLog("Delaying init %s on %o: %o",name,this,fcn);
		    this._inits[name]=fcn;
		    this._inits.push(fcn);}}
	    else if (name) {
		if (debugging)
		    fdjtLog("Delaying init %s on %o: %o",name,this,fcn);
		this._inits=[fcn];
		this._inits[name]=fcn;}
	    else {
		fdjtLog("Delaying init on %o: %o",this,fcn);
		this._inits=[fcn];}
	    return false;};

	/* Using offline storage to back up pools
	   In the simplest model, the QID is just used as a key
	   in local storage to store a JSON version of the object. */

	function OfflineKB(pool){
	    this.pool=pool;
	    return this;}
	function offline_get(obj,prop){
	    var qid=obj._id||obj.uuid||obj.oid;
	    var data=fdjtState.getLocal(qid);
	    if (data) obj.init(data);
	    return obj[prop];}
	OfflineKB.prototype.load=function(obj){
	    var qid=obj._id||obj.uuid||obj.oid;
	    var data=fdjtState.getLocal(qid,true);
	    if (data) return obj.init(data);
	    else return undefined;};
	OfflineKB.prototype.get=offline_get;
	OfflineKB.prototype.add=function(obj,slotid,val){
	    var qid=obj._id||obj.uuid||obj.oid;
	    if ((slotid)&&(val))
		fdjtState.setLocal(qid,JSON.stringify(obj));};
	OfflineKB.prototype.drop=function(obj,slotid,val){
	    var qid=obj._id||obj.uuid||obj.oid;
	    if (!(slotid)) fdjtState.dropLocal(qid);
	    else fdjtState.setLocal(qid,JSON.stringify(obj));};
	OfflineKB.prototype.Import=function(obj){
	    var qid=obj._id||obj.uuid||obj.oid;
	    fdjtState.setLocal(qid,obj,true);};
	fdjtKB.OfflineKB=OfflineKB;
	
	/* Miscellaneous array and table functions */

	fdjtKB.add=function(obj,field,val,nodup){
	    if (arguments.length===2)
		return set_add(obj,field);
	    else if (obj instanceof Ref)
		return obj.add.apply(obj,arguments);
	    else if (nodup) 
		if (obj.hasOwnProperty(field)) {
		    var vals=obj[field];
		    if (!(arr_contains(vals,val))) obj[field].push(val);
		    else {}}
	    else obj[field]=new Array(val);
	    else if (obj.hasOwnProperty(field))
		obj[field].push(val);
	    else obj[field]=new Array(val);
	    if ((obj._all) && (!(arr_contains(obj._all,field))))
		obj._all.push(field);};

	fdjtKB.drop=function(obj,field,val){
	    if (arguments.length===2)
		return set_drop(obj,field);
	    else if (obj instanceof Ref)
		return obj.drop.apply(obj,arguments);
	    else if (!(val))
		/* Drop all vals */
		obj[field]=new Array();
	    else if (obj.hasOwnProperty(field)) {
		var vals=obj[field];
		var pos=arr_position(vals,val);
		if (pos<0) return;
		else vals.splice(pos,1);}
	    else {}};

	fdjtKB.test=function(obj,field,val){
	    if (arguments.length===2)
		return set_contains(obj,field);
	    else if (obj instanceof Ref)
		return obj.test.apply(obj,arguments);
	    else if (typeof val === "undefined")
		return (((obj.hasOwnProperty) ?
			 (obj.hasOwnProperty(field)) : (obj[field])) &&
			((obj[field].length)>0));
	    else if (obj.hasOwnProperty(field)) { 
		if (arr_position(obj[field],val)<0)
		    return false;
		else return true;}
	    else return false;};

	fdjtKB.insert=function(array,value){
	    if (arr_position(array,value)<0) array.push(value);};

	fdjtKB.remove=function(array,value,count){
	    var pos=arr_position(array,value);
	    if (pos<0) return array;
	    array.splice(pos,1);
	    if (count) {
		count--;
		while ((count>0) &&
		       ((pos=arr_position(array,value,pos))>=0)) {
		    array.splice(pos,1); count--;}}
	    return array;};

	fdjtKB.indexOf=function(array,elt,pos){
	    if (pos) return array.indexOf(elt,pos);
	    else return array.indexOf(elt);};

	fdjtKB.contains=arr_contains;
	fdjtKB.position=arr_position;
	
	return fdjtKB;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  End: ***
*/
