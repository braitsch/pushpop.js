
var stripe = require("stripe")(process.env.STRIPE_KEY);

module.exports = function(app) {

	app.post('/charge', function(req, res)
	{
		var stripeToken = req.body.token;
		console.log("stripeToken = ", stripeToken);
	// get the credit card details submitted by the form
		var charge = stripe.charges.create({
			amount: 1000, // amount in cents, again
			currency: "usd",
			source: stripeToken,
			description: "Example charge"
		}, function(e, charge) {
			if (e && e.type === 'StripeCardError') {
				console.log('The card has been declined')
			}
			console.log('charge complete');
			res.send('all good').status(200);
		});
	});
};