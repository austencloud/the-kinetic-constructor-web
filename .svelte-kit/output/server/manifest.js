export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "the-kinetic-constructor-web/_app",
	assets: new Set(["button_panel_icons/add_to_dictionary.png","button_panel_icons/clear.png","button_panel_icons/delete.png","button_panel_icons/edit.png","button_panel_icons/eye.png","button_panel_icons/mirror.png","button_panel_icons/rotate.png","button_panel_icons/save_image.png","button_panel_icons/settings.png","button_panel_icons/yinyang1.png","button_panel_icons/yinyang2.png","favicon.png","social_icons/facebook.png","social_icons/github.png","social_icons/instagram.png","social_icons/paypal.png","social_icons/venmo.png","social_icons/youtube.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.CMiyHJBY.js","app":"_app/immutable/entry/app.CXbcJHdo.js","imports":["_app/immutable/entry/start.CMiyHJBY.js","_app/immutable/chunks/entry.CCZbgI99.js","_app/immutable/chunks/runtime.RtuEhzhV.js","_app/immutable/chunks/index-client.Bu5m4nVb.js","_app/immutable/entry/app.CXbcJHdo.js","_app/immutable/chunks/runtime.RtuEhzhV.js","_app/immutable/chunks/render.Cb6QOmHu.js","_app/immutable/chunks/disclose-version.CAWrOviJ.js","_app/immutable/chunks/props.CMG-O-Ur.js","_app/immutable/chunks/index-client.Bu5m4nVb.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
