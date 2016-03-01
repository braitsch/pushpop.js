
$(function() {

	var pushpop = new PushPop();

	$('#grid .item').each(function(index){ 
		$(this).data('index', index);
	// attach the thumbnail/preview image //
		var image = $(this).find('img');
		var media = $(this).data('media');
		var pName = $(this).data('pname');
		if (media.type == 'image'){
			var thumb = media.host + '/' + pName + '/' + media.name + '_thumb' + media.ext;
			image.attr('src', thumb);
	// store the url to the large image //
			$(this).data('url', media.host + '/' + pName + '/' + media.name + media.ext);
		}	else if (media.type == 'video'){
			image.attr('src', media.preview);
	// store the url to associated video file //
			$(this).data('url', media.url);
		}
	// show the thumbnail once it's loaded //
		$(this).show();
	// and bind a click handler to open the pop modal //
		$(this).on('click', function(e) { pushpop.openPopModal(this) });
	});

	$('.open-modal-push').click(function(){ pushpop.openPushModal() });

});