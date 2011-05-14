function reverse_string(s)
{
    return "".concat.apply("",s.split("").reverse());
}

function reverse_dom(node)
{
    if (!(node)) node=document.body;
    if ((node.nodeType===3)&&(node.nodeValue)) 
	node.nodeValue=reverse_string(node.nodeValue);
    else if (node.nodeType===1) {
	var children=node.childNodes;
	if (children) {
	    var i=0; var lim=children.length;
	    while (i<lim) {
		var child=children[i++];
		if ((child.nodeType===3)&&(child.nodeValue)) {
//		    node.replaceChild(document.createTextNode(reverse_string(child.nodeValue)),child);
		    child.nodeValue=reverse_string(child.nodeValue);}
		else if (child.nodeType===1) reverse_dom(child);}}}
    else {}
}


