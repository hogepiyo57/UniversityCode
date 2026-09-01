# 大学コード検索

大学名のよみがなから大学を検索し、大学コード・学部・学科コードを表示するローカルWebアプリです。

## 必要な環境

- Node.js 20以降
- npm

## ローカルでの手動確認

```bash
npm install
npm run data:build
npm run dev
```

表示された `http://localhost:5173/` をブラウザで開きます。

`npm run dev` は手動確認中だけ動かす開発用サーバーです。終了するときは、実行した画面で `Ctrl+C` を押します。GitHubへpushするために起動しておく必要はありません。

本番用の静的ファイルを作る場合は、次を実行します。

```bash
npm run build
```

## GitHub Pagesで公開する手順

このリポジトリはViteでビルドするため、GitHub Actionsを使って`dist`フォルダを公開します。`Deploy from a branch`ではなく、Pagesの公開元に`GitHub Actions`を選択します。

### 1. Viteの公開パスを確認する

`package.json`の`build`コマンドには、リポジトリ名に合わせて`--base=/UniversityCode/`を設定しています。リポジトリ名を変更した場合は、`UniversityCode`も新しいリポジトリ名へ変更します。

### 2. 自動公開用のワークフローを作成する

`.github/workflows/deploy-pages.yml`を作成し、次の内容を保存します。

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7
      - name: Setup Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 20
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Configure Pages
        uses: actions/configure-pages@v6
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: dist
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v5
```

### 3. GitHubへpushする

上記2ファイルをcommitし、`main`ブランチへpushします。

```bash
git add package.json .github/workflows/deploy-pages.yml README.md
git commit -m "GitHub Pagesの公開設定を追加"
git push
```

### 4. GitHub Pagesを有効にする

1. [UniversityCodeリポジトリ](https://github.com/hogepiyo57/UniversityCode)を開きます。
2. `Settings`を開きます。
3. 左側の`Pages`を開きます。
4. `Build and deployment`の`Source`で`GitHub Actions`を選びます。
5. `Actions`タブで`Deploy to GitHub Pages`が成功するまで待ちます。

公開後は次のURLで表示できます。

<https://hogepiyo57.github.io/UniversityCode/>

以後は`main`へpushすると自動的に再ビルド・再公開されます。公開に失敗した場合は、GitHubの`Actions`タブで赤くなっている処理を開いてエラーを確認します。GitHubの画面操作については[GitHub Pagesの公開元設定](https://docs.github.com/ja/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)、Vite固有の設定については[Viteの静的サイト公開手順](https://vite.dev/guide/static-deploy.html#github-pages)を参照してください。

## 検索の仕様

- ひらがなを1文字入力すると、主読み・別名読みの部分一致で候補を表示します。
- カタカナ入力と前後の空白は正規化します。
- 大学を選ぶと、`大学コード-学部コード-学科コード` 形式のコード、学部、学科を表示します。

## データ更新

### 元データ

`大学名称2526.csv` はCP932として読み込みます。`募集単位` が`0`の行を除外し、対象は7,724レコード・1,369大学です。

### 読み仮名一覧

`data/university-readings.csv` をUTF-8 BOMで保存します。最低限、次の列を使用します。

```csv
universityCode,reading,aliases
1005,あさひかわいだい,あさひかわいかだいがく
```

- `universityCode`: 元データにある4桁の大学コード。全1,369大学分を重複なく入力します。
- `reading`: 主読み。ひらがなで入力します。
- `aliases`: 任意。別名読みを`|`区切りで入力します。

既存の一覧で主読みを`notes`列に入力している場合も、互換のため読みとして取り込みます。新規・更新時は`reading`列の使用を推奨します。

Wikipediaの[日本の大学一覧（五十音順）](https://ja.wikipedia.org/wiki/%E6%97%A5%E6%9C%AC%E3%81%AE%E5%A4%A7%E5%AD%A6%E4%B8%80%E8%A6%A7_(%E4%BA%94%E5%8D%81%E9%9F%B3%E9%A0%86))は、読み仮名を確認する際の参考情報として利用できます。公開アプリはWikipediaへ接続しません。

データを更新したら、次を実行して`public/data/universities.json`を再生成します。

```bash
npm run data:build
npm run typecheck
npm test
npm run build
```

## 検証

`npm run data:build` は、次を確認します。

- `募集単位 = 0` が除外されていること
- 7,724レコード・1,369大学であること
- 大学・学部・学科コードがそれぞれ4桁・2桁・2桁であること
- 全大学に主読みがあること
