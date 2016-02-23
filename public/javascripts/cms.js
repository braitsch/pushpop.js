$(function() {

	var endpoint = '/gallery';
	var thumb = {
		mode:'normal',
		width:100, height:100,
		ratio:{ width:16, height:9},
		crop:{ x:0, y:0, w:0, h:0 }
	};

	var initMediaUploader = function(endpoint){
		var form = $('.image-uploader form');
		var mediaPreview = $('.image-uploader .media-preview img');
		var videoPreview = $('.image-uploader .media-preview iframe');
		var fileDialog = $('.image-uploader .file-dialog');
		var progressbar = $('.image-uploader .progress');
		var thumbSettings = $('.image-uploader .thumb-settings');
		var mediaDropdown = $('.image-uploader .media-dropdown');
		var imageInput = $('.image-uploader #image .media-input');
		var videoInput = $('.image-uploader #video .media-input');
		var selectButton = $('.image-uploader .btn-select');
		var uploadButton = $('.image-uploader .btn-upload');
		var saveVideoButton = $('.image-uploader .btn-save-video');

		var image = {
			width:0,
			height:0,
		};
		var video = {
			url:'',
			preview:'',
		};
	// media toggle //
		mediaDropdown.change(function(e){
			clearThumbnail();
			if (this.value.toLowerCase() == 'image'){
				$('#image').show();
				$('#video').hide();
				mediaPreview.show();
				videoPreview.hide();
				progressbar.show();
				thumbSettings.show();
			}	else if (this.value.toLowerCase() == 'video'){
				$('#image').hide();
				$('#video').show();
				mediaPreview.hide();
				videoPreview.show();
				progressbar.hide();
				thumbSettings.hide();
			}
		});
	// open file dialog when the select button is clicked //
		selectButton.click(function(e){ fileDialog.click(); });
	// display a preview when an image is selected //
		fileDialog.change(function(e) {
			clearThumbnail();
			if (this.files && this.files[0]) {
				var reader = new FileReader();
				reader.onload = function (e) {
				// capture the source image dimensions //
					var img = new Image();
					img.onload = function(){
						image.width = img.width, 
						image.height = img.height;
					};
					img.src = e.target.result;
					mediaPreview.attr('src', e.target.result);
					imageInput.val(fileDialog.val().replace(/C:\\fakepath\\/i, ''));
				}
				reader.readAsDataURL(this.files[0]);
			}
		});
	// setup the form to handle the image upload //
		form.ajaxForm({
			url: endpoint +'/add',
			beforeSubmit: function(formData, jqForm, options) {
			// append any thumbnail data to the form //
				if ($thumb.width() > 0 || $thumb.height() > 0){
			// map values back to original image dimensions //
					var scaleX = image.width/$image.width(); 
					var scaleY = image.height/$image.height();
					thumb.crop.x = ($thumb.offset().left - $image.offset().left) * scaleX;
					thumb.crop.y = ($thumb.offset().top - $image.offset().top) * scaleY;
					thumb.crop.w = $thumb.width() * scaleX;
					thumb.crop.h = $thumb.height() * scaleY;
				/*  
					clear the width & height because only 'fixed size' mode 
					explicitly sets the actual width & height of the thumbnail
				*/
					if (thumb.mode != 'fixed size') {thumb.width = 0; thumb.height = 0};
					formData.push({name:'thumb', value:JSON.stringify(thumb)});
				}
			//	formData.push({name:'caption', value:$('#caption input').val()});
				console.log('------ sending data ------');
				for (var i=0; i < formData.length; i++) {
				// ensure the form has an file before we send it //
					if (formData[i].name == 'file-dialog' && !formData[i].value){
						alert('please select an image');
						return false;
					}
					console.log(i, formData[i].name, formData[i].value);
				}
				return true;
			},
			uploadProgress: function(event, position, total, percentComplete) {
			// last 20% is server side image processing //
				$('.progress-bar').width((percentComplete*.8) + '%');
			},
			success: function() {
				$('.progress-bar').width('100%');
				console.log('success');
			},
			complete: function(xhr) {
				$('.progress-bar').width('100%');
				setTimeout(closeModalAndReloadPage, 500);
			}
		});
		videoInput.bind('paste', function(e){
			setTimeout(function(){
				video.url = videoInput.val();
				if (video.url.search('youtube')!= -1){
					video.id = video.url.substring(video.url.lastIndexOf("?v=") + 3);
					video.url = 'http://www.youtube.com/embed/' + video.id;
					videoPreview.attr('src', video.url)
					video.preview = 'http://img.youtube.com/vi/'+video.id+'/maxresdefault.jpg';
				}	else if (video.url.search('vimeo')!= -1){
					video.id = video.url.substring(video.url.lastIndexOf("/") + 1);
					video.url = 'http://player.vimeo.com/video/' + video.id;
					videoPreview.attr('src', video.url);
					$.get('http://vimeo.com/api/v2/video/' + video.id + '.json', function(response){
						video.preview = response[0].thumbnail_large;
					});
				}
		}, 1)});
		saveVideoButton.click(function(){
			$.post( endpoint + '/add', { type:'video', url:video.url, preview:video.preview}, function(response){
				if ($('.modal').length) closeModalAndReloadPage();
			})
		});
		var closeModalAndReloadPage = function()
		{
			$('.image-uploader').modal('hide');
			$('.image-uploader').on('hidden.bs.modal', function (e) { location.reload(true); });
		}

		/*
			thumbnail settings
		*/

		$('.thumb-settings .w').keyup(onWidthChanged);
		$('.thumb-settings .h').keyup(onHeightChanged);

		function onWidthChanged(e)
		{
			if (validateThumbSize(e)){
				if (thumb.mode == 'fixed size'){
					thumb.width = $(this).val();
				}	else if (thumb.mode == 'fixed ratio'){
					thumb.ratio.width = $(this).val();
				}
				return true;
			}
			return false;
		}		
		function onHeightChanged(e)
		{
			if (validateThumbSize(e)){
				if (thumb.mode == 'fixed size'){
					thumb.height = $(this).val();
				}	else if (thumb.mode == 'fixed ratio'){
					thumb.ratio.height = $(this).val();
				}
				return true;
			}
			return false;
		}
		function validateThumbSize(e) {
			if ($(e.target).val().toString().length == 4) return false;
			var key = window.event ? e.keyCode : e.which;
			if (key === 8 || key === 46 || key === 37 || key === 39) {
				return true;
			} 	else if ( key < 48 || key > 57 ) {
				return false;
			}	else {
				return true;
			}
		};
		$('.thumb-settings .s1').change(function(e) {
			thumb.mode = this.value.toLowerCase();
			if (thumb.mode == 'normal'){
				$('.thumb-settings .w').val('');
				$('.thumb-settings .h').val('');
			}	else if (thumb.mode == 'fixed ratio'){
				$('.thumb-settings .w').val(thumb.ratio.width);
				$('.thumb-settings .h').val(thumb.ratio.height);
			}	else if (thumb.mode == 'fixed size'){
				$('.thumb-settings .w').val(thumb.width);
				$('.thumb-settings .h').val(thumb.height);
			}
			$('.thumb-settings .w').prop('disabled', thumb.mode == 'normal');
			$('.thumb-settings .h').prop('disabled', thumb.mode == 'normal');
		});
		$('.thumb-settings .s2').change(function(e) {
			$('.thumb-generator').css('border-color', this.value.toLowerCase()); 
		});

		/*
			thumbnail generator
		*/
		
		var $image = $('.media-preview img');
		var $thumb = $(".thumb-generator");
		var $container = $('.media-preview');
		$thumb.hide();
		$image.on('dragstart', function(e) { e.preventDefault(); });
		var mouseOffset = parseInt($('.modal-body').css('padding')) + parseInt($('.image-uploader .well').css('padding'));
		var clearThumbnail = function()
		{
			$thumb.hide();
			thumb.crop.x = 0;
			thumb.crop.y = 0;
			thumb.crop.w = 0;
			thumb.crop.h = 0;
		//	$('#caption input').val('');
		}
		var getMousePosition = function(e)
		{
			var mouse = { x:e.clientX + mouseOffset, y:e.clientY + mouseOffset };
			var div = {x:$container.offset().left - $(window).scrollLeft(), y:$container.offset().top - $(window).scrollTop()};
			return { x:(mouse.x - div.x), y:(mouse.y - div.y) };
		}
		var resize = function(e)
		{
			var mouse = getMousePosition(e);
			var width = mouse.x - thumb.crop.x;
			var height = mouse.y - thumb.crop.y;
			if (thumb.mode == 'fixed ratio'){
				height = width * (thumb.ratio.height/thumb.ratio.width);
			}
			$thumb.css({
				width	:width,
				height	:height
			});
		}
		var onMouseDown = function(e)
		{
			var mouse = getMousePosition(e);
			thumb.crop.x = mouse.x;
			thumb.crop.y = mouse.y;
			$thumb.css({
				left	:thumb.crop.x,
				top		:thumb.crop.y,
			});
		// allow resizing //
			if (thumb.mode != 'fixed size'){
				$image.bind("mousemove", resize);
				$image.css('cursor', 'crosshair');
				$thumb.css({ width:0, height:0 });
			}	else{
		// fixed size mode //
				$thumb.css({
					width	:thumb.width * ($image.width()/image.width),
					height	:thumb.height * ($image.height()/image.height)
				});
			}
			$thumb.show();
		}
		var onMouseUp = function()
		{
			$image.css('cursor', 'default');
			$image.unbind("mousemove", resize);
		}
		$(window).bind("mouseup", onMouseUp);
		$image.bind("mousedown", onMouseDown);
		document.addEventListener("keydown", function(e){
	// allow arrow keys to fine tune placement of the thumbnail //
			if ($thumb.is(":visible")){
				if (e.keyCode == 37){
					thumb.crop.x--;
				} else if (e.keyCode == 38){
					thumb.crop.y--;
				} else if (e.keyCode == 39){
					thumb.crop.x++;
				} else if (e.keyCode == 40){
					thumb.crop.y++;
				}
				$thumb.css({ left:thumb.crop.x, top:thumb.crop.y });
			}
		}, false);
	}

	/*
		gallery page layout
	*/

	var initMediaPageLayout = function(endpoint)
	{
		initMediaUploader(endpoint);
		$('.show-modal').click(function(){ $('.image-uploader').modal('show'); });
	// add delete handler //
		$('.media a').on('click', function(e) {
			e.preventDefault();
			e.stopImmediatePropagation();
			$.post( endpoint + '/delete', {type:$(this).data('type'), url:$(this).data('url')}, function(response){ location.reload(true); });
		});
	// and listen for sorting //
		Sortable.create(document.getElementById("media-list"), {
			animation: 500,
			draggable:'.media', 
			onUpdate: function (e) {
				$.post( endpoint + '/sort', {
					oIndex:	e.oldIndex,
					nIndex:	e.newIndex
				}, function(response){
					console.log(response);
				});
			},
		});
	}

	initMediaPageLayout(endpoint);

});


