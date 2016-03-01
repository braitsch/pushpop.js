
$(function() {

	var $modalPop = $('.modal-pop');
	var $modalPush = $('.modal-push');
	var $imagePreview = $('.modal-pop .media-preview img');
	var $videoPreview = $('.modal-pop .media-preview iframe')

// turn on images after grid layout has initialized //
	$('#grid img').each(function(){ $(this).show(); });

// bind click handlers to display the push & pop modal windows //
	$('#grid .item').on('click', function(e) {
		$imagePreview.hide();
		$videoPreview.hide();
		if ($(this).data('type') == 'image'){
			$imagePreview.show();
		// get the full image url by slicing off the thumb suffix //
			$imagePreview.attr('src', $(this).find('img').prop('src').replace('_thumb', ''));
		}	else if ($(this).data('type') == 'video'){
			$videoPreview.show();
		// video url is appended to html element as a data attribute //
			$videoPreview.attr('src', $(this).find('img').data('url'))
		}
		$modalPop.modal('show');
		e.preventDefault();
		e.stopImmediatePropagation();
	});
	$('.open-modal-push').click(function(){ $modalPush.modal('show'); });

});