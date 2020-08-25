class OAuth2 {
  constructor(provider, client_id, secret, callback_url) {
    this.client_id = client_id;
    this.secret = secret;
    this.callback_url = callback_url;
    this.base;
  }

  generateAuthUrl(scope) {}
}
