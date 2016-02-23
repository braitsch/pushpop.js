$(function() {

	var endpoint = '/gallery';

	var initMediaUploader = function(endpoint){
		var form = $('.image-uploader form');
		var mediaPreview = $('.image-uploader .media-preview img');
		var videoPreview = $('.image-uploader .media-preview iframe');
		var fileDialog = $('.image-uploader .file-dialog');
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
		var thumb = {
		// force set dimensions, this ignores ratio //
			// width:520,
			// height:144,
			// width:800,
			// height:222,
		// ratio only applies if width & height are absent //
			ratio:{
				width:18,
				height:5
			},
		// freeforms if ratio, width, and height are undefined //
			crop:{ x:0, y:0, w:0, h:0 }
		};

	// media toggle //
		mediaDropdown.change(function(e){
			clearThumbnail();
			if (this.value.toLowerCase() == 'image'){
				$('#image').show();
				$('#video').hide();
				mediaPreview.show();
				videoPreview.hide();
			}	else if (this.value.toLowerCase() == 'video'){
				$('#image').hide();
				$('#video').show();
				mediaPreview.hide();
				videoPreview.show();
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
					formData.push({name:'thumb', value:JSON.stringify(thumb)});
				}
				formData.push({name:'caption', value:$('#caption input').val()});
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
				console.log(percentComplete + '%');
			},
			success: function() {
				console.log('success');
			},
			complete: function(xhr) {
				if ($('.modal').length) {
					closeModalAndReloadPage();
				}	else{
					alert('image upload complete');
				}
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
			$('#caption input').val('');
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
		// force preseve aspect ratio is defined //
			if (thumb.ratio) height = width * (thumb.ratio.height/thumb.ratio.width);
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
		// allow resizing if width & height are zero //
			if (!thumb.width && !thumb.height){
				$image.bind("mousemove", resize);
				$image.css('cursor', 'crosshair');
				$thumb.css({ width:0, height:0 });
			}	else{
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
		project heroes & thumbs pages
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


