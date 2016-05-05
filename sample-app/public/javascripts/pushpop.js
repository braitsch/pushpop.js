
/*
    Copyright (C) 2016 Stephen Braitsch [http://braitsch.io]
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

function PushPop(config)
{

	/*
		where should we send the data?
	*/

	var api = {
		upload : '/upload',
		delete : '/delete',
	}

	/*
		maximum file size for uploads in megabytes
	*/

	var maxFileSize = undefined;

	if (config){
		if (config.api){
			api.upload = config.api.upload;
			api.delete = config.api.delete;
		}
		if (config.maxFileSize){
			maxFileSize = config.maxFileSize;
		}
	}

	/*
		default thumbnail generator settings
	*/

	var thumb = {
		mode:'normal',
		width:100, height:100,
		ratio:{ width:16, height:9}
	};


	/*
		and these are your two public methods
	*/

	this.openPushModal = function()
	{
		$modalPush.modal('show');
	}

	this.openPopModal = function(target)
	{
		var meta = $(target).data('meta');
		$modalPop.data('id', meta._id);
		var $imagePreview = $('.modal-pop .media-preview img');
		var $videoPreview = $('.modal-pop .media-preview iframe')
		if (meta.type == 'image'){
			$imagePreview.show();
			$imagePreview.attr('src', meta.host+'/'+meta.project+'/'+meta.image);
		}	else if (meta.type == 'video'){
			$videoPreview.show();
			$videoPreview.attr('src', meta.video);
		}
		$modalPop.modal('show');
	}

	/*
		you shouldn't need to change anything below here
	*/

	var $modalPop = $('.modal-pop');
	var $modalPush = $('.modal-push');
	var imageForm = $('.modal-push #image form');
	var videoForm = $('.modal-push #video form');
	var mediaPreview = $('.modal-push .media-preview img');
	var videoPreview = $('.modal-push .media-preview iframe');
	var fileDialog = $('.modal-push .file-dialog');
	var progressbar = $('.modal-push .progress');
	var thumbSettings = $('.modal-push .thumb-settings');
	var mediaDropdown = $('.modal-push .media-dropdown');
	var imageInput = $('.modal-push #image .media-input');
	var videoInput = $('.modal-push #video .media-input');
	var selectButton = $('.modal-push .btn-select');
	var uploadButton = $('.modal-push .btn-upload');
	var saveVideoButton = $('.modal-push .btn-save-video');
	var thumbInstructions = $('.modal-push .instructions')

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
			if (mediaPreview.attr('src') != undefined) thumbInstructions.show();
		}	else if (this.value.toLowerCase() == 'video'){
			$('#image').hide();
			$('#video').show();
			mediaPreview.hide();
			videoPreview.show();
			progressbar.hide();
			thumbSettings.hide();
			thumbInstructions.hide();
		}
	});
// open file dialog when the select button is clicked //
	selectButton.click(function(e){ fileDialog.click(); });
// display a preview when an image is selected //
	fileDialog.change(function(e) {
		clearThumbnail();
		if (this.files && this.files[0]) {
			if (maxFileSize && this.files[0].size/1000/1000 > maxFileSize){
				alert('The maximum file size for uploads in this demo is '+maxFileSize+'MB.');
			}	else{
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
				thumbInstructions.show();
			}
		}
	});
// setup the form to handle the image upload //
	imageForm.ajaxForm({
		url: api.upload,
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
			formData.push({name:'type', value:'image'});
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
				video.url = 'https://www.youtube.com/embed/' + video.id;
				videoPreview.attr('src', video.url)
				video.preview = 'https://img.youtube.com/vi/'+video.id+'/hqdefault.jpg';
			}	else if (video.url.search('vimeo')!= -1){
				video.id = video.url.substring(video.url.lastIndexOf("/") + 1);
				video.url = 'https://player.vimeo.com/video/' + video.id;
				videoPreview.attr('src', video.url);
				$.get('https://vimeo.com/api/v2/video/' + video.id + '.json', function(response){
					video.preview = response[0].thumbnail_large;
				});
			}
	}, 1)});
// setup the form to send the video details //
	videoForm.ajaxForm({
		url: api.upload,
		beforeSubmit: function(formData, jqForm, options) {
			formData.push({name:'type', value:'video'});
			formData.push({name:'url', value:video.url});
			formData.push({name:'preview', value:video.preview});
			return true;
		},
		complete: function(xhr) {
			setTimeout(closeModalAndReloadPage, 500);
		}
	});

	var closeModalAndReloadPage = function()
	{
		$modalPush.modal('hide');
		$modalPush.on('hidden.bs.modal', function (e) { location.reload(true); });
	}

	var closeModalPopAndReloadPage = function()
	{
		$modalPop.modal('hide');
		$modalPop.on('hidden.bs.modal', function (e) { location.reload(true); });
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
	var mouseOffset = parseInt($('.modal-body').css('padding')) + parseInt($('.modal-push .well').css('padding'));
	var clearThumbnail = function()
	{
		$thumb.hide();
		thumb.crop = { };
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
		thumb.crop = { };
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

	$('.modal-pop').on('hidden.bs.modal', function(e){
	// clear and reset window //
		var $imagePreview = $('.modal-pop .media-preview img');
		var $videoPreview = $('.modal-pop .media-preview iframe');
		$imagePreview.hide();
		$imagePreview.attr('src', '');
		$videoPreview.hide();
		$videoPreview.attr('src', '');
	})
	$('.modal-pop form').ajaxForm({
		url: api.delete,
		beforeSubmit: function(formData, jqForm, options) {
			formData.push({name:'id', value:$modalPop.data('id')});
		},
		complete: function(xhr) {
			setTimeout(closeModalPopAndReloadPage, 500);
		}
	});

};


