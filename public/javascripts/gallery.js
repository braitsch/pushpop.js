
$(function() {

	var pushpop = new PushPop();

	$('#grid .item').each(function(index){ 
		$(this).data('index', index);
	// attach the thumbnail/preview image //
		var image = $(this).find('img');
		var media = $(this).data('media');
		var pName = $(this).data('pname');
		if (media.type == 'image'){
			var large = '/' + pName + '/' + media.name + media.ext;
			var thumb = '/' + pName + '/' + media.name + '_thumb' + media.ext;
	// prepend the host url if media is externally hosted //
			if (media.host != undefined) {
				large = media.host + large;
				thumb = media.host + thumb;
			}
			image.attr('src', thumb);
	// store the url to the large image //
			$(this).data('url', large);
		}	else if (media.type == 'video'){
			image.attr('src', media.preview);
	// store the url to the video file //
			$(this).data('url', media.url);
		}
	// show the thumbnail once it's loaded //
		$(this).show();
	// and bind a click handler to open the pop modal //
		$(this).on('click', function(e) { pushpop.openPopModal(this) });
	});

	$('.open-modal-push').click(function(){ pushpop.openPushModal() });

});