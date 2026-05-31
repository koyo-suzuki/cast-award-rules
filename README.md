# キャスト表彰制度

Vite + React のキャスト向け表彰制度ページです。

## Vercel

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

## Google Login

本番ビルドではGoogleログインを要求します。ログインしたメールが、以下のスプレッドシートの `config_users` タブにある場合のみ閲覧できます。

- Spreadsheet ID: `1p5UgsepNsDkB8Z_V-pEw7nmleHQHKSMaUE7bDT8nFgY`
- Range: `config_users!A:F`

Vercel に設定する環境変数は以下です。

- `GOOGLE_CLIENT_ID`
- `CONFIG_SPREADSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_KEY`
- `DATA_SPREADSHEET_ID`（このページでは未使用。既存運用に合わせて置く場合のみ）

Google Cloud 側では、OAuth クライアントの承認済み JavaScript 生成元に公開ドメインを登録します。

```text
https://YOUR_DOMAIN
```

Google Sheets を読むため、`GOOGLE_SERVICE_ACCOUNT_KEY` に含まれる `client_email` に対象スプレッドシートを共有してください。

ローカル開発中はページ確認を優先し、認証は要求しません。本番で一時的に認証を外したい場合のみ `VITE_REQUIRE_AUTH=false` を設定します。
