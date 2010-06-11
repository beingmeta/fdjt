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
  fdjtKB.register (assigns unique ID)
  fdjtKB.Pool (creates a pool of named objects)
  fdjtKB.Set (creates a sorted array for set operations)
  fdjtKB.KNode (objects created within a pool)
 */

var fdjtKB=
    (function(){
	// This is the top level object/module 
	fdjtKB={};
	fdjtKB.revid="$Id$";
	fdjtKB.version=parseInt("$Revision$".slice(10,-1));
	fdjtKB.persist=((window.localStorage)?(true):(false));

	// We allocate 16 million IDs for miscellaneous objects
	//  and use counter to track them.
	var counter=0;
	function register(x){
	    return (x._fdjtid)||(x._fdjtid=(++counter));}
	fdjtKB.register=register;

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
	    this.absref=false; // Whether names in this pool are 'absolute'
	    return this;}
	fdjtKB.Pool=Pool;
	fdjtKB.PoolRef=Pool;
	
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

	Pool.prototype.ref=function(qid,cons) {
	    if (this.map[qid]) return this.map[qid];
	    if (!(cons)) cons=this.cons(qid);
	    else if (cons instanceof KNode) {}
	    else cons=this.cons(qid);
	    if (!(cons.qid)) cons.qid=qid;
	    this.map[qid]=cons; cons.pool=this;
	    return cons;};
	
	Pool.prototype.Import=function(data) {
	    if (data instanceof Array) {
		var i=0; var lim=data.length; var results=[];
		while (i<lim) results.push(this.Import(data[i++]));
		return;}
	    else {
		var qid=data.qid||data.oid||data.uuid;
		if (qid) {
		    var obj=(this.map[qid])||this.ref(qid);
		    // fdjtLog("Calling init (%o) on %o: %o",obj.init,obj,data);
		    obj.init(data);
		    return obj;}
		else return data;}};
	
	Pool.prototype.find=function(prop,val){
	    if (!(this.index)) return [];
	    return this.index(false,prop,val);};

	var uuid_pattern=
	    /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/;
	function getPool(arg){
	    var atpos; 
	    if (arg instanceof KNode) return arg.pool;
	    else if (typeof arg === 'number') return false;
	    else if (typeof arg === 'string') {
		if (((arg[0]===':')&&(arg[1]==='@'))&&
		    (((slash=arg.indexOf('/',2))>=0))) 
		    return fdjtKB.PoolRef(arg.slice(0,slash+1));
		else if ((atpos=arg.indexOf('@'))>1) 
		    return fdjtKB.poolRef(arg.slice(atpos+1));
		else if (arg.search(uuid_pattern)===0) {
		    var uuid_type=arg.slice(34);
		    return fdjtKB.PoolRef("-UUIDTYPE="+uuid_type);}
		else if ((arg[0]===':')&&(arg[1]==='#')&&(arg[2]==='U')&&
			 (arg.search(uuid_pattern)===3)) {
		    var uuid_type=arg.slice(37);
		    return fdjtKB.PoolRef("-UUIDTYPE="+uuid_type);}
		else return false;}
	    else return false;}
	fdjtKB.getPool=getPool;

	function getRef(arg){
	    if (arg instanceof KNode) return arg;
	    else if (typeof arg === 'number') return false;
	    else {
		var pool=getPool(arg);
		if (pool) return pool.ref(arg);
		else return false;}}
	fdjtKB.ref=fdjtKB.getRef=getRef;

	function doimport(data){
	    if (data instanceof Array) {
		var i=0; var lim=data.length; var results=[];
		while (i<lim) results.push(doimport(data[i++]));
		return results;}
	    else {
		var qid=data.qid||data.uuid||data.oid;
		if (qid) {
		    var pool=getPool(qid);
		    if (pool) return pool.Import(data);
		    else return data;}
		else return data;}}
	fdjtKB.Import=doimport;

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

	/* Fast sets */
	function set_sortfn(a,b) {
	    if (a===b) return 0;
	    else if (typeof a === typeof b) {
		if (typeof a === "number")
		    return a-b;
		else if (typeof a === "string")
		    if (a<b) return -1;
		else return 1;
		else if (a.qid)
		    if (b.qid)
			if (a.qid<b.qid) return -1;
		else if (a.qid===b.qid) return 0;
		else return 1;
		else return 1;
		else if (b.qid) return -1;
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
	    if ((!(set1))||(set1.length===0)) return [];
	    if ((!(set2))||(set2.length===0)) return [];
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
	
	function union(set1,set2){
	    if ((!(set1))||(set1.length===0)) return set2;
	    if ((!(set2))||(set2.length===0)) return set1;
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
	    if ((!(set1))||(set1.length===0)) return [];
	    if ((!(set2))||(set2.length===0)) return [];
	    var results=new Array();
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
	
	fdjtKB.contains=contains;
	fdjtKB.position=position;
	
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
	    if ((typeof key === 'string')||(typeof key === 'number'))
		return this.scalar_map[key];
	    else return this.object_map
	    [key.qid||key.oid||key.uuid||key._fdjtid||register(key)];};
	Map.prototype.set=function(key,val) {
	    if ((typeof key === 'string')||(typeof key === 'number'))
		return this.scalar_map[key]=val;
	    else this.object_map
	    [key.qid||key.oid||key.uuid||key._fdjtid||register(key)]=val;};
	Map.prototype.add=function(key,val) {
	    if ((typeof key === 'string')||(typeof key === 'number')) {
		var cur=this.scalar_map[key];
		if (!(cur)) {
		    this.scalar_map[key]=[val];
		    return true;}
		else if (!(cur instanceof Array)) {
		    if (cur===val) return false;
		    else {
			this.scalar_map[key]=[cur,val];
			return true;}}
		else if (contains(cur,val)) return false;
		else {
		    cur.push(val); return true;}}
	    else {
		var objkey=key.qid||key.oid||key.uuid||key._fdjtid||
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
		else if (contains(cur,val)) return false;
		else {
		    cur.push(val); return true;}}};
	Map.prototype.drop=function(key,val) {
	    if (!(val)) {
		if ((typeof key === 'string')||(typeof key === 'number'))
		    delete this.scalar_map[key];
		else delete this.object_map[
		    key.qid||key.oid||key.uuid||key._fdjtid||register(key)];}
	    else if ((typeof key === 'string')||(typeof key === 'number')) {
		var cur=this.scalar_map[key]; var pos=-1;
		if (!(cur)) return false;
		else if (!(cur instanceof Array)) {
		    if (cur===val) {
			delete this.scalar_map[key];
			return true;}
		    else return false;}
		else if ((pos=position(val,cur))>=0) {
		    if (cur.length===1)
			delete this.scalar_map[key];
		    else cur.splice(pos);
		    return true;}
		else return false;}
	    else {
		var objkey=key.qid||key.oid||key.uuid||key._fdjtid||
		    register(key);
		var cur=this.object_map[key];
		if (!(cur)) return false;
		else if (!(cur instanceof Array)) {
		    if (cur===val) {
			delete this.object_map[objkey];
			return true;}
		    else return false;}
		else if ((pos=position(val,cur))>=0) {
		    if (cur.length===1) delete this.object_map[objkey];
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
		    return {scalars: scalar_indices[prop], objects: object_indices[prop]};
		else if ((typeof val === 'string')||(typeof val === 'number'))
		    valkey=val;
		else {
		    valkey=val.qid||val.uuid||val.oid||val._fdjtid||register(val);
		    indices=object_indices;}
		var index=indices[prop];
		if (!(item))
		    if (!(index)) return [];
		else return Set(index[valkey]);
		if (!(index))
		    if (add) {
			indices[prop]=index={};
			index[valkey]=[item];
			return true;}
		else return false;
		var curvals=index[valkey];
		if (curvals) {
		    var pos=position(curvals,val);
		    if (pos<0)
			if (add) {
			    curvals.push(item);
			    return true;}
		    else return false;
		    else if (add) return false;
		    else {
			var sortlen=curvals._sortlen;
			curvals.splice(pos,1);
			if (pos<sortlen) curvals._sortlen--;
			return true;}}
		else if (add) {
		    index[valkey]=Set(item);
		    return true;}
		else return false;};}
	fdjtKB.Index=Index;

	/* KNodes */

	function KNode(pool,qid) {
	    if (pool) this.pool=pool;
	    if (qid) this.qid=qid;
	    return this;}
	fdjtKB.KNode=KNode;
	Pool.prototype.cons=function(qid){return new KNode(this,qid);};

	KNode.prototype.get=function(prop){
	    if (this.hasOwnProperty(prop)) return this[prop];
	    else if (this.pool.storage) {
		var fetched=this.pool.storage.get(this,prop);
		if (typeof fetched !== 'undefined')
		    this[prop]=fetched;
		else if (this.hasOwnProperty(prop))
		    return this[prop];
		else return fetched;}
	    else return undefined;};
	KNode.prototype.getSet=function(prop){
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
	KNode.prototype.getArray=function(prop){
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
	KNode.prototype.add=function(prop,val){
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
	KNode.prototype.drop=function(prop,val){
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
	KNode.prototype.test=function(prop,val){
	    if (this.pool.xforms[prop])
		val=this.pool.xforms[prop](val)||val;
	    if (this.hasOwnProperty(prop)) {
		if (typeof val === 'undefined') return true;
		var cur=this[prop];
		if (cur===val) return true;
		else if (cur instanceof Array)
		    if (contains(cur,val)) return true;
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
	KNode.prototype.init=function(data){
	    var pool=this.pool; var map=pool.map;
	    // fdjtLog("Doing init on %o, _init=%o",this,this._init);
	    for (key in data)
		if (key!=='qid') {
		    var value=data[key];
		    // Add knode aliases when unique
		    if ((key==='uuid')||(key==='oid'))
			if (!(map[value])) map[value]=this;
		    else if (map[value]!==this)
			fdjtLog.warn("identifier conflict %o=%o for %o and %o",
				     key,value,map[value],this);
		    else {}
		    if (value instanceof Array) {
			var i=0; var len=value.length;
			while (i<len) this.add(key,value[i++]);}
		    else this.add(key,value);}
	    if (!(this._init)) {
		var inits=this.pool.inits;
		var i=0; var lim;
		this._init=fdjtTime();
		if (inits) {
		    var lim=inits.length;
		    while (i<lim) inits[i++](this);}
		inits=this._inits;
		if (inits) {
		    delete this._inits;
		    i=0; lim=inits.length;
		    while (i<lim) inits[i++](this);}}
	    return this;};
	KNode.prototype.oninit=function(fcn){
	    if (this._init) {
		fcn(this); return true;}
	    else if (this._inits)
		this._inits.push(fcn);
	    else this._inits=[fcn];
	    return false;};

	/* Using offline storage to back up pools
	   In the simplest model, the QID is just used as a key
	   in local storage to store a JSON version of the object. */

	function OfflineKB(pool){
	    this.pool=pool;
	    return this;}
	function offline_get(obj,prop){
	    var qid=obj.qid||obj.uuid||obj.oid;
	    var data=fdjtState.getLocal(qid);
	    if (data) obj.init(data);
	    return obj[prop];}
	OfflineKB.prototype.get=offline_get;
	OfflineKB.prototype.add=function(obj){
	    var qid=obj.qid||obj.uuid||obj.oid;
	    fdjtState.setLocal(qid,JSON.stringify(obj));};
	OfflineKB.prototype.drop=function(obj){
	    var qid=obj.qid||obj.uuid||obj.oid;
	    fdjtState.setLocal(qid,JSON.stringify(obj));};
	
	/* Miscellaneous array and table functions */

	fdjtKB.add=function(obj,field,val,nodup){
	    if (arguments.length===2)
		return set_add(obj,field);
	    else if (obj instanceof KNode)
		return obj.add.apply(obj,arguments);
	    else if (nodup) 
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

	fdjtKB.drop=function(obj,field,val){
	    if (arguments.length===2)
		return set_drop(obj,field);
	    else if (obj instanceof KNode)
		return obj.drop.apply(obj,arguments);
	    else if (!(val))
		/* Drop all vals */
		obj[field]=new Array();
	    else if (obj.hasOwnProperty(field)) {
		var vals=obj[field];
		var pos=position(vals,val);
		if (pos<0) return;
		else vals.splice(pos,1);}
	    else {}};

	fdjtKB.test=function(obj,field,val){
	    if (arguments.length===2)
		return set_contains(obj,field);
	    else if (obj instanceof KNode)
		return obj.test.apply(obj,arguments);
	    else if (typeof val === "undefined")
		return (((obj.hasOwnProperty) ?
			 (obj.hasOwnProperty(field)) : (obj[field])) &&
			((obj[field].length)>0));
	    else if (obj.hasOwnProperty(field)) 
		if (position(obj[field],val)<0)
		    return false;
	    else return true;
	    else return false;};

	fdjtKB.insert=function(array,value){
	    if (position(array,value)<0) array.push(value);};

	fdjtKB.remove=function(array,value,count){
	    var pos=fdjtIndexOf(array,value);
	    if (pos<0) return array;
	    array.splice(pos,1);
	    if (count) {
		count--;
		while ((count>0) &&
		       ((pos=position(array,value,pos))>=0)) {
		    array.splice(pos,1); count--;}}
	    return array;};

	fdjtKB.indexof=function(array,elt,pos){
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

	fdjtKB.contains=function(array,elt){
	    if (array.indexOf)
		return (array.indexOf(elt)>=0);
	    else {
		var i=0; var len=array.length;
		while (i<len)
		    if (array[i]===elt) return true;
		else i++;
		return false;}};
	
	return fdjtKB;})();

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
