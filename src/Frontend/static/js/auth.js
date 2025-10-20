(function () {
	const TOKEN_KEY = 'jwt';

	function _getRawToken() {
		return localStorage.getItem(TOKEN_KEY);
	}

	function saveToken(token) {
		if (!token) return;
		localStorage.setItem(TOKEN_KEY, token);
	}

	function removeToken() {
		localStorage.removeItem(TOKEN_KEY);
	}

	function parseJwt(token) {
		try {
			const payload = token.split('.')[1];
			const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
			const binary = atob(b64);
			// Convert binary string to Uint8Array
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; ++i) {
				bytes[i] = binary.charCodeAt(i);
			}
			// Decode as UTF-8
			const decoded = new TextDecoder().decode(bytes);
			return JSON.parse(decoded);
		} catch (e) {
			return null;
		}
	}

	function getPayload() {
		const t = _getRawToken();
		if (!t) return null;
		return parseJwt(t);
	}

	function isExpired(payload, leewaySeconds = 5) {
		if (!payload || typeof payload.exp === 'undefined') return true;
		const now = Math.floor(Date.now() / 1000);
		return payload.exp + 0 <= now + leewaySeconds;
	}

	function hasRole(required) {
		const payload = getPayload();
		if (!payload) return false;
		const roles = payload.role || payload.roles || payload.access || payload.level;
		if (!roles) return false;
		if (Array.isArray(roles)) return roles.includes(required);
		if (typeof roles === 'number' || /^\d+$/.test(String(roles))) {
			return Number(roles) >= Number(required);
		}
		return String(roles) === String(required);
	}

	function requireAuth(redirectTo = '/login') {
		const t = _getRawToken();
		if (!t) {
			window.location.href = redirectTo;
			return false;
		}
		const payload = parseJwt(t);
		if (!payload || isExpired(payload)) {
			removeToken();
			window.location.href = redirectTo;
			return false;
		}
		return true;
	}

	function requireRole(role, redirectTo = '/login') {
		if (!requireAuth(redirectTo)) return false;
		if (!hasRole(role)) {
			window.location.href = redirectTo;
			return false;
		}
		return true;
	}

	// Expose API
	window.Auth = {
		getToken: _getRawToken,
		saveToken,
		removeToken,
		getPayload,
		isExpired,
		hasRole,
		requireAuth,
		requireRole,
		parseJwt
	};
})();