
$(function() {

	var amount = 100;
	var details = 'open source donation';
// initialize stripe checkout //
	var handler = StripeCheckout.configure({
//		key: 'pk_test_qwrb8GsCjfgqxKOKErYzi66E',
		key: 'pk_live_cNYVmlUIqGkmrqi0coGmrIkt',
		image: '/img/world-series.jpg',
		locale: 'auto',
		panelLabel: 'Donate {{amount}}',
		token: function(token) {
			$('.modal-donate').modal('hide');
			$.post('/charge', { token : token.id, amount : amount, details : details }, 
				function(response){
					console.log('response', response);
					if (response == 'charge complete'){
						alert('THANK YOU!!\nYour donation is greatly appreciated :)');
					}
				}
			);
		}
	});
	$('#donate-btn').on('click', function(e) {
		$('.modal-donate').modal('show');
	});
	$('.modal-donate .btn-donate').on('click', function(e) {
		amount = $('input[name=donationRadios]:checked').val();
//	open checkout with options //
		handler.open({
			name: 'braitsch.io',
			amount: amount,
			description: details
		});
	});
	// close checkout on page navigation //
	$(window).on('popstate', function() { handler.close(); });
});