
module.exports = function(app) {
	var user = require('../controllers/user.server.controller');
	app.route('/').post(user.login);
	app.route('/register').get(user.render_reg)
						  .post(user.checkuser, user.checkProperty, 
							user.register, user.addProperty);
	app.route('/main/Owner').get(user.render_main_owner)
							.post(user.render_main_owner);
	app.route('/main/Admin').get(user.render_main_admin);
	app.route('/main/Visitor').get(user.render_main_visitor)
								.post(user.render_main_visitor);
	app.route('/addProperty').get(user.render_add_property)
							.post(user.checkProperty, user.addProperty);
	app.route('/manageProperty').get(user.manage_property)
							.post(user.save_property_changes);
	app.route('/deleteProperty').get(user.delete_property);
	app.route('/viewOtherProperties').get(user.render_view_other_properties)
								.post(user.search_other_properties);
	app.route('/viewProperty').get(user.render_property_details);
	app.route('/requestItem').post(user.request_item);
	app.route('/addItemToProperty').post(user.add_property_item);
	app.route('/deletePropertyItem').get(user.delete_property_item);
	app.route('/viewVisitors').get(user.view_visitors);
	app.route('/deleteVisitor').get(user.delete_visitor);
	app.route('/deleteVisitHistory').get(user.delete_visits);
	app.route('/searchVisitors').post(user.search_visitors);
	app.route('/viewOwners').get(user.view_owners);
	app.route('/deleteOwner').get(user.delete_owner);
	app.route('/searchOwners').post(user.search_owners);
	app.route('/viewApprovedItems').get(user.view_approved_items);
	app.route('/searchApprovedItems').post(user.search_approved_items);
	app.route('/addApprovedItem').post(user.add_approved_item);
	app.route('/deleteApprovedItem').get(user.delete_approved_item);
	app.route('/viewPendingItems').get(user.view_pending_items);
	app.route('/approvePendingItem').get(user.approve_pending_item);
	app.route('/deletePendingItem').get(user.delete_pending_item);
	app.route('/viewPendingProperties').get(user.view_pending_properties)
									.post(user.search_pending_properties);
	app.route('/managePendingProperty').post(user.save_pending_property_changes);
	app.route('/viewApprovedProperties').get(user.view_approved_properties)
										.post(user.view_approved_properties);
	app.route('/viewVisitProperty').get(user.view_visit_property)
									.post(user.submit_visit);
	app.route('/viewUnvisitProperty').post(user.remove_visit);
	app.route('/viewVisitHistory').get(user.view_visit_history);
	
	app.route('/logout').get(user.logout);
	
};