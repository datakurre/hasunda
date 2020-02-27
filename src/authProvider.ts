import { Log, User, UserManager } from "oidc-client";

Log.logger = console;

const AUTHORITY = "http://keycloak:8080/auth/realms/vasara";
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID || "react-admin";
const REDIRECT_URI =
  process.env.REACT_APP_REDIRECT_URI || "http://localhost:3000/";
const POST_LOGOUT_REDIRECT_URI =
  process.env.REACT_APP_URI || "http://localhost:3000/";
const SESSION_KEY = `oidc.user:${AUTHORITY}:${CLIENT_ID}`;

const clientSettings = {
  authority: AUTHORITY,
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  post_logout_redirect_uri: POST_LOGOUT_REDIRECT_URI,
  response_type: "code",
  scope: "openid email profile",
  filterProtocolClaims: true,
  loadUserInfo: true,
  automaticSilentRenew: true,
  accessTokenExpiringNotificationTime: 30
};

const userManager = new UserManager(clientSettings);

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const mutex = {
  free: true,
  acquire: async () => {
    while (!mutex.free) {
      await sleep(100);
    }
    mutex.free = false;
  },
  release: async () => {
    mutex.free = true;
  }
};

export const getUser = (): [User, null] => {
  return sessionStorage.getItem(SESSION_KEY)
    ? JSON.parse(sessionStorage.getItem(SESSION_KEY) || '"{}"')
    : null;
};

const authProvider = {
  login: async () => {
    try {
      await mutex.acquire();
      await userManager.signinRedirect();
    } finally {
      await mutex.release();
    }
  },
  logout: async () => {
    try {
      await mutex.acquire();
      sessionStorage.clear();
      return "/login";
    } finally {
      await mutex.release();
    }
  },
  checkAuth: async () => {
    try {
      await mutex.acquire();
      const user = getUser();
      if (
        user &&
        new Date(((user as unknown) as User).expires_at * 1000) > new Date()
      ) {
        return;
      } else {
        const qs = window.location.search;
        if (qs.match(/^\?state=/)) {
          await userManager.signinRedirectCallback();
          const href = window.location.href;
          const search = window.location.search;
          window.history.replaceState(
            null,
            "",
            href.substr(0, href.indexOf(search)) +
              href.substr(href.indexOf(search) + search.length)
          );
          return;
        }
      }
      throw await Promise.reject();
    } finally {
      await mutex.release();
    }
  },
  checkError: async () => {},
  getPermissions: async () => {}
};

export default authProvider;
