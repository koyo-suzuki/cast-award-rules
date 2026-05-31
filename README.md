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

必要な環境変数は `.env.example` を参照してください。

Google OAuth の承認済みリダイレクトURIには、次を登録します。

```text
https://YOUR_DOMAIN/api/auth/callback
```

Google Sheets を読むため、サービスアカウントを作成し、対象スプレッドシートをサービスアカウントのメールアドレスに共有してください。

ローカル開発中はページ確認を優先し、認証は要求しません。本番で一時的に認証を外したい場合のみ `VITE_REQUIRE_AUTH=false` を設定します。
