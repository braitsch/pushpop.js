$(function() {

// turn on images after grid layout has initialized //
	$('#grid img').each(function(){
		$(this).show();
		$(this).click(function(){
			var url = $(this).prop('src').replace('_thumb', '');
			window.open(url, '_blank');
		});
	});

	$('.open-modal-push').click(function(){ $('.modal-upload').modal('show'); });
// add delete handler //
	// $('.media a').on('click', function(e) {
	// 	e.preventDefault();
	// 	e.stopImmediatePropagation();
	// 	$.post( endpoint + '/delete', {type:$(this).data('type'), url:$(this).data('url')}, function(response){ location.reload(true); });
	// });

});