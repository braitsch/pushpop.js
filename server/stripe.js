
var stripe = require("stripe")(process.env.STRIPE_KEY);

module.exports = function(app) {

	app.post('/charge', function(req, res)
	{
	// get the credit card details submitted by the form
		var charge = stripe.charges.create({
			currency: "usd",
			source: req.body.token,
			amount: req.body.amount,
			description: req.body.details
		}, function(e, charge) {
			if (e && e.type === 'StripeCardError') {
				console.log('The card has been declined')
			}
			console.log('charge complete', charge);
			res.send('charge complete').status(200);
		});
	});
};