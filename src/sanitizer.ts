export function escHtml( str: string ) {
	const htmlEntities: Record< string, string > = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;',
		'`': '&#x60;',
	};

	return str.replace( /[&<>"'`]/g, ( match ) => htmlEntities[ match ] );
}

export function escUrl( url: string ) {
	return encodeURI( url );
}
