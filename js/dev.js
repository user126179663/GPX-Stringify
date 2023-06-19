if (
	(
		(location.protocol === 'file:' || location.hostname === 'localhost') &&
		new URLSearchParams(location.search).get('dev') !== '0'
	) ||
	new URLSearchParams(location.search).get('dev') === '1'
) {
	
	const
	
	file = 'assets/sample.gpx',
	
	load = event => fetch(file).then(response => response.text()).then(main, console.error),
	
	main = response => {
		
		for (const v of document.getElementsByTagName('gpx-input')) v.value = response;
		
	};
	
	addEventListener('DOMContentLoaded', load, { once: true });
	
}