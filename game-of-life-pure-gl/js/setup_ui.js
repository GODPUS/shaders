var toolbar, compileButton, fullscreenButton, compileTimer, errorLines = [];

function setupUI() {
	canvas = document.createElement( 'canvas' );
	canvas.style.display = 'block';
	document.body.appendChild( canvas );

	toolbar = document.createElement( 'div' );
	toolbar.style.position = 'absolute';
	toolbar.style.top = '25px';
	toolbar.style.left = '25px';
	document.body.appendChild( toolbar );

	var rightside = document.createElement( 'div' );
	rightside.style.cssFloat = 'right';
	toolbar.appendChild( rightside );

	panButton = document.createElement( 'button' );
	panButton.textContent = 'pan/zoom';
	panButton.style.cursor = 'move';
	panButton.style.display = 'none';
	panButton.title = "Pan: left-drag, Zoom: right-drag. Use 'hide code' for a large pan/zoom area.";
	rightside.appendChild( panButton );

	fullscreenButton = document.createElement( 'button' );
	fullscreenButton.textContent = 'fullscreen';
	fullscreenButton.title = 'Press F11 to enter or leave fullscreen mode';
	fullscreenButton.addEventListener( 'click', function ( event ) {

		if (document.body.requestFullScreen) {
			document.body.requestFullScreen();
		} else if (document.body.mozRequestFullScreen) {
			document.body.mozRequestFullScreen();
		} else if (document.body.webkitRequestFullScreen) {
			document.body.webkitRequestFullScreen( Element.ALLOW_KEYBOARD_INPUT );
		}

	}, false );

	rightside.appendChild( fullscreenButton );

	var button = document.createElement( 'a' );
	button.textContent = 'gallery';
	button.href = 'http://glsl.heroku.com/';
	rightside.appendChild( button );

	var button = document.createElement( 'button' );
	button.textContent = 'hide code';
	button.addEventListener( 'click', function ( event ) {

		if ( isCodeVisible() ) {

			button.textContent = 'show code';
			code.getWrapperElement().style.display = 'none';
			compileButton.style.visibility = 'hidden';
			set_save_button('hidden');
			set_parent_button('hidden');
			stopHideUI();

		} else {

			button.textContent = 'hide code';
			code.getWrapperElement().style.display = '';
			compileButton.style.visibility = 'visible';
			set_save_button('visible');
			set_parent_button('visible');

		}

	}, false );
	toolbar.appendChild( button );

	var select = document.createElement( 'select' );

	for ( var i = 0; i < quality_levels.length; i ++ ) {

		var option = document.createElement( 'option' );
		option.textContent = quality_levels[ i ];
		if ( quality_levels[ i ] == quality ) option.selected = true;
		select.appendChild( option );

	}

	select.addEventListener( 'change', function ( event ) {

		quality = quality_levels[ event.target.selectedIndex ];
		onWindowResize();

	}, false );

	toolbar.appendChild( select );

	compileButton = document.createElement( 'button' );
	compileButton.textContent = 'compile';
	compileButton.addEventListener( 'click', function ( event ) {

		compile();

	}, false );
	toolbar.appendChild( compileButton );
}