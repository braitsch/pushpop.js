
$(function() {
// initialize stripe checkout //
	var handler = StripeCheckout.configure({
		key: 'pk_test_qwrb8GsCjfgqxKOKErYzi66E',
		image: '/img/checkout-logo.png',
		locale: 'auto',
		panelLabel: 'Donate {{amount}}',
		token: function(token) {
			$.post('/charge', { token : token.id }, 
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
			description: 'open source donation',
			amount: 2000
		});
		e.preventDefault();
	});
	// close checkout on page navigation //
	$(window).on('popstate', function() { handler.close(); });
});