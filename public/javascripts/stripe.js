
$(function() {

	var amount = 500;
	var details = 'open source donation';
// initialize stripe checkout //
	var handler = StripeCheckout.configure({
//		key: 'pk_test_qwrb8GsCjfgqxKOKErYzi66E',
		key: 'pk_live_cNYVmlUIqGkmrqi0coGmrIkt',
		image: '/img/world-series.jpg',
		locale: 'auto',
		panelLabel: 'Donate {{amount}}',
		token: function(token) {
			$.post('/charge', { token : token.id, amount : amount, details : details }, 
				function(response){
					console.log('response', response);
				}
			);
		}
	});
	$('#donate-btn').on('click', function(e) {
	// open checkout with options //
		handler.open({
			name: 'braitsch.io',
			amount: amount,
			description: details
		});
		e.preventDefault();
	});
	// close checkout on page navigation //
	$(window).on('popstate', function() { handler.close(); });
});